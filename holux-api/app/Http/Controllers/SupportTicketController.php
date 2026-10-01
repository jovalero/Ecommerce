<?php

namespace App\Http\Controllers;

use App\Services\SupportTicketService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportTicketController extends Controller
{
    /**
     * Public endpoint to submit a support inquiry from the floating widget or web form
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => 'nullable|string|max:50',
            'customer_email' => 'nullable|string|max:150',
            'message' => 'required|string|min:1|max:5000',
            'customer_name' => 'nullable|string|max:100',
            'customer_phone' => 'nullable|string|max:40',
            'subject' => 'nullable|string|max:150',
            'category' => 'nullable|string|max:60',
            'source' => 'nullable|string|max:30',
            'sender' => 'nullable|string|max:20',
        ]);

        if (empty($validated['customer_email'])) {
            $validated['customer_email'] = 'visitante@tienda.com';
        }

        // Check if user is authenticated via Bearer token in headers
        $userId = $request->attributes->get('user_id');
        $tokenPayload = $request->attributes->get('token_payload', []);
        $authEmail = $request->attributes->get('user_email') ?? ($tokenPayload['email'] ?? null);

        if (!empty($userId)) {
            $validated['user_id'] = $userId;
        }

        if (empty($validated['customer_name']) && !empty($tokenPayload['user_metadata']['full_name'])) {
            $validated['customer_name'] = $tokenPayload['user_metadata']['full_name'];
        }

        $ticket = SupportTicketService::create($validated);

        return response()->json([
            'success' => true,
            'message' => '¡Consulta registrada con éxito! Te responderemos a la brevedad.',
            'ticket' => $ticket,
        ], 201);
    }

    /**
     * Get tickets for the currently authenticated customer
     */
    public function myTickets(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('user_id');
        $tokenPayload = $request->attributes->get('token_payload', []);
        $email = $request->attributes->get('user_email') ?? ($tokenPayload['email'] ?? null);

        if (!$email && !$userId) {
            return response()->json(['tickets' => []]);
        }

        $tickets = SupportTicketService::forCustomer((string) $email, $userId);

        return response()->json([
            'success' => true,
            'tickets' => $tickets,
        ]);
    }

    /**
     * Customer replies to an existing ticket
     */
    public function customerReply(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|min:2|max:3000',
        ], [
            'message.required' => 'El mensaje no puede estar vacío.',
        ]);

        $ticket = SupportTicketService::find($id);
        if (!$ticket) {
            return response()->json(['error' => 'Ticket no encontrado.'], 404);
        }

        // Security check: ensure ticket belongs to this customer
        $userId = $request->attributes->get('user_id');
        $tokenPayload = $request->attributes->get('token_payload', []);
        $email = strtolower(trim($request->attributes->get('user_email') ?? ($tokenPayload['email'] ?? '')));

        $ticketEmail = strtolower(trim($ticket['customer_email'] ?? ''));
        $ticketUser = $ticket['user_id'] ?? null;

        if ($email !== $ticketEmail && (!$userId || $userId !== $ticketUser)) {
            return response()->json(['error' => 'No autorizado para responder este ticket.'], 403);
        }

        $customerName = $tokenPayload['user_metadata']['full_name'] ?? ($ticket['customer_name'] ?? 'Cliente');
        $updated = SupportTicketService::addReply($id, $validated['message'], 'customer', $customerName);

        return response()->json([
            'success' => true,
            'message' => 'Mensaje enviado.',
            'ticket' => $updated,
        ]);
    }

    /**
     * Admin: List all tickets with optional status filtering
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status');
        $tickets = SupportTicketService::all();

        if ($status && $status !== 'TODOS') {
            $status = strtoupper(trim($status));
            $tickets = array_values(array_filter($tickets, fn($t) => ($t['status'] ?? '') === $status));
        }

        return response()->json([
            'success' => true,
            'tickets' => $tickets,
        ]);
    }

    /**
     * Admin: Show single ticket details
     */
    public function show(string $id): JsonResponse
    {
        $ticket = SupportTicketService::find($id);
        if (!$ticket) {
            return response()->json(['error' => 'Ticket no encontrado.'], 404);
        }

        return response()->json([
            'success' => true,
            'ticket' => $ticket,
        ]);
    }

    /**
     * Admin: Reply to a ticket
     */
    public function adminReply(Request $request, string $id): JsonResponse
    {
        $text = $request->input('text') ?? $request->input('message');
        if (empty($text) || !is_string($text) || trim($text) === '') {
            return response()->json(['error' => 'El texto de la respuesta es obligatorio.'], 422);
        }

        $ticket = SupportTicketService::find($id);
        if (!$ticket) {
            return response()->json(['error' => 'Ticket no encontrado.'], 404);
        }

        $user = $request->attributes->get('user') ?? [];
        $adminName = $user['name'] ?? $user['full_name'] ?? 'Soporte Holux';

        $updated = SupportTicketService::addReply($id, $text, 'admin', $adminName);

        return response()->json([
            'success' => true,
            'message' => 'Respuesta enviada y guardada con éxito.',
            'ticket' => $updated,
        ]);
    }

    /**
     * Admin: Update ticket status
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:ABIERTO,EN PROCESO,RESUELTO,abierto,en proceso,resuelto',
        ], [
            'status.required' => 'El estado es obligatorio.',
            'status.in' => 'El estado debe ser ABIERTO, EN PROCESO o RESUELTO.',
        ]);

        $ticket = SupportTicketService::find($id);
        if (!$ticket) {
            return response()->json(['error' => 'Ticket no encontrado.'], 404);
        }

        $updated = SupportTicketService::updateStatus($id, $validated['status']);

        return response()->json([
            'success' => true,
            'message' => 'Estado del ticket actualizado con éxito.',
            'ticket' => $updated,
        ]);
    }

    /**
     * Admin: Delete a ticket
     */
    public function destroy(string $id): JsonResponse
    {
        $deleted = SupportTicketService::delete($id);
        if (!$deleted) {
            return response()->json(['error' => 'Ticket no encontrado.'], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Ticket eliminado con éxito.',
        ]);
    }
}
