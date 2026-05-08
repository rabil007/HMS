<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BackfillBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'hotel_id' => ['nullable', 'exists:hotels,id'],
            'guest_id' => ['required', 'integer', 'exists:guests,id'],
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'vessel_id' => ['required', 'exists:vessels,id'],
            'rank_id' => ['nullable', 'exists:ranks,id'],
            'guest_check_in' => ['required', 'date'],
            'guest_check_out' => ['nullable', 'date', 'after:guest_check_in'],
            'room_number' => ['nullable', 'string', 'max:50'],
            'single_or_twin' => ['required', 'in:single,twin,triple'],
            'confirmation_number' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'guest_check_in.required' => 'Guest check-in timestamp is required for backfill.',
        ];
    }
}
