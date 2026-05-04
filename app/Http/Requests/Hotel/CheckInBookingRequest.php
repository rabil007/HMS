<?php

namespace App\Http\Requests\Hotel;

use Illuminate\Foundation\Http\FormRequest;

class CheckInBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'confirmation_number' => ['required', 'string', 'max:255'],
            'room_number' => ['required', 'string', 'max:50'],
            'guest_check_in' => ['required', 'date'],
        ];
    }
}
