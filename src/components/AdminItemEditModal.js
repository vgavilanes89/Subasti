import React, { useState } from 'react';

const toDatetimeLocal = (ms) => {
    if (!ms) return '';
    const d = new Date(ms);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const AdminItemEditModal = ({ item, loc, onClose, onSaved }) => {
    const isAuction = item.saleType === 'auc';
    const [form, setForm] = useState({
        title: item.title || '',
        description: item.description || '',
        category: item.category || '',
        subCategory: item.subCategory || '',
        currency: item.currency || 'CRC',
        price: item.price ?? '',
        condition: item.condition || 'new',
        conditionDetail: item.conditionDetail || '',
        quantity: item.quantity ?? 1,
        shippingShip: !!item.shippingShip,
        shippingLocal: !!item.shippingLocal,
        shippingCost: item.shippingCost ?? 0,
        buyNowPrice: item.buyNowPrice ?? '',
        reservePrice: item.reservePrice ?? '',
        endAt: toDatetimeLocal(item.endAt),
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const L = loc === 'en' ? {
        title: 'Edit Item', save: 'Save Changes', saving: 'Saving…', cancel: 'Cancel',
        itemTitle: 'Title', description: 'Description', category: 'Category', subCategory: 'Subcategory',
        currency: 'Currency', price: isAuction ? 'Starting Price' : 'Price', condition: 'Condition',
        conditionNew: 'New', conditionUsed: 'Used', conditionDetail: 'Condition Detail',
        quantity: 'Quantity', shippingShip: 'Available for shipping', shippingCost: 'Shipping Cost',
        shippingLocal: 'Local pickup available', buyNowPrice: 'Buy Now Price (optional)',
        reservePrice: 'Reserve Price (optional)', endAt: 'Auction End Date/Time',
        saveFailed: 'Save failed. Please try again.',
    } : {
        title: 'Editar Artículo', save: 'Guardar Cambios', saving: 'Guardando…', cancel: 'Cancelar',
        itemTitle: 'Título', description: 'Descripción', category: 'Categoría', subCategory: 'Subcategoría',
        currency: 'Moneda', price: isAuction ? 'Precio Inicial' : 'Precio', condition: 'Condición',
        conditionNew: 'Nuevo', conditionUsed: 'Usado', conditionDetail: 'Detalle de Condición',
        quantity: 'Cantidad', shippingShip: 'Disponible para envío', shippingCost: 'Costo de Envío',
        shippingLocal: 'Recogida local disponible', buyNowPrice: 'Precio de Compra Inmediata (opcional)',
        reservePrice: 'Precio de Reserva (opcional)', endAt: 'Fecha/Hora de Fin de Subasta',
        saveFailed: 'Error al guardar. Intenta de nuevo.',
    };

    const set = (name) => (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const res = await fetch('/api/admin/update-item', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: item.id, ...form }),
            });
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || 'SAVE_FAILED');
            onSaved(body);
            onClose();
        } catch {
            setError(L.saveFailed);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">{L.title}</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">{L.itemTitle}</label>
                        <input type="text" value={form.title} onChange={set('title')} className="w-full p-2 border rounded-lg text-sm" required />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">{L.description}</label>
                        <textarea value={form.description} onChange={set('description')} className="w-full p-2 border rounded-lg text-sm" rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">{L.category}</label>
                            <input type="text" value={form.category} onChange={set('category')} className="w-full p-2 border rounded-lg text-sm" required />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">{L.subCategory}</label>
                            <input type="text" value={form.subCategory} onChange={set('subCategory')} className="w-full p-2 border rounded-lg text-sm" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">{L.currency}</label>
                            <select value={form.currency} onChange={set('currency')} className="w-full p-2 border rounded-lg text-sm">
                                <option value="CRC">CRC</option>
                                <option value="USD">USD</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">{L.price}</label>
                            <input type="number" step="0.01" value={form.price} onChange={set('price')} className="w-full p-2 border rounded-lg text-sm" required />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">{L.condition}</label>
                            <select value={form.condition} onChange={set('condition')} className="w-full p-2 border rounded-lg text-sm">
                                <option value="new">{L.conditionNew}</option>
                                <option value="used">{L.conditionUsed}</option>
                            </select>
                        </div>
                    </div>
                    {form.condition === 'used' && (
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">{L.conditionDetail}</label>
                            <input type="text" value={form.conditionDetail} onChange={set('conditionDetail')} className="w-full p-2 border rounded-lg text-sm" />
                        </div>
                    )}

                    {!isAuction && (
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">{L.quantity}</label>
                            <input type="number" min="1" value={form.quantity} onChange={set('quantity')} className="w-full p-2 border rounded-lg text-sm" />
                        </div>
                    )}

                    {isAuction && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 block mb-1">{L.reservePrice}</label>
                                <input type="number" step="0.01" value={form.reservePrice} onChange={set('reservePrice')} className="w-full p-2 border rounded-lg text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 block mb-1">{L.buyNowPrice}</label>
                                <input type="number" step="0.01" value={form.buyNowPrice} onChange={set('buyNowPrice')} className="w-full p-2 border rounded-lg text-sm" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 block mb-1">{L.endAt}</label>
                                <input type="datetime-local" value={form.endAt} onChange={set('endAt')} className="w-full p-2 border rounded-lg text-sm" required />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input type="checkbox" checked={form.shippingShip} onChange={set('shippingShip')} />
                            {L.shippingShip}
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input type="checkbox" checked={form.shippingLocal} onChange={set('shippingLocal')} />
                            {L.shippingLocal}
                        </label>
                    </div>
                    {form.shippingShip && (
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">{L.shippingCost}</label>
                            <input type="number" step="0.01" value={form.shippingCost} onChange={set('shippingCost')} className="w-full p-2 border rounded-lg text-sm" />
                        </div>
                    )}

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="text-sm font-semibold text-gray-600 hover:underline">{L.cancel}</button>
                        <button type="submit" disabled={saving} className="bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-60">
                            {saving ? L.saving : L.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminItemEditModal;
