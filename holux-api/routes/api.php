<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AddressController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\TicketController;

// Admin controllers
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\CustomerController as AdminCustomerController;
use App\Http\Controllers\Admin\AdminController as AdminAdminController;
use App\Http\Controllers\Admin\ReviewController as AdminReviewController;

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group.
|
*/

// ==========================================
// 1. PUBLIC ROUTES (No Auth Required)
// ==========================================
Route::middleware('throttle:api')->group(function () {
    // Health / Keep-alive Ping Route
    Route::get('/ping', function () {
        return response()->json(['status' => 'alive', 'timestamp' => now()->toIso8601String()]);
    });

    // Categories and Products
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::get('/settings', [\App\Http\Controllers\Admin\SettingController::class, 'index']); // Public store & shipping settings
    Route::post('/settings', [\App\Http\Controllers\Admin\SettingController::class, 'update']); // Sync store settings & banners
    Route::put('/settings', [\App\Http\Controllers\Admin\SettingController::class, 'update']);

    // Public Registration with auto-confirm
    Route::post('/register', function (\Illuminate\Http\Request $request) {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6',
            'full_name' => 'nullable|string',
            'phone' => 'nullable|string'
        ]);

        $supabaseUrl = env('SUPABASE_URL', 'https://fmbhcfsrsfkglmvgbnlm.supabase.co');
        $supabaseServiceKey = env('SUPABASE_SERVICE_KEY');

        $response = \Illuminate\Support\Facades\Http::withHeaders([
            'apikey' => $supabaseServiceKey,
            'Authorization' => 'Bearer ' . $supabaseServiceKey,
            'Content-Type' => 'application/json'
        ])->post("{$supabaseUrl}/auth/v1/admin/users", [
            'email' => $request->email,
            'password' => $request->password,
            'email_confirm' => true,
            'user_metadata' => [
                'full_name' => $request->full_name,
                'phone' => $request->phone
            ]
        ]);

        if ($response->successful()) {
            return response()->json([
                'success' => true,
                'message' => 'Usuario registrado y confirmado exitosamente',
                'user' => $response->json()
            ], 201);
        }

        return response()->json($response->json(), $response->status());
    });

    // Sensitive payment and order creation endpoints (Protected with strict rate-limiting)
    Route::middleware('throttle:15,1')->group(function () {
        Route::post('/orders', [OrderController::class, 'store']);
        Route::post('/process_order', [OrderController::class, 'processOrder']);
        Route::post('/orders/process-payment', [OrderController::class, 'processOrder']);
        Route::post('/webhooks/mercadopago', [OrderController::class, 'handleMercadoPagoWebhook']);
    });
});

// ==========================================
// 2. CLIENT PANEL ROUTES (Supabase Auth Required)
// ==========================================
Route::middleware(['throttle:api', 'auth.supabase'])->group(function () {
    // Profile
    Route::get('/me', [ProfileController::class, 'me']);
    Route::patch('/me', [ProfileController::class, 'updateMe']);

    // Shipping Addresses CRUD
    Route::apiResource('/me/addresses', AddressController::class)->names([
        'index' => 'me.addresses.index',
        'store' => 'me.addresses.store',
        'show' => 'me.addresses.show',
        'update' => 'me.addresses.update',
        'destroy' => 'me.addresses.destroy',
    ]);

    // Client Orders
    Route::get('/me/orders', [ProfileController::class, 'myOrders']);
    Route::get('/me/orders/{id}', [ProfileController::class, 'myOrderDetail']);
    Route::post('/me/orders/{id}/receipt', [ProfileController::class, 'uploadReceipt']);
    Route::post('/me/orders/{id}/cancel', [ProfileController::class, 'cancelOrder']);
    Route::get('/me/orders/{id}/ticket', [TicketController::class, 'show']); // Generate customer PDF ticket

    // Reviews
    Route::post('/products/{id}/reviews', [ReviewController::class, 'store']);
    Route::patch('/reviews/{id}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);

    // Coupons & Benefits
    Route::get('/me/coupons', [App\Http\Controllers\CouponController::class, 'index']);
    Route::post('/me/coupons/redeem', [App\Http\Controllers\CouponController::class, 'redeem']);
    Route::post('/me/coupons/apply', [App\Http\Controllers\CouponController::class, 'apply']);

    // Favorites / Wishlist
    Route::get('/favorites', [App\Http\Controllers\FavoriteController::class, 'index']);
    Route::post('/favorites/toggle', [App\Http\Controllers\FavoriteController::class, 'toggle']);
    Route::post('/favorites/sync', [App\Http\Controllers\FavoriteController::class, 'sync']);
});

// ==========================================
// 3. ADMIN PANEL ROUTES (Admin Auth Required)
// ==========================================
Route::prefix('admin')->middleware(['throttle:api', 'auth.supabase', 'auth.admin'])->group(function () {
    // Dashboard Stats
    Route::get('/dashboard', [AdminDashboardController::class, 'index']);

    // Order Management
    Route::get('/orders', [AdminOrderController::class, 'index']);
    Route::get('/orders/{id}', [AdminOrderController::class, 'show']);
    Route::patch('/orders/{id}', [AdminOrderController::class, 'update']); // update status & notes
    Route::get('/orders/{id}/logs', [AdminOrderController::class, 'getLogs']); // fetch status history
    Route::post('/orders/{id}/notify', [AdminOrderController::class, 'resendNotification']); // resend notification email
    Route::get('/orders/{id}/ticket', [TicketController::class, 'show']); // Generate admin PDF ticket

    // Catalog Products CRUD
    Route::apiResource('/products', AdminProductController::class)->names([
        'index' => 'admin.products.index',
        'store' => 'admin.products.store',
        'show' => 'admin.products.show',
        'update' => 'admin.products.update',
        'destroy' => 'admin.products.destroy',
    ]);

    // Advanced Catalog & Stock Module (Server-side search, filters, sorting, bulk actions, CSV import/export)
    Route::get('/productos', [\App\Http\Controllers\Admin\ProductCatalogController::class, 'index']);
    Route::get('/categorias', [\App\Http\Controllers\Admin\ProductCatalogController::class, 'categories']);
    Route::post('/productos/bulk-price', [\App\Http\Controllers\Admin\ProductCatalogController::class, 'bulkPrice']);
    Route::post('/productos/bulk-categoria', [\App\Http\Controllers\Admin\ProductCatalogController::class, 'bulkCategory']);
    Route::post('/productos/bulk-cuotas', [\App\Http\Controllers\Admin\ProductCatalogController::class, 'bulkInstallments']);
    Route::delete('/productos/bulk-delete', [\App\Http\Controllers\Admin\ProductCatalogController::class, 'bulkDelete']);
    Route::get('/productos/export', [\App\Http\Controllers\Admin\ProductCatalogController::class, 'export']);
    Route::post('/productos/import', [\App\Http\Controllers\Admin\ProductCatalogController::class, 'import']);

    // Catalog Categories CRUD
    Route::apiResource('/categories', AdminCategoryController::class)->names([
        'index' => 'admin.categories.index',
        'store' => 'admin.categories.store',
        'show' => 'admin.categories.show',
        'update' => 'admin.categories.update',
        'destroy' => 'admin.categories.destroy',
    ]);

    // Customers & VIP Membership Management
    Route::get('/customers', [AdminCustomerController::class, 'index']);
    Route::get('/customers/{id}', [AdminCustomerController::class, 'show']);
    Route::patch('/customers/{id}', [AdminCustomerController::class, 'update']); // activate/deactivate account
    Route::patch('/customers/{id}/tier', [AdminCustomerController::class, 'updateTier']); // set tier: standard, vip, super_vip
    Route::patch('/customers/{id}/vip', [AdminCustomerController::class, 'toggleVip']); // retrocompatible toggle
    Route::post('/customers/{id}/coupons', [AdminCustomerController::class, 'assignCoupon']); // assign gift coupon to customer
    Route::get('/vip-settings', [AdminCustomerController::class, 'getVipSettings']);
    Route::put('/vip-settings', [AdminCustomerController::class, 'saveVipSettings']);

    // Admin Coupons CRUD & Management
    Route::get('/coupons', [\App\Http\Controllers\CouponController::class, 'index']);
    Route::post('/coupons', [\App\Http\Controllers\CouponController::class, 'store']);
    Route::patch('/coupons/{id}/toggle', [\App\Http\Controllers\CouponController::class, 'toggle']);
    Route::delete('/coupons/{id}', [\App\Http\Controllers\CouponController::class, 'destroy']);

    // Admins management
    Route::post('/admins', [AdminAdminController::class, 'store']); // promote customer to admin

    // Review Moderation
    Route::get('/reviews', [AdminReviewController::class, 'index']); // get all reviews (approved/pending)
    Route::patch('/reviews/{id}', [AdminReviewController::class, 'update']); // approve/reject
    Route::delete('/reviews/{id}', [AdminReviewController::class, 'destroy']); // delete review

    // Store Settings
    Route::get('/settings', [\App\Http\Controllers\Admin\SettingController::class, 'index']);
    Route::post('/settings', [\App\Http\Controllers\Admin\SettingController::class, 'update']);
    Route::put('/settings/tax', [\App\Http\Controllers\Admin\SettingController::class, 'updateTax']);
    Route::put('/settings/payment', [\App\Http\Controllers\Admin\SettingController::class, 'updatePayment']);
    Route::put('/settings/shipping', [\App\Http\Controllers\Admin\SettingController::class, 'updateShipping']);
    Route::get('/settings/logs', [\App\Http\Controllers\Admin\SettingController::class, 'getLogs']);

    // Media Upload (Supabase Storage CDN)
    Route::post('/upload', [\App\Http\Controllers\Admin\MediaUploadController::class, 'store']);
    Route::post('/media/upload', [\App\Http\Controllers\Admin\MediaUploadController::class, 'store']);
});
