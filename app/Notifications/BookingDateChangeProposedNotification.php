<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Models\BookingDateRequest;
use Carbon\CarbonInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingDateChangeProposedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Booking $booking,
        public BookingDateRequest $dateRequest
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $booking = $this->booking->loadMissing(['hotel']);

        $currentIn = $booking->check_in_date instanceof CarbonInterface ? $booking->check_in_date->toDateString() : (string) $booking->check_in_date;
        $currentOut = $booking->check_out_date instanceof CarbonInterface ? $booking->check_out_date->toDateString() : (string) $booking->check_out_date;

        $requestedIn = $this->dateRequest->requested_check_in_date instanceof CarbonInterface
            ? $this->dateRequest->requested_check_in_date->toDateString()
            : (string) $this->dateRequest->requested_check_in_date;
        $requestedOut = $this->dateRequest->requested_check_out_date instanceof CarbonInterface
            ? $this->dateRequest->requested_check_out_date->toDateString()
            : (string) $this->dateRequest->requested_check_out_date;

        return (new MailMessage)
            ->subject('Hotel requested a date change')
            ->greeting('Hello')
            ->line('The hotel proposed new dates for a pending booking.')
            ->line('Hotel: '.$booking->hotel?->name)
            ->line('Current check-in: '.$currentIn)
            ->line('Current check-out: '.($booking->check_out_date ? $currentOut : 'OPEN'))
            ->line('Requested check-in: '.$requestedIn)
            ->line('Requested check-out: '.($this->dateRequest->requested_check_out_date ? $requestedOut : 'OPEN'))
            ->when((string) ($this->dateRequest->response_note ?? '') !== '', fn (MailMessage $m) => $m->line('Note: '.$this->dateRequest->response_note));
    }
}

