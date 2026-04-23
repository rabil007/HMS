<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRankRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rankId = $this->route('rank')?->id;

        return [
            'name' => ['required', 'string', 'max:255', 'unique:ranks,name,'.$rankId],
        ];
    }
}
