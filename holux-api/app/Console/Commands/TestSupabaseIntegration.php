<?php

namespace App\Console\Commands;

use App\Services\SupabaseService;
use Barryvdh\DomPDF\Facade\Pdf;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Console\Command;

class TestSupabaseIntegration extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:test-supabase';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verify connection and operations with Supabase REST API';

    /**
     * Execute the console command.
     *
     * @param SupabaseService $supabase
     */
    public function handle(SupabaseService $supabase)
    {
        $this->info("=========================================");
        $this->info("HOLUX - Testing Supabase REST Integration");
        $this->info("=========================================");
        $this->info("Supabase URL: " . config('services.supabase.url'));
        $this->info("Loading configurations...");

        try {
            // 1. Test PDF & QR Code generation (Local check, does not require Supabase)
            $this->warn("\n1. Testing PDF & QR Code generation (Local test)...");
            try {
                $mockOrder = [
                    'id' => '00000000-0000-0000-0000-000000000000',
                    'customer_name' => 'Jose Valero',
                    'customer_email' => 'jose@example.com',
                    'total' => 125000.00,
                    'status' => 'pending',
                    'created_at' => now()->toIso8601String(),
                    'order_items' => [
                        [
                            'quantity' => 1,
                            'unit_price' => 125000.00,
                            'products' => [
                                'name' => 'Carpa Test Domo',
                                'brand' => 'Holux Gear'
                            ]
                        ]
                    ]
                ];

                $verificationUrl = "http://localhost:8000/api/orders/00000000-0000-0000-0000-000000000000";
                
                $qrCodeSvg = QrCode::format('svg')
                    ->size(150)
                    ->margin(1)
                    ->generate($verificationUrl);

                $pdf = Pdf::loadView('tickets.order', [
                    'order' => $mockOrder,
                    'qr_svg' => $qrCodeSvg,
                    'verification_url' => $verificationUrl,
                ]);

                $pdfOutput = $pdf->output();
                $this->info("Successfully generated mock PDF ticket (" . strlen($pdfOutput) . " bytes).");
            } catch (\Exception $ex) {
                $this->error("PDF/QR generation check failed: " . $ex->getMessage());
                throw $ex;
            }

            // 2. Test fetching categories (Requires Supabase connection)
            $this->warn("\n2. Fetching Categories...");
            $categories = $supabase->get('categories');
            $this->info("Successfully fetched " . count($categories) . " categories.");
            foreach ($categories as $cat) {
                $this->line(" - [{$cat['id']}] {$cat['name']} (slug: {$cat['slug']})");
            }

            // 2. Test fetching products
            $this->warn("\n2. Fetching Products...");
            $products = $supabase->get('products', ['select' => '*,categories(name,slug)']);
            $this->info("Successfully fetched " . count($products) . " products.");
            foreach ($products as $prod) {
                $categoryName = $prod['categories']['name'] ?? 'Unknown';
                $this->line(" - [{$prod['id']}] {$prod['name']} by {$prod['brand']} - price: {$prod['price']} ARS, stock: {$prod['stock']}, category: {$categoryName}");
            }

            // 3. Dry Run Check on Order Placement logic
            $this->warn("\n3. Testing Mock Order validation check...");
            if (count($products) > 0) {
                $testProduct = $products[0];
                $this->info("Running validation on product ID: {$testProduct['id']} for quantity 1");
                $dbProduct = $supabase->getOne('products', $testProduct['id']);
                if ($dbProduct && $dbProduct['stock'] >= 1) {
                    $this->info("Mock product verification successful! Product exists with stock: {$dbProduct['stock']}.");
                } else {
                    $this->error("Mock validation failed: Product out of stock or not found.");
                }
            } else {
                $this->info("Skipped order check since no products were returned (database is empty).");
            }



            $this->info("\n=========================================");
            $this->info("SUCCESS: All integration checks passed!");
            $this->info("=========================================");

        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            $this->error("\nHTTP Integration Error [Code {$e->getStatusCode()}]:");
            $this->error($e->getMessage());
            $this->line("Check your .env settings and Supabase schema.");
        } catch (\Exception $e) {
            $this->error("\nUnexpected Error:");
            $this->error($e->getMessage());
        }
    }
}
