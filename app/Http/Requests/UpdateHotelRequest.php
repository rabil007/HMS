<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateHotelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $hotelId = $this->route('hotel')?->id ?? $this->route('hotel');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('hotels', 'name')->ignore($hotelId),
            ],
        ];
    }
}

