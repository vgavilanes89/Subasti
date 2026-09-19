import React, { useState, useEffect, useCallback } from 'react';
import { CRC } from './Shared';

const money = (amount, currency, loc) => CRC(amount, loc, currency);

const moneysByCurrency = (byCurrency, loc) => {
    const entries = Object.entries(byCurrency || {}).filter(([, v]) => v > 0);
    if (entries.length === 0) return '—';
    return entries.map(([currency, v]) => money(v, currency, loc)).join(' + ');
};

const EMPTY_FORM = {
    realName: '', profileName: '', email: '', cedula: '',
    countryCode: '', phone: '', province: '', city: '',
};

const AdminUserDetailModal = ({ userId, loc, onClose, onUserUpdated }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    const L = loc === 'en' ? {
        profile: 'Profile', edit: 'Edit', cancel: 'Cancel', save: 'Save Changes', saving: 'Saving…',
        realName: 'Full Name', profileName: 'Profile Name', email: 'Email', cedula: 'Cédula',
        countryCode: 'Country Code', phone: 'Phone', province: 'Province', city: 'City',
        stats: 'Statistics', spent: 'Total Spent', earned: 'Total Earned',
        ordersAsBuyer: 'Orders as Buyer', ordersAsSeller: 'Orders as Seller',
        itemsListed: 'Items Listed', activeListings: 'Active Listings',
        bidsPlaced: 'Bids Placed', auctionsWon: 'Auctions Won', watching: 'Watching',
        purchaseHistory: 'Purchase History', salesHistory: 'Sales History',
        listedItems: 'Items Listed', bidHistory: 'Bid History', watchlist: 'Watchlist',
        item: 'Item', with: 'With', status: 'Status', amount: 'Amount', date: 'Date',
        price: 'Price', winning: 'Winning', outbid: 'Outbid', ended: 'Ended',
        noData: 'None yet.', loading: 'Loading…', close: 'Close',
        joined: 'Joined',
    } : {
        profile: 'Perfil', edit: 'Editar', cancel: 'Cancelar', save: 'Guardar Cambios', saving: 'Guardando…',
        realName: 'Nombre Completo', profileName: 'Nombre de Perfil', email: 'Correo', cedula: 'Cédula',
        countryCode: 'Código de País', phone: 'Teléfono', province: 'Provincia', city: 'Ciudad',
        stats: 'Estadísticas', spent: 'Total Gastado', earned: 'Total Ganado',
        ordersAsBuyer: 'Pedidos como Comprador', ordersAsSeller: 'Pedidos como Vendedor',
        itemsListed: 'Artículos Publicados', activeListings: 'Publicaciones Activas',
        bidsPlaced: 'Pujas Realizadas', auctionsWon: 'Subastas Ganadas', watching: 'Siguiendo',
        purchaseHistory: 'Historial de Compras', salesHistory: 'Historial de Ventas',
        listedItems: 'Artículos Publicados', bidHistory: 'Historial de Pujas', watchlist: 'Lista de Seguimiento',
        item: 'Artículo', with: 'Con', status: 'Estado', amount: 'Monto', date: 'Fecha',
        price: 'Precio', winning: 'Ganando', outbid: 'Superado', ended: 'Terminada',
        noData: 'Aún no hay nada.', loading: 'Cargando…', close: 'Cerrar',
        joined: 'Se unió',
    };

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/admin/user-detail?id=${encodeURIComponent(userId)}`);
            if (!res.ok) throw new Error('LOAD_FAILED');
            const body = await res.json();
            setData(body);
            setForm({
                realName: body.profile.realName || '',
                profileName: body.profile.profileName || '',
                email: body.profile.email || '',
                cedula: body.profile.cedula || '',
                countryCode: body.profile.countryCode || '',
                phone: body.profile.phone || '',
                province: body.profile.province || '',
                city: body.profile.city || '',
            });
        } catch {
            setError(loc === 'en' ? 'Could not load this user.' : 'No se pudo cargar este usuario.');
        } finally {
            setLoading(false);
        }
    }, [userId, loc]);

    useEffect(() => { load(); }, [load]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaveError('');
        try {
            const res = await fetch('/api/admin/update-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, ...form }),
            });
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || 'SAVE_FAILED');
            setData(prev => ({ ...prev, profile: body }));
            setEditing(false);
            onUserUpdated?.(body);
        } catch (err) {
            setSaveError(err.message === 'SAVE_FAILED' ? (loc === 'en' ? 'Save failed.' : 'Error al guardar.') : err.message);
        } finally {
            setSaving(false);
        }
    };

    const StatCard = ({ title, value }) => (
        <div className="bg-gray-50 p-3 rounded-lg border">
            <h4 className="text-xs text-gray-500 font-medium">{title}</h4>
            <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
    );

    const field = (name, label, type = 'text') => (
        <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
            {editing ? (
                <input
                    type={type}
                    value={form[name]}
                    onChange={(e) => setForm(prev => ({ ...prev, [name]: e.target.value }))}
                    className="w-full p-2 border rounded-lg text-sm"
                    required
                />
            ) : (
                <p className="text-sm text-gray-800">{data.profile[name] || '—'}</p>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {loading ? L.loading : data?.profile.profileName}
                    </h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                </div>

                {loading && <p className="text-gray-500">{L.loading}</p>}
                {error && <p className="text-red-500">{error}</p>}

                {data && !loading && (
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-bold">{L.profile}</h3>
                                {!editing ? (
                                    <button type="button" onClick={() => setEditing(true)} className="text-sm font-semibold text-purple-600 hover:underline">{L.edit}</button>
                                ) : (
                                    <button type="button" onClick={() => { setEditing(false); setSaveError(''); }} className="text-sm font-semibold text-gray-500 hover:underline">{L.cancel}</button>
                                )}
                            </div>
                            <form onSubmit={handleSave}>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {field('profileName', L.profileName)}
                                    {field('realName', L.realName)}
                                    {field('email', L.email, 'email')}
                                    {field('cedula', L.cedula)}
                                    {field('countryCode', L.countryCode)}
                                    {field('phone', L.phone)}
                                    {field('province', L.province)}
                                    {field('city', L.city)}
                                </div>
                                {!editing && (
                                    <p className="text-xs text-gray-400 mt-3">{L.joined}: {data.profile.createdAt ? new Date(data.profile.createdAt).toLocaleDateString() : '—'}</p>
                                )}
                                {saveError && <p className="text-sm text-red-500 mt-3">{saveError}</p>}
                                {editing && (
                                    <div className="flex justify-end mt-4">
                                        <button type="submit" disabled={saving} className="bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-60">
                                            {saving ? L.saving : L.save}
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-3">{L.stats}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <StatCard title={L.spent} value={moneysByCurrency(data.stats.spentByCurrency, loc)} />
                                <StatCard title={L.earned} value={moneysByCurrency(data.stats.earnedByCurrency, loc)} />
                                <StatCard title={L.ordersAsBuyer} value={data.stats.ordersAsBuyer} />
                                <StatCard title={L.ordersAsSeller} value={data.stats.ordersAsSeller} />
                                <StatCard title={L.itemsListed} value={data.stats.itemsListed} />
                                <StatCard title={L.activeListings} value={data.stats.activeListings} />
                                <StatCard title={L.bidsPlaced} value={data.stats.bidsPlaced} />
                                <StatCard title={L.auctionsWon} value={data.stats.auctionsWon} />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-2">{L.purchaseHistory}</h3>
                            {data.buyerOrders.length === 0 ? <p className="text-sm text-gray-400">{L.noData}</p> : (
                                <table className="w-full text-sm text-left text-gray-500">
                                    <tbody>
                                        {data.buyerOrders.map(o => (
                                            <tr key={o.id} className="border-b">
                                                <td className="py-2">{o.itemTitle}</td>
                                                <td className="py-2 text-gray-400">{L.with} {o.counterpartyName}</td>
                                                <td className="py-2">{o.status}</td>
                                                <td className="py-2 text-right">{money(o.amount + (o.shippingCost || 0), o.currency, loc)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-2">{L.salesHistory}</h3>
                            {data.sellerOrders.length === 0 ? <p className="text-sm text-gray-400">{L.noData}</p> : (
                                <table className="w-full text-sm text-left text-gray-500">
                                    <tbody>
                                        {data.sellerOrders.map(o => (
                                            <tr key={o.id} className="border-b">
                                                <td className="py-2">{o.itemTitle}</td>
                                                <td className="py-2 text-gray-400">{L.with} {o.counterpartyName}</td>
                                                <td className="py-2">{o.status}</td>
                                                <td className="py-2 text-right">{money(o.amount + (o.shippingCost || 0), o.currency, loc)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-2">{L.listedItems}</h3>
                            {data.listedItems.length === 0 ? <p className="text-sm text-gray-400">{L.noData}</p> : (
                                <table className="w-full text-sm text-left text-gray-500">
                                    <tbody>
                                        {data.listedItems.map(i => (
                                            <tr key={i.id} className="border-b">
                                                <td className="py-2">{i.title}</td>
                                                <td className="py-2 text-gray-400">{i.saleType === 'auc' ? 'Auction' : 'Buy Now'}</td>
                                                <td className="py-2 text-right">{money(i.saleType === 'auc' ? (i.currentBid ?? i.price) : i.price, i.currency, loc)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-2">{L.bidHistory}</h3>
                            {data.bids.length === 0 ? <p className="text-sm text-gray-400">{L.noData}</p> : (
                                <table className="w-full text-sm text-left text-gray-500">
                                    <tbody>
                                        {data.bids.map(b => (
                                            <tr key={b.id} className="border-b">
                                                <td className="py-2">{b.itemTitle}</td>
                                                <td className="py-2 text-right">{money(b.amount, b.currency, loc)}</td>
                                                <td className="py-2 text-gray-400">{new Date(b.placedAt).toLocaleDateString()}</td>
                                                <td className="py-2 text-right">
                                                    <span className={`text-xs font-semibold uppercase ${b.isWinning ? 'text-green-600' : 'text-gray-400'}`}>
                                                        {b.isWinning ? L.winning : L.outbid}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-2">{L.watchlist}</h3>
                            {data.favorites.length === 0 ? <p className="text-sm text-gray-400">{L.noData}</p> : (
                                <table className="w-full text-sm text-left text-gray-500">
                                    <tbody>
                                        {data.favorites.map(f => (
                                            <tr key={f.itemId} className="border-b">
                                                <td className="py-2">{f.itemTitle}</td>
                                                <td className="py-2 text-right">
                                                    {money(f.saleType === 'auc' ? (f.currentBid ?? f.price) : f.price, f.currency, loc)}
                                                </td>
                                                <td className="py-2 text-gray-400 text-right">
                                                    {f.saleType === 'auc' && f.endAt && f.endAt < Date.now() ? L.ended : ''}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUserDetailModal;
