<?php

namespace App\Http\Requests\Hotel;

use Illuminate\Foundation\Http\FormRequest;

class StoreBookingDateRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'requested_check_in_date' => ['required', 'date'],
            'requested_check_out_date' => ['nullable', 'date', 'after_or_equal:requested_check_in_date'],
            'response_note' => ['nullable', 'string', 'max:2000'],
        ];
    }
}

