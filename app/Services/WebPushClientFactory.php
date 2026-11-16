<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\WebPush;

class WebPushClientFactory
{
    /**
     * Same web push client the package builds, plus a logger. Without one, the
     * library reports a missing GMP/BCMath PHP extension with trigger_error(),
     * which Laravel turns into an exception and every push would fail.
     */
    public function make(): WebPush
    {
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
    }
}
