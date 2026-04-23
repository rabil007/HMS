<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVesselRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $vesselId = $this->route('vessel')?->id;

        return [
            'name' => ['required', 'string', 'max:255', 'unique:vessels,name,'.$vesselId],
        ];
    }
}
