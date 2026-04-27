<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCountryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'iso2' => ['required', 'string', 'size:2', 'unique:countries,iso2'],
            'dial_code' => ['required', 'string', 'max:10'],
        ];
    }
}
