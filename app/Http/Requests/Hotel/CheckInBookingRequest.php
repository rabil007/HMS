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
            'actual_check_in_date' => ['required', 'date'],
        ];
    }
}

