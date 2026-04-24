<?php

namespace App\Http\Requests\Hotel;

use Illuminate\Foundation\Http\FormRequest;

class ApproveBookingRequest extends FormRequest
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
            'actual_check_out_date' => ['nullable', 'date', 'after_or_equal:actual_check_in_date'],
            'remarks' => ['nullable', 'string', 'max:2000'],
        ];
    }
}

