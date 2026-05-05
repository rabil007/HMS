<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateGuestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('guest')) ?? false;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $guestId = $this->route('guest')?->id;

        return [
            'full_name' => ['required', 'string', 'max:255'],
            'email' => [
                'nullable', 'email', 'max:255',
                Rule::unique('guests', 'email')->ignore($guestId)->whereNull('deleted_at'),
            ],
            'phone' => [
                'nullable', 'string', 'max:50',
                Rule::unique('guests', 'phone')->ignore($guestId)->whereNull('deleted_at'),
            ],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => $this->blankToNull($this->input('email')),
            'phone' => $this->blankToNull($this->input('phone')),
            'notes' => $this->blankToNull($this->input('notes')),
        ]);
    }

    private function blankToNull(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }
}
