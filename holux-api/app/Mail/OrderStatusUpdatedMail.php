<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OrderStatusUpdatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public array $order;
    public string $statusKey;
    public string $statusTitle;
    public string $statusMessage;
    public ?string $rejectionReason;

    /**
     * Create a new message instance.
     */
    public function __construct(array $order, string $statusKey, ?string $rejectionReason = null)
    {
        $this->order = $order;
        $this->statusKey = $statusKey;
        $this->rejectionReason = $rejectionReason ?: ($order['rejection_reason'] ?? null);

        $titles = [
            'paid' => '¡Pago Confirmado y Aprobado!',
            'completed' => '¡Pago Confirmado y Aprobado!',
            'pending_review' => 'Comprobante Recibido - Pago en Revisión',
            'pending_payment' => 'Pedido Creado - Esperando Pago',
            'pending' => 'Pedido Creado - Esperando Pago',
            'rejected' => 'Pago No Aprobado / Rechazado',
            'cancelled' => 'Pedido Cancelado',
        ];

        $messages = [
            'paid' => 'Hemos confirmado tu pago correctamente. Tu pedido ya está siendo preparado para el envío.',
            'completed' => 'Hemos confirmado tu pago correctamente. Tu pedido ya está siendo preparado para el envío.',
            'pending_review' => 'Recibimos tu comprobante de transferencia. Nuestro equipo lo está revisando y te notificaremos cuando sea acreditado.',
            'pending_payment' => 'Tu pedido fue registrado. Por favor completa el pago o adjunta tu comprobante para procesarlo.',
            'pending' => 'Tu pedido fue registrado. Por favor completa el pago o adjunta tu comprobante para procesarlo.',
            'rejected' => 'Lamentamos informarte que no pudimos validar el pago de tu pedido.',
            'cancelled' => 'Tu pedido ha sido cancelado.',
        ];

        $this->statusTitle = $titles[$statusKey] ?? 'Actualización de Pedido';
        $this->statusMessage = $messages[$statusKey] ?? 'El estado de tu pedido ha cambiado.';
    }

    /**
     * Build the message.
     */
    public function build(): self
    {
        $orderIdShort = strtoupper(substr($this->order['id'] ?? '000000', -6));
        $subject = "Holux Gear - #HLX-{$orderIdShort}: {$this->statusTitle}";

        return $this->subject($subject)
                    ->view('emails.order_status_updated');
    }
}
