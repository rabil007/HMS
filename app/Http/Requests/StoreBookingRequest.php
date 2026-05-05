<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'hotel_id' => ['nullable', 'exists:hotels,id'],
            'check_in_date' => ['required', 'date', 'after_or_equal:today'],
            'check_out_date' => ['nullable', 'date', 'after:check_in_date'],
            'guest_name' => ['required', 'string', 'max:255'],
            'guest_email' => ['nullable', 'email', 'max:255'],
            'guest_phone' => ['nullable', 'string', 'max:255'],
            'rank_id' => ['nullable', 'exists:ranks,id'],
            'vessel_id' => ['required', 'exists:vessels,id'],
            'single_or_twin' => ['required', 'string', 'max:50'],
        ];
    }
}
