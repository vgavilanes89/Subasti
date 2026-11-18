import React, { useState } from 'react';
import { COSTA_RICA_LOCATIONS } from '../data/Constants';
import * as walletApi from '../api/wallet';

const EMPTY_FORM = (realName) => ({ id: null, alias: '', fullName: realName || '', address: '', province: '', city: '', postalCode: '' });

const SavedAddressesSection = ({ loc, user, wallet }) => {
    const { addresses, setAddresses, loading, error: loadError, refresh } = wallet;
    const [form, setForm] = useState(null); // null = closed
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState(null);

    const L = loc === 'en' ? {
        title: 'Saved addresses',
        intro: 'Delivery addresses you can pick at checkout. Your default address is selected automatically.',
        empty: 'You have no saved addresses yet.',
        add: 'Add address',
        edit: 'Edit',
        remove: 'Delete',
        confirmRemove: 'Delete this address?',
        makeDefault: 'Make default',
        defaultBadge: 'Default',
        alias: 'Label (optional)',
        aliasHelp: 'e.g. Home, Office',
        fullName: 'Full name',
        province: 'Province',
        city: 'City',
        selectProvince: 'Select province',
        selectCity: 'Select city',
        address: 'Address',
        addressHelp: 'Street, house or building number, directions',
        postalCode: 'Postal code',
        save: 'Save address',
        saving: 'Saving…',
        cancel: 'Cancel',
        loading: 'Loading…',
        loadError: 'We could not load your saved information.',
        retry: 'Try again',
        errors: {
            INVALID_NAME: 'Enter the recipient name.',
            INVALID_ADDRESS: 'Enter the full address (at least 5 characters).',
            INVALID_PROVINCE: 'Choose a province.',
            INVALID_CITY: 'Choose a city in that province.',
            INVALID_POSTAL_CODE: 'Enter the postal code.',
            TOO_MANY_ADDRESSES: 'You can save up to 10 addresses. Delete one to add another.',
            REQUEST_FAILED: 'Could not save. Please try again.',
        },
    } : {
        title: 'Direcciones guardadas',
        intro: 'Direcciones de entrega que puedes elegir al pagar. Tu dirección predeterminada se selecciona sola.',
        empty: 'Aún no tienes direcciones guardadas.',
        add: 'Agregar dirección',
        edit: 'Editar',
        remove: 'Eliminar',
        confirmRemove: '¿Eliminar esta dirección?',
        makeDefault: 'Hacer predeterminada',
        defaultBadge: 'Predeterminada',
        alias: 'Nombre (opcional)',
        aliasHelp: 'ej. Casa, Oficina',
        fullName: 'Nombre completo',
        province: 'Provincia',
        city: 'Cantón',
        selectProvince: 'Selecciona provincia',
        selectCity: 'Selecciona cantón',
        address: 'Dirección',
        addressHelp: 'Calle, número de casa o edificio, señas',
        postalCode: 'Código postal',
        save: 'Guardar dirección',
        saving: 'Guardando…',
        cancel: 'Cancelar',
        loading: 'Cargando…',
        loadError: 'No pudimos cargar tu información guardada.',
        retry: 'Reintentar',
        errors: {
            INVALID_NAME: 'Escribe el nombre de quien recibe.',
            INVALID_ADDRESS: 'Escribe la dirección completa (mínimo 5 caracteres).',
            INVALID_PROVINCE: 'Elige una provincia.',
            INVALID_CITY: 'Elige un cantón de esa provincia.',
            INVALID_POSTAL_CODE: 'Escribe el código postal.',
            TOO_MANY_ADDRESSES: 'Puedes guardar hasta 10 direcciones. Elimina una para agregar otra.',
            REQUEST_FAILED: 'No se pudo guardar. Inténtalo de nuevo.',
        },
    };

    const provinces = Object.keys(COSTA_RICA_LOCATIONS);
    const cities = form?.province ? COSTA_RICA_LOCATIONS[form.province] || [] : [];

    const set = (name) => (e) => {
        const value = e.target.value;
        setForm(prev => ({ ...prev, [name]: value, ...(name === 'province' ? { city: '' } : {}) }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const result = form.id ? await walletApi.updateAddress(form) : await walletApi.createAddress(form);
            setAddresses(result.addresses);
            setForm(null);
        } catch (err) {
            setError(L.errors[err.message] || L.errors.REQUEST_FAILED);
        } finally {
            setSaving(false);
        }
    };

    const act = async (id, fn) => {
        setBusyId(id);
        try {
            const result = await fn();
            setAddresses(result.addresses);
        } catch {
            // list stays as it was; the user can retry
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="seller-section" id="saved-addresses">
            <h4>{L.title}</h4>
            <p className="text-sm text-gray-600 mb-3">{L.intro}</p>

            {loadError && !loading && (
                <p className="text-sm text-red-600 mb-3">
                    {L.loadError} <button type="button" onClick={refresh} className="underline font-semibold">{L.retry}</button>
                </p>
            )}
            {loading ? (
                <p className="text-sm text-gray-500">{L.loading}</p>
            ) : (
                <>
                    {addresses.length === 0 && !form && <p className="text-sm text-gray-500 mb-3">{L.empty}</p>}

                    <div className="wallet-list">
                        {addresses.map(a => (
                            <div key={a.id} className={`wallet-item ${a.isDefault ? 'wallet-item--default' : ''}`}>
                                <div className="wallet-item-main">
                                    <p className="font-semibold text-gray-800">
                                        {a.alias}
                                        {a.isDefault && <span className="seller-badge seller-badge--ok ml-2">{L.defaultBadge}</span>}
                                    </p>
                                    <p className="text-sm text-gray-700">{a.fullName}</p>
                                    <p className="text-sm text-gray-600">{a.address}</p>
                                    <p className="text-sm text-gray-600">{a.city}, {a.province} · {a.postalCode}</p>
                                </div>
                                <div className="wallet-item-actions">
                                    {!a.isDefault && (
                                        <button type="button" disabled={busyId === a.id} className="buyer-order-link-btn" onClick={() => act(a.id, () => walletApi.setDefaultAddress(a.id))}>{L.makeDefault}</button>
                                    )}
                                    <button type="button" className="buyer-order-link-btn" onClick={() => { setError(''); setForm({ ...a }); }}>{L.edit}</button>
                                    <button
                                        type="button"
                                        disabled={busyId === a.id}
                                        className="buyer-order-link-btn"
                                        onClick={() => { if (window.confirm(L.confirmRemove)) act(a.id, () => walletApi.deleteAddress(a.id)); }}
                                    >{L.remove}</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {!form && (
                        <button type="button" className="seller-action-btn mt-3" onClick={() => { setError(''); setForm(EMPTY_FORM(user?.realName)); }}>{L.add}</button>
                    )}

                    {form && (
                        <form onSubmit={handleSave} className="border rounded-lg p-4 space-y-3 text-sm mt-3">
                            <div className="wallet-form-grid">
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">{L.alias}</label>
                                    <input type="text" value={form.alias} onChange={set('alias')} className="seller-input w-full" maxLength={40} placeholder={L.aliasHelp} />
                                </div>
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">{L.fullName}</label>
                                    <input type="text" value={form.fullName} onChange={set('fullName')} className="seller-input w-full" maxLength={100} required autoComplete="name" />
                                </div>
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">{L.province}</label>
                                    <select value={form.province} onChange={set('province')} className="seller-input w-full" required>
                                        <option value="">{L.selectProvince}</option>
                                        {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-semibold text-gray-700 mb-1">{L.city}</label>
                                    <select value={form.city} onChange={set('city')} className="seller-input w-full" required disabled={!form.province}>
                                        <option value="">{L.selectCity}</option>
                                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block font-semibold text-gray-700 mb-1">{L.address}</label>
                                <input type="text" value={form.address} onChange={set('address')} className="seller-input w-full" maxLength={200} required autoComplete="street-address" />
                                <p className="text-xs text-gray-500 mt-1">{L.addressHelp}</p>
                            </div>
                            <div className="wallet-postal">
                                <label className="block font-semibold text-gray-700 mb-1">{L.postalCode}</label>
                                <input type="text" value={form.postalCode} onChange={set('postalCode')} className="seller-input w-full" maxLength={12} required autoComplete="postal-code" />
                            </div>
                            {error && <p className="text-red-600">{error}</p>}
                            <div className="flex gap-3">
                                <button type="submit" disabled={saving} className="seller-action-btn">{saving ? L.saving : L.save}</button>
                                <button type="button" onClick={() => setForm(null)} className="buyer-order-link-btn">{L.cancel}</button>
                            </div>
                        </form>
                    )}
                </>
            )}
        </div>
    );
};

export default SavedAddressesSection;
