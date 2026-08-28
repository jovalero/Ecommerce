<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return view('welcome');
});

// Serve uploaded public storage files cleanly even without symlinks on Render
Route::get('/storage/{path}', function ($path) {
    if (Storage::disk('public')->exists($path)) {
        return response()->file(Storage::disk('public')->path($path), [
            'Access-Control-Allow-Origin' => '*',
            'Cache-Control' => 'public, max-age=31536000'
        ]);
    }
    abort(404);
})->where('path', '.*');
