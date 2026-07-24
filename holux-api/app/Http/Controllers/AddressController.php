<?php

namespace App\Http\Controllers;

use App\Services\SupabaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AddressController extends Controller
{
    /**
     * List all shipping addresses of the logged-in client.
     *
     * @param Request $request
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function index(Request $request, SupabaseService $supabase): JsonResponse
    {
        $userId = $request->attributes->get('user_id');

        $addresses = $supabase->get('addresses', [
            'customer_id' => 'eq.' . $userId,
            'order' => 'is_default.desc,label.asc', // Put default address on top
        ], true);

        return response()->json($addresses);
    }

    /**
     * Store a new shipping address.
     *
     * @param Request $request
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function store(Request $request, SupabaseService $supabase): JsonResponse
    {
        $userId = $request->attributes->get('user_id');

        $request->validate([
            'label' => ['required', 'string', 'max:100'],
            'street' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:100'],
            'province' => ['required', 'string', 'max:100'],
            'postal_code' => ['required', 'string', 'max:20'],
            'is_default' => ['nullable', 'boolean'],
        ]);

        $isDefault = $request->boolean('is_default', false);

        try {
            // If setting as default, unset other addresses
            if ($isDefault) {
                $existing = $supabase->get('addresses', ['customer_id' => 'eq.' . $userId], true);
                foreach ($existing as $addr) {
                    if ($addr['is_default']) {
                        $supabase->update('addresses', $addr['id'], ['is_default' => false], true);
                    }
                }
            }

            $data = [
                'customer_id' => $userId,
                'label' => $request->label,
                'street' => $request->street,
                'city' => $request->city,
                'province' => $request->province,
                'postal_code' => $request->postal_code,
                'is_default' => $isDefault,
            ];

            $inserted = $supabase->insert('addresses', $data, true);

            return response()->json($inserted[0], 201);
        } catch (\Exception $e) {
            Log::error('Address creation failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al crear la dirección.'
            ], 500);
        }
    }

    /**
     * Update an existing address.
     *
     * @param Request $request
     * @param string $id
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function update(Request $request, string $id, SupabaseService $supabase): JsonResponse
    {
        $userId = $request->attributes->get('user_id');

        $address = $supabase->getOne('addresses', $id, true);

        if (empty($address)) {
            return response()->json([
                'message' => 'Dirección no encontrada.'
            ], 404);
        }

        // Security check
        if ($address['customer_id'] !== $userId) {
            return response()->json([
                'message' => 'Acceso denegado. Esta dirección pertenece a otro usuario.'
            ], 403);
        }

        $request->validate([
            'label' => ['required', 'string', 'max:100'],
            'street' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:100'],
            'province' => ['required', 'string', 'max:100'],
            'postal_code' => ['required', 'string', 'max:20'],
            'is_default' => ['nullable', 'boolean'],
        ]);

        $isDefault = $request->boolean('is_default', false);

        try {
            // If setting as default, unset other addresses
            if ($isDefault) {
                $existing = $supabase->get('addresses', ['customer_id' => 'eq.' . $userId], true);
                foreach ($existing as $addr) {
                    if ($addr['is_default'] && $addr['id'] !== $id) {
                        $supabase->update('addresses', $addr['id'], ['is_default' => false], true);
                    }
                }
            }

            $data = [
                'label' => $request->label,
                'street' => $request->street,
                'city' => $request->city,
                'province' => $request->province,
                'postal_code' => $request->postal_code,
                'is_default' => $isDefault,
            ];

            $updated = $supabase->update('addresses', $id, $data, true);

            return response()->json($updated[0]);
        } catch (\Exception $e) {
            Log::error('Address update failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al actualizar la dirección.'
            ], 500);
        }
    }

    /**
     * Delete an address.
     *
     * @param Request $request
     * @param string $id
     * @param SupabaseService $supabase
     * @return JsonResponse
     */
    public function destroy(Request $request, string $id, SupabaseService $supabase): JsonResponse
    {
        $userId = $request->attributes->get('user_id');

        $address = $supabase->getOne('addresses', $id, true);

        if (empty($address)) {
            return response()->json([
                'message' => 'Dirección no encontrada.'
            ], 404);
        }

        // Security check
        if ($address['customer_id'] !== $userId) {
            return response()->json([
                'message' => 'Acceso denegado. Esta dirección pertenece a otro usuario.'
            ], 403);
        }

        try {
            $supabase->delete('addresses', $id, true);
            
            return response()->json([
                'message' => 'Dirección eliminada correctamente.'
            ]);
        } catch (\Exception $e) {
            Log::error('Address deletion failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al eliminar la dirección.'
            ], 500);
        }
    }
}
