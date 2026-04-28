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

class BookingApprovedNotification extends Notification implements ShouldQueue
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
        $booking = $this->booking->loadMissing(['hotel', 'approvedBy', 'rank', 'vessel']);

        $url = ($notifiable->role ?? null) === Role::Hotel
            ? route('hotel.bookings.show', $booking, absolute: false)
            : route('bookings.show', $booking, absolute: false);

        $checkInBase = $booking->actual_check_in_date ?? $booking->check_in_date;
        $checkOutBase = $booking->actual_check_out_date ?? $booking->check_out_date;
        $checkIn = $checkInBase instanceof CarbonInterface ? $checkInBase->toDateString() : (string) $checkInBase;
        $checkOut = $checkOutBase instanceof CarbonInterface ? $checkOutBase->toDateString() : (string) $checkOutBase;

        return [
            'type' => 'booking_approved',
            'title' => 'Booking approved',
            'body' => ($booking->guest_name ?? 'Guest').' • '.($booking->hotel?->name ?? 'Hotel').' • '.$checkIn.' → '.($checkOutBase ? $checkOut : 'OPEN'),
            'url' => $url,
            'booking_id' => $booking->id,
            'meta' => [
                'hotel' => $booking->hotel?->name,
                'rank' => $booking->rank?->name,
                'vessel' => $booking->vessel?->name,
                'check_in' => $checkIn,
                'check_out' => $checkOutBase ? $checkOut : null,
                'actor' => $booking->approvedBy?->name,
                'remarks' => $booking->remarks,
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $booking = $this->booking->loadMissing(['hotel']);

        $checkIn = $booking->check_in_date instanceof CarbonInterface ? $booking->check_in_date->toDateString() : (string) $booking->check_in_date;
        $checkOut = $booking->check_out_date instanceof CarbonInterface ? $booking->check_out_date->toDateString() : (string) $booking->check_out_date;

        return (new MailMessage)
            ->subject('Booking request approved')
            ->greeting('Hello')
            ->line('Your booking request has been approved.')
            ->line('Hotel: '.$booking->hotel?->name)
            ->line('Confirmation #: '.($booking->confirmation_number ?? '—'))
            ->line('QR: '.($booking->confirmation_number ?? '—'))
            ->line('Remarks: '.($booking->remarks ?? '—'))
            ->line('Check-in: '.$checkIn)
            ->line('Check-out: '.($booking->check_out_date ? $checkOut : 'OPEN'));
    }
}
