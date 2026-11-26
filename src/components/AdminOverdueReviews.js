import React from 'react';
import { formatMoney } from './Shared';
import {
    overdueReviews, openReviews, overdueDeliveries, expectedDelivery, formatElapsed, GRACE_DAY_CHOICES,
} from '../lib/reviewWindow';

// Admin: orders where the money is stuck because a buyer has not acted.
//   1. Received, and the 48-hour review window passed with no release or claim.
//   2. Shipped (or ready for pickup) long ago and never marked received, so the
//      window never even started.
// Releasing adds the money to the seller's balance in Payouts.
const AdminOverdueReviews = ({ loc, orders, loading, busyId, onRelease, onMessage, graceDays, onGraceDaysChange }) => {
    const now = Date.now();
    const overdue = overdueReviews(orders, now);
    const stillOpen = openReviews(orders, now);
    const undelivered = overdueDeliveries(orders, graceDays, now);

    const L = loc === 'en' ? {
        title: 'Orders past their review window',
        intro: "The buyer marked these as received more than 48 hours ago and did not release the funds or file a claim in time. They can no longer file one. Nothing releases the money automatically. Releasing adds it to the seller's balance in Payouts.",
        none: 'No orders are past their review window.',
        stillOpen: (n) => `${n} ${n === 1 ? 'order is' : 'orders are'} still inside the 48-hour window.`,
        deliveryTitle: 'Shipped but never marked received',
        deliveryIntro: 'These were shipped (or made ready for pickup) and the buyer has not confirmed receiving them, so the 48-hour window has not started. Check that the item really arrived, for example with the tracking number or by messaging the buyer, before releasing.',
        deliveryNone: 'No deliveries are overdue.',
        showAfter: 'List them this long after the expected delivery date:',
        days: (n) => `${n} ${n === 1 ? 'day' : 'days'}`,
        expectedNote: 'The expected date is 5 days after shipping; compare it with what the seller wrote.',
        loading: 'Loading…',
        overdueBy: 'Overdue by',
        late: 'Expected',
        ago: 'ago',
        buyer: 'Buyer',
        seller: 'Seller',
        received: 'Received',
        deadline: 'Window ended',
        shipped: 'Shipped',
        ready: 'Ready for pickup since',
        expected: 'Expected by',
        sellerSaid: 'Seller said',
        tracking: 'Tracking',
        noTracking: 'none',
        order: 'Order',
        paidWith: 'Paid with',
        release: 'Release funds to seller',
        working: 'Releasing…',
        messageBuyer: 'Message buyer',
        messageSeller: 'Message seller',
    } : {
        title: 'Pedidos con la ventana de revisión vencida',
        intro: 'El comprador marcó estos pedidos como recibidos hace más de 48 horas y no liberó los fondos ni presentó un reclamo a tiempo. Ya no puede presentarlo. Nada libera el dinero automáticamente. Al liberar, se suma al saldo del vendedor en Pagos a Vendedores.',
        none: 'No hay pedidos con la ventana de revisión vencida.',
        stillOpen: (n) => `${n} ${n === 1 ? 'pedido sigue' : 'pedidos siguen'} dentro de la ventana de 48 horas.`,
        deliveryTitle: 'Enviados pero nunca marcados como recibidos',
        deliveryIntro: 'Estos pedidos se enviaron (o quedaron listos para recoger) y el comprador no ha confirmado que los recibió, así que la ventana de 48 horas no ha empezado. Verifica que el artículo realmente llegó, por ejemplo con el rastreo o escribiéndole al comprador, antes de liberar.',
        deliveryNone: 'No hay entregas atrasadas.',
        showAfter: 'Mostrarlos este tiempo después de la fecha estimada de entrega:',
        days: (n) => `${n} ${n === 1 ? 'día' : 'días'}`,
        expectedNote: 'La fecha estimada es 5 días después del envío; compárala con lo que escribió el vendedor.',
        loading: 'Cargando…',
        overdueBy: 'Vencido hace',
        late: 'Esperado hace',
        ago: '',
        buyer: 'Comprador',
        seller: 'Vendedor',
        received: 'Recibido',
        deadline: 'Venció la ventana',
        shipped: 'Enviado',
        ready: 'Listo para recoger desde',
        expected: 'Esperado para',
        sellerSaid: 'El vendedor dijo',
        tracking: 'Rastreo',
        noTracking: 'ninguno',
        order: 'Pedido',
        paidWith: 'Pagado con',
        release: 'Liberar fondos al vendedor',
        working: 'Liberando…',
        messageBuyer: 'Escribir al comprador',
        messageSeller: 'Escribir al vendedor',
    };

    const fmt = (ts) => (ts ? new Date(ts).toLocaleString(loc === 'en' ? 'en-US' : 'es-CR', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

    const renderCard = (o, badge, details) => (
        <div key={o.id} className="border rounded-lg p-4 text-sm space-y-1" data-order-id={o.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-gray-800">{o.itemTitle}</p>
                <span className="seller-badge seller-badge--danger">{badge}</span>
            </div>
            <p className="text-lg font-bold text-purple-700">{formatMoney(o.amount + (o.shippingCost || 0), loc, o.currency)}</p>
            <p className="text-gray-700">
                <strong>{L.buyer}:</strong> {o.buyerName} · <strong>{L.seller}:</strong> {o.sellerName}
                {o.paymentMethod ? <> · {L.paidWith} {o.paymentMethod}</> : null}
            </p>
            {details}
            <p className="text-gray-400 text-xs font-mono break-all">{L.order}: {o.id}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
                <button type="button" className="seller-action-btn" disabled={busyId === o.id} onClick={() => onRelease(o)}>
                    {busyId === o.id ? L.working : L.release}
                </button>
                <button type="button" className="buyer-order-link-btn" onClick={() => onMessage(o.buyerId)}>{L.messageBuyer}</button>
                <button type="button" className="buyer-order-link-btn" onClick={() => onMessage(o.sellerId)}>{L.messageSeller}</button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md border space-y-4" id="overdue-reviews">
                <div>
                    <h2 className="text-2xl font-bold mb-1">{L.title}</h2>
                    <p className="text-sm text-gray-600">{L.intro}</p>
                </div>
                {loading ? (
                    <p className="text-sm text-gray-500">{L.loading}</p>
                ) : (
                    <>
                        {overdue.length === 0 && <p className="text-sm text-gray-500">{L.none}</p>}
                        <div className="space-y-3">
                            {overdue.map(o => renderCard(
                                o,
                                `${L.overdueBy} ${formatElapsed(now - o.confirmationDueAt)}`,
                                <p className="text-gray-500 text-xs">{L.received}: {fmt(o.receivedAt)} · {L.deadline}: {fmt(o.confirmationDueAt)}</p>,
                            ))}
                        </div>
                        {stillOpen.length > 0 && <p className="text-xs text-gray-500">{L.stillOpen(stillOpen.length)}</p>}
                    </>
                )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border space-y-4" id="overdue-deliveries">
                <div>
                    <h2 className="text-2xl font-bold mb-1">{L.deliveryTitle}</h2>
                    <p className="text-sm text-gray-600">{L.deliveryIntro}</p>
                </div>
                <label className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                    {L.showAfter}
                    <select value={graceDays} onChange={(e) => onGraceDaysChange(Number(e.target.value))} className="seller-input">
                        {GRACE_DAY_CHOICES.map(n => <option key={n} value={n}>{L.days(n)}</option>)}
                    </select>
                </label>
                <p className="text-xs text-gray-500">{L.expectedNote}</p>
                {loading ? (
                    <p className="text-sm text-gray-500">{L.loading}</p>
                ) : (
                    <>
                        {undelivered.length === 0 && <p className="text-sm text-gray-500">{L.deliveryNone}</p>}
                        <div className="space-y-3">
                            {undelivered.map(o => renderCard(
                                o,
                                `${L.late} ${formatElapsed(now - expectedDelivery(o))} ${L.ago}`.trim(),
                                <>
                                    <p className="text-gray-500 text-xs">
                                        {o.fulfillment === 'pickup' ? L.ready : L.shipped}: {fmt(o.shippedAt)} · {L.expected}: {fmt(expectedDelivery(o))}
                                    </p>
                                    <p className="text-gray-600 text-xs">
                                        {L.sellerSaid}: “{o.shippingTimeframe || '—'}”
                                        {o.fulfillment !== 'pickup' && <> · {L.tracking}: <span className="font-mono">{o.trackingNumber || L.noTracking}</span></>}
                                    </p>
                                </>,
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminOverdueReviews;
