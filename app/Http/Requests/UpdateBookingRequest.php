<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('booking'));
    }

    public function rules(): array
    {
        return [
            'hotel_id' => ['required', 'exists:hotels,id'],
            'check_in_date' => ['required', 'date', 'after_or_equal:today'],
            'check_out_date' => ['nullable', 'date', 'after:check_in_date'],
            'guest_name' => ['nullable', 'string', 'max:255'],
            'guest_phone' => ['nullable', 'string', 'max:255'],
            'rank_id' => ['nullable', 'exists:ranks,id'],
            'vessel_id' => ['nullable', 'exists:vessels,id'],
            'single_or_twin' => ['nullable', 'string', 'max:50'],
        ];
    }
}
