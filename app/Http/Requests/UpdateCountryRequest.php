<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCountryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $countryId = $this->route('country')?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'iso2' => ['required', 'string', 'size:2', 'unique:countries,iso2,'.$countryId],
            'dial_code' => ['required', 'string', 'max:10'],
        ];
    }
}
