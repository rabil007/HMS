<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Models\BookingDateRequest;
use Carbon\CarbonInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingDateChangeAcceptedNotification extends Notification
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

        $requestedIn = $this->dateRequest->requested_check_in_date instanceof CarbonInterface
            ? $this->dateRequest->requested_check_in_date->toDateString()
            : (string) $this->dateRequest->requested_check_in_date;
        $requestedOut = $this->dateRequest->requested_check_out_date instanceof CarbonInterface
            ? $this->dateRequest->requested_check_out_date->toDateString()
            : (string) $this->dateRequest->requested_check_out_date;

        return (new MailMessage)
            ->subject('Client accepted date change')
            ->greeting('Hello')
            ->line('The client accepted the proposed date change.')
            ->line('Hotel: '.$booking->hotel?->name)
            ->line('Check-in: '.$requestedIn)
            ->line('Check-out: '.($this->dateRequest->requested_check_out_date ? $requestedOut : 'OPEN'))
            ->when((string) ($this->dateRequest->response_note ?? '') !== '', fn (MailMessage $m) => $m->line('Note: '.$this->dateRequest->response_note));
    }
}

