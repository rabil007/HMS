<?php

namespace App\Notifications;

use App\Enums\Role;
use App\Models\Booking;
use App\Notifications\Concerns\BookingNotificationChannels;
use Carbon\CarbonInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class BookingCheckedInNotification extends Notification implements ShouldQueue
{
    use BookingNotificationChannels, Queueable;

    public function __construct(
        public Booking $booking
    ) {}

    protected function sendsMail(): bool
    {
        return false;
    }

    public function toArray(object $notifiable): array
    {
        $booking = $this->booking->loadMissing(['hotel', 'rank', 'vessel']);

        $url = ($notifiable->role ?? null) === Role::Hotel
            ? route('hotel.stays.show', $booking, absolute: false)
            : route('bookings.show', $booking, absolute: false);

        $checkedInAt = $booking->guest_check_in instanceof CarbonInterface
            ? $booking->guest_check_in->format('Y-m-d H:i')
            : (string) $booking->guest_check_in;

        return [
            'type' => 'booking_checked_in',
            'title' => 'Guest checked in',
            'body' => ($booking->guest_name ?? 'Guest').' • '.($booking->hotel?->name ?? 'Hotel').' • Room '.($booking->room_number ?: '—').' • '.$checkedInAt,
            'url' => $url,
            'booking_id' => $booking->id,
            'meta' => [
                'hotel' => $booking->hotel?->name,
                'rank' => $booking->rank?->name,
                'vessel' => $booking->vessel?->name,
                'room_number' => $booking->room_number,
                'checked_in_at' => $checkedInAt,
            ],
        ];
    }
}
