<?php

namespace App\Notifications;

use App\Models\Booking;
use Carbon\CarbonInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingRequestedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Booking $booking
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $booking = $this->booking->loadMissing(['hotel', 'user', 'client', 'rank', 'vessel']);

        $checkIn = $booking->check_in_date instanceof CarbonInterface ? $booking->check_in_date->toDateString() : (string) $booking->check_in_date;
        $checkOut = $booking->check_out_date instanceof CarbonInterface ? $booking->check_out_date->toDateString() : (string) $booking->check_out_date;

        return (new MailMessage)
            ->subject('New booking request received')
            ->greeting('Hello')
            ->line('A new booking request has been submitted.')
            ->line('Hotel: '.$booking->hotel?->name)
            ->line('Guest: '.($booking->guest_name ?? '—'))
            ->line('Check-in: '.$checkIn)
            ->line('Check-out: '.($booking->check_out_date ? $checkOut : 'OPEN'));
    }
}
