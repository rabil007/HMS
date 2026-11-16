<?php

namespace App\Notifications;

use App\Enums\Role;
use App\Models\Booking;
use App\Notifications\Concerns\BookingNotificationChannels;
use Carbon\CarbonInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class BookingCheckedOutNotification extends Notification implements ShouldQueue
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

        $checkedOutAt = $booking->guest_check_out instanceof CarbonInterface
            ? $booking->guest_check_out->format('Y-m-d H:i')
            : (string) $booking->guest_check_out;

        return [
            'type' => 'booking_checked_out',
            'title' => 'Guest checked out',
            'body' => ($booking->guest_name ?? 'Guest').' • '.($booking->hotel?->name ?? 'Hotel').' • Room '.($booking->room_number ?: '—').' • '.$checkedOutAt,
            'url' => $url,
            'booking_id' => $booking->id,
            'meta' => [
                'hotel' => $booking->hotel?->name,
                'rank' => $booking->rank?->name,
                'vessel' => $booking->vessel?->name,
                'room_number' => $booking->room_number,
                'checked_out_at' => $checkedOutAt,
            ],
        ];
    }
}
