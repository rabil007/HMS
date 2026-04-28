<?php

namespace App\Notifications;

use App\Enums\Role;
use App\Models\Booking;
use Carbon\CarbonInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Services\EmailSettings;

class BookingRejectedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Booking $booking
    ) {}

    public function via(object $notifiable): array
    {
        $channels = ['database'];

        if (app(EmailSettings::class)->enabled()) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toArray(object $notifiable): array
    {
        $booking = $this->booking->loadMissing(['hotel']);

        $url = ($notifiable->role ?? null) === Role::Hotel
            ? route('hotel.bookings.show', $booking, absolute: false)
            : route('bookings.show', $booking, absolute: false);

        return [
            'type' => 'booking_rejected',
            'title' => 'Booking rejected',
            'body' => ($booking->guest_name ?? 'Guest').' • '.($booking->hotel?->name ?? 'Hotel'),
            'url' => $url,
            'booking_id' => $booking->id,
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $booking = $this->booking->loadMissing(['hotel']);

        $checkIn = $booking->check_in_date instanceof CarbonInterface ? $booking->check_in_date->toDateString() : (string) $booking->check_in_date;
        $checkOut = $booking->check_out_date instanceof CarbonInterface ? $booking->check_out_date->toDateString() : (string) $booking->check_out_date;

        return (new MailMessage)
            ->subject('Booking request rejected')
            ->greeting('Hello')
            ->line('Your booking request has been rejected.')
            ->line('Hotel: '.$booking->hotel?->name)
            ->line('Remarks: '.($booking->remarks ?? '—'))
            ->line('Check-in: '.$checkIn)
            ->line('Check-out: '.($booking->check_out_date ? $checkOut : 'OPEN'));
    }
}
