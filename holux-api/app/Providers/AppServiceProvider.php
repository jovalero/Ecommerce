<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Force HTTPS for all assets and URLs in production or behind reverse proxies (Render)
        if (config('app.env') !== 'local' || request()->server('HTTP_X_FORWARDED_PROTO') === 'https') {
            URL::forceScheme('https');
        }

        RateLimiter::for('api', function (Request $request) {
            // Never throttle admin settings, media uploads or health check
            if ($request->is('api/settings*') || $request->is('api/upload*') || $request->is('api/admin/*') || $request->is('api/ping')) {
                return Limit::none();
            }
            return Limit::perMinute(2000)->by($request->user()?->id ?: $request->ip());
        });
    }
}
