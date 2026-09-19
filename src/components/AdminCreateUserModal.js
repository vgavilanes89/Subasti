import React, { useState } from 'react';

const EMPTY_FORM = {
    profileName: '', realName: '', email: '', cedula: '',
    countryCode: '+506', phone: '', province: '', city: '',
    password: '', isAdmin: false,
};

const AdminCreateUserModal = ({ loc, onClose, onCreated }) => {
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const L = loc === 'en' ? {
        title: 'Add User', save: 'Create User', saving: 'Creating…', cancel: 'Cancel',
        profileName: 'Profile Name', realName: 'Full Name', email: 'Email', cedula: 'Cédula',
        countryCode: 'Country Code', phone: 'Phone', province: 'Province', city: 'City',
        password: 'Password', isAdmin: 'Grant admin access', createFailed: 'Could not create user.',
    } : {
        title: 'Agregar Usuario', save: 'Crear Usuario', saving: 'Creando…', cancel: 'Cancelar',
        profileName: 'Nombre de Perfil', realName: 'Nombre Completo', email: 'Correo', cedula: 'Cédula',
        countryCode: 'Código de País', phone: 'Teléfono', province: 'Provincia', city: 'Ciudad',
        password: 'Contraseña', isAdmin: 'Otorgar acceso de administrador', createFailed: 'No se pudo crear el usuario.',
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
            const res = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const body = await res.json();
            if (!res.ok) throw new Error(body.error || L.createFailed);
            onCreated(body);
            onClose();
        } catch (err) {
            setError(err.message || L.createFailed);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">{L.title}</h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">{L.profileName}</label>
                            <input type="text" value={form.profileName} onChange={set('profileName')} className="w-full p-2 border rounded-lg text-sm" required />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">{L.realName}</label>
                            <input type="text" value={form.realName} onChange={set('realName')} className="w-full p-2 border rounded-lg text-sm" required />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">{L.email}</label>
                            <input type="email" value={form.email} onChange={set('email')} className="w-full p-2 border rounded-lg text-sm" required />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">{L.cedula}</label>
                            <input type="text" value={form.cedula} onChange={set('cedula')} className="w-full p-2 border rounded-lg text-sm" required />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">{L.countryCode}</label>
                            <input type="text" value={form.countryCode} onChange={set('countryCode')} className="w-full p-2 border rounded-lg text-sm" required />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-semibold text-gray-500 block mb-1">{L.phone}</label>
                            <input type="text" value={form.phone} onChange={set('phone')} className="w-full p-2 border rounded-lg text-sm" required />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">{L.province}</label>
                            <input type="text" value={form.province} onChange={set('province')} className="w-full p-2 border rounded-lg text-sm" required />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 block mb-1">{L.city}</label>
                            <input type="text" value={form.city} onChange={set('city')} className="w-full p-2 border rounded-lg text-sm" required />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">{L.password}</label>
                        <input type="password" value={form.password} onChange={set('password')} className="w-full p-2 border rounded-lg text-sm" required minLength={8} />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={form.isAdmin} onChange={set('isAdmin')} />
                        {L.isAdmin}
                    </label>

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

export default AdminCreateUserModal;
