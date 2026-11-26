import React from 'react';
import { formatMoney } from './Shared';
import { overdueReviews, openReviews, formatElapsed } from '../lib/reviewWindow';

// Admin: orders whose 48-hour buyer review window has passed with no release and
// no claim. Releasing here adds the money to the seller's balance in Payouts.
const AdminOverdueReviews = ({ loc, orders, loading, busyId, onRelease }) => {
    const now = Date.now();
    const overdue = overdueReviews(orders, now);
    const stillOpen = openReviews(orders, now);

    const L = loc === 'en' ? {
        title: 'Orders past their review window',
        intro: 'The buyer marked these as received more than 48 hours ago and has neither released the funds nor filed a claim. Nothing releases them automatically. Releasing adds the money to the seller\'s balance in Payouts.',
        none: 'No orders are past their review window.',
        stillOpen: (n) => `${n} ${n === 1 ? 'order is' : 'orders are'} still inside the 48-hour window.`,
        loading: 'Loading…',
        overdueBy: 'Overdue by',
        buyer: 'Buyer',
        seller: 'Seller',
        received: 'Received',
        deadline: 'Window ended',
        order: 'Order',
        paidWith: 'Paid with',
        release: 'Release funds to seller',
        working: 'Releasing…',
    } : {
        title: 'Pedidos con la ventana de revisión vencida',
        intro: 'El comprador marcó estos pedidos como recibidos hace más de 48 horas y no ha liberado los fondos ni presentado un reclamo. Nada los libera automáticamente. Al liberar, el dinero se suma al saldo del vendedor en Pagos a Vendedores.',
        none: 'No hay pedidos con la ventana de revisión vencida.',
        stillOpen: (n) => `${n} ${n === 1 ? 'pedido sigue' : 'pedidos siguen'} dentro de la ventana de 48 horas.`,
        loading: 'Cargando…',
        overdueBy: 'Vencido hace',
        buyer: 'Comprador',
        seller: 'Vendedor',
        received: 'Recibido',
        deadline: 'Venció la ventana',
        order: 'Pedido',
        paidWith: 'Pagado con',
        release: 'Liberar fondos al vendedor',
        working: 'Liberando…',
    };

    const fmt = (ts) => (ts ? new Date(ts).toLocaleString(loc === 'en' ? 'en-US' : 'es-CR', { dateStyle: 'medium', timeStyle: 'short' }) : '—');

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border space-y-4">
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
                        {overdue.map(o => (
                            <div key={o.id} className="border rounded-lg p-4 text-sm space-y-1" data-order-id={o.id}>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="font-bold text-gray-800">{o.itemTitle}</p>
                                    <span className="seller-badge seller-badge--danger">{L.overdueBy} {formatElapsed(now - o.confirmationDueAt)}</span>
                                </div>
                                <p className="text-lg font-bold text-purple-700">{formatMoney(o.amount + (o.shippingCost || 0), loc, o.currency)}</p>
                                <p className="text-gray-700">
                                    <strong>{L.buyer}:</strong> {o.buyerName} · <strong>{L.seller}:</strong> {o.sellerName}
                                    {o.paymentMethod ? <> · {L.paidWith} {o.paymentMethod}</> : null}
                                </p>
                                <p className="text-gray-500 text-xs">{L.received}: {fmt(o.receivedAt)} · {L.deadline}: {fmt(o.confirmationDueAt)}</p>
                                <p className="text-gray-400 text-xs font-mono break-all">{L.order}: {o.id}</p>
                                <div className="pt-2">
                                    <button type="button" className="seller-action-btn" disabled={busyId === o.id} onClick={() => onRelease(o)}>
                                        {busyId === o.id ? L.working : L.release}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {stillOpen.length > 0 && <p className="text-xs text-gray-500">{L.stillOpen(stillOpen.length)}</p>}
                </>
            )}
        </div>
    );
};

export default AdminOverdueReviews;
