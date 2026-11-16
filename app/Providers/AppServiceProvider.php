<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Auth\Middleware\RedirectIfAuthenticated;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Minishlink\WebPush\WebPush;
use NotificationChannels\WebPush\WebPushChannel;

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
        $this->configureDefaults();
        $this->configureWebPush();

        RedirectIfAuthenticated::redirectUsing(fn () => route('dashboard'));
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        Model::preventLazyLoading(! app()->isProduction());

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    /**
     * Same web push client the package builds, plus a logger. Without one, the
     * library reports a missing GMP/BCMath PHP extension with trigger_error(),
     * which Laravel turns into an exception and every push would fail.
     */
    protected function configureWebPush(): void
    {
        $this->app->when(WebPushChannel::class)
            ->needs(WebPush::class)
            ->give(function (): WebPush {
                $auth = [];
                $publicKey = config('webpush.vapid.public_key');
                $privateKey = config('webpush.vapid.private_key');

                if (filled($publicKey) && filled($privateKey)) {
                    $auth['VAPID'] = [
                        'subject' => config('webpush.vapid.subject') ?: url('/'),
                        'publicKey' => $publicKey,
                        'privateKey' => $privateKey,
                    ];
                }

                return (new WebPush($auth, [], 30, (array) config('webpush.client_options', []), Log::channel()))
                    ->setReuseVAPIDHeaders(true)
                    ->setAutomaticPadding(config('webpush.automatic_padding', true));
            });
    }
}
