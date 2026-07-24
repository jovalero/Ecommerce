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
    // Categories and Products
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::get('/products/{id}/reviews', [ReviewController::class, 'index']); // Approved reviews

    // Orders (Allows both guests and authenticated checkouts)
    Route::post('/orders', [OrderController::class, 'store']);
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
    Route::post('/me/orders/{id}/cancel', [ProfileController::class, 'cancelOrder']);
    Route::get('/me/orders/{id}/ticket', [TicketController::class, 'show']); // Generate customer PDF ticket

    // Reviews
    Route::post('/products/{id}/reviews', [ReviewController::class, 'store']);
    Route::patch('/reviews/{id}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);
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
    Route::patch('/orders/{id}', [AdminOrderController::class, 'update']); // update status
    Route::get('/orders/{id}/ticket', [TicketController::class, 'show']); // Generate admin PDF ticket

    // Catalog Products CRUD
    Route::apiResource('/products', AdminProductController::class)->names([
        'index' => 'admin.products.index',
        'store' => 'admin.products.store',
        'show' => 'admin.products.show',
        'update' => 'admin.products.update',
        'destroy' => 'admin.products.destroy',
    ]);

    // Catalog Categories CRUD
    Route::apiResource('/categories', AdminCategoryController::class)->names([
        'index' => 'admin.categories.index',
        'store' => 'admin.categories.store',
        'show' => 'admin.categories.show',
        'update' => 'admin.categories.update',
        'destroy' => 'admin.categories.destroy',
    ]);

    // Customers management
    Route::get('/customers', [AdminCustomerController::class, 'index']);
    Route::get('/customers/{id}', [AdminCustomerController::class, 'show']);
    Route::patch('/customers/{id}', [AdminCustomerController::class, 'update']); // activate/deactivate account

    // Admins management
    Route::post('/admins', [AdminAdminController::class, 'store']); // promote customer to admin

    // Review Moderation
    Route::get('/reviews', [AdminReviewController::class, 'index']); // get all reviews (approved/pending)
    Route::patch('/reviews/{id}', [AdminReviewController::class, 'update']); // approve/reject
    Route::delete('/reviews/{id}', [AdminReviewController::class, 'destroy']); // delete review
});
