<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_email' => ['required', 'email', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:50'],
            'customer_dni' => ['nullable', 'string', 'max:50'],
            'shipping_address' => ['nullable', 'string', 'max:500'],
            'shipping_method' => ['nullable', 'string', 'max:100'],
            'payment_method' => ['nullable', 'string', 'max:50'],
            'receipt_url' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'string'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }

    /**
     * Custom messages for validation errors.
     */
    public function messages(): array
    {
        return [
            'customer_name.required' => 'El nombre del cliente es obligatorio.',
            'customer_email.required' => 'El email del cliente es obligatorio.',
            'customer_email.email' => 'El formato del email no es válido.',
            'items.required' => 'Debe incluir al menos un producto en el pedido.',
            'items.min' => 'Debe incluir al menos un producto en el pedido.',
            'items.*.product_id.required' => 'El ID del producto es obligatorio.',
            'items.*.product_id.uuid' => 'El ID del producto debe ser un UUID válido.',
            'items.*.quantity.required' => 'La cantidad del producto es obligatoria.',
            'items.*.quantity.integer' => 'La cantidad del producto debe ser un número entero.',
            'items.*.quantity.min' => 'La cantidad mínima del producto es 1.',
        ];
    }
}
