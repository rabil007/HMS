<?php

namespace App\Providers;

use App\Services\MailSettings;
use App\Services\WebPushClientFactory;
use App\Services\WebPushReportLogger;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Middleware\RedirectIfAuthenticated;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Queue\Events\JobProcessing;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Minishlink\WebPush\WebPush;
use NotificationChannels\WebPush\Events\NotificationFailed;
use NotificationChannels\WebPush\Events\NotificationSent;
use NotificationChannels\WebPush\WebPushChannel;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(MailSettings::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureWebPush();
        $this->configureMail();

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
     * Use our web push client (with a logger) for the notification channel.
     */
    protected function configureWebPush(): void
    {
        $this->app->when(WebPushChannel::class)
            ->needs(WebPush::class)
            ->give(fn (): WebPush => $this->app->make(WebPushClientFactory::class)->make());

        Event::listen(NotificationSent::class, [WebPushReportLogger::class, 'sent']);
        Event::listen(NotificationFailed::class, [WebPushReportLogger::class, 'failed']);
    }

    /**
     * Mail settings saved in Settings → Email override the .env values. Applied
     * when the mailer is first used, and again before each queued job so a
     * long-running queue worker picks up changes without a restart.
     */
    protected function configureMail(): void
    {
        $this->app->afterResolving('mail.manager', function (): void {
            $this->app->make(MailSettings::class)->apply();
        });

        Event::listen(JobProcessing::class, function (): void {
            $this->app->make(MailSettings::class)->apply(refreshMailers: true);
        });
    }
}
