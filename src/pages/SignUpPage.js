import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { COSTA_RICA_LOCATIONS, COUNTRY_CODES } from '../data/Constants';

const SignupPage = ({loc}) => {
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ cedula: '', realName: '', profileName: '', email: '', password: '', countryCode: '+506', phone: '', province: '', city: ''});
    const [isFetchingCedula, setIsFetchingCedula] = useState(false);
    const [profileNameError, setProfileNameError] = useState('');
    const [isNameFetched, setIsNameFetched] = useState(false);
    
    const provinces = Object.keys(COSTA_RICA_LOCATIONS);
    const cities = formData.province ? COSTA_RICA_LOCATIONS[formData.province] : [];


    const L = loc === 'en' 
        ? {title:'Create Your Account', cedula: 'ID Number (Cédula)', fetching: 'Fetching...', realName: 'Full Name', profileName: 'Profile Name (public)', email:'Email', pass:'Password', phone:'Phone Number', province:'Province', city: 'City', submit:'Create Account', switch:'Already have an account?', link:'Log in', cedulaNotFound: 'ID number not found.', profileNameInvalid: 'Profile name can only contain letters and numbers.', profileNameSameAsReal: 'Profile name cannot be the same as your full name.'}
        : {title:'Crea Tu Cuenta', cedula: 'Número de Cédula', fetching: 'Consultando...', realName: 'Nombre Completo', profileName: 'Nombre de Perfil (público)', email:'Correo', pass:'Contraseña', phone:'Número de Teléfono', province:'Provincia', city: 'Cantón', submit:'Crear Cuenta', switch:'¿Ya tienes una cuenta?', link:'Inicia sesión', cedulaNotFound: 'Cédula no encontrada.', profileNameInvalid: 'El nombre de perfil solo puede contener letras y números.', profileNameSameAsReal: 'El nombre de perfil no puede ser igual a su nombre completo.'};
    
    const selectedCountry = useMemo(() => COUNTRY_CODES.find(c => c.code === formData.countryCode), [formData.countryCode]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'profileName') {
            setProfileNameError(''); // Clear error on change
        }
        setFormData(prev => {
            const newState = {...prev, [name]: value};
            if(name === 'province') {
                newState.city = ''; // Reset city when province changes
            }
            if (name === 'countryCode') {
                newState.phone = ''; // Reset phone when country changes
            }
            return newState;
        });
    };
    
    const validateProfileName = (name, realName) => {
        const profileNameRegex = /^[a-zA-Z0-9]+$/;
        if (!profileNameRegex.test(name)) {
            return L.profileNameInvalid;
        }
        if (realName && name.toLowerCase() === realName.toLowerCase().replace(/\s/g, '')) {
            return L.profileNameSameAsReal;
        }
        return ''; // No error
    };

    const handleProfileNameBlur = () => {
        const error = validateProfileName(formData.profileName, formData.realName);
        setProfileNameError(error);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const error = validateProfileName(formData.profileName, formData.realName);
        if (error) {
            setProfileNameError(error);
            return;
        }
        try {
            await signup(formData);
            navigate('/');
        } catch (err) {
            alert(loc === 'en' ? 'Error creating account' : 'Error al crear la cuenta');
        }
    };

    const handleFetchCedulaData = () => {
        if (!formData.cedula) return;
        setIsFetchingCedula(true);
        // Simulate API call to a national registry
        setTimeout(() => {
            const mockApiData = {
                '1-1573-0196': { name: 'Nora', firstLastName: 'Marin', secondLastName: 'Loria' },
                '2-2222-2222': { name: 'Maria', firstLastName: 'Salas', secondLastName: 'Rojas' },
            };
            const userData = mockApiData[formData.cedula];
            if (userData) {
                setFormData(prev => ({
                    ...prev,
                    realName: `${userData.name} ${userData.firstLastName} ${userData.secondLastName}`,
                    profileName: `${userData.name}${userData.firstLastName}`,
                }));
                setIsNameFetched(true);
            } else {
                alert(L.cedulaNotFound);
                setIsNameFetched(false);
            }
            setIsFetchingCedula(false);
        }, 1200);
    };

    return (
        <div className="max-w-md mx-auto mt-8">
            <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">{L.title}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-2 flex items-center gap-2">
                            {L.cedula}
                            {isFetchingCedula && <span className="text-xs font-normal text-gray-500">({L.fetching})</span>}
                        </label>
                        <input
                            type="text"
                            name="cedula"
                            value={formData.cedula}
                            onChange={handleChange}
                            onBlur={handleFetchCedulaData}
                            required
                            disabled={isFetchingCedula}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-2">{L.realName}</label>
                        <input type="text" name="realName" value={formData.realName} onChange={handleChange} required disabled={isNameFetched} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-200 disabled:cursor-not-allowed"/>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-2">{L.profileName}</label>
                        <input type="text" name="profileName" value={formData.profileName} onChange={handleChange} onBlur={handleProfileNameBlur} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"/>
                        <p className="text-xs text-gray-500 mt-1">{loc === 'en' ? 'Letters and numbers only, no spaces.' : 'Solo letras y números, sin espacios.'}</p>
                        {profileNameError && <p className="text-xs text-red-500 mt-1">{profileNameError}</p>}
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-2">{L.email}</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"/>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-2">{L.pass}</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"/>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-2">{L.phone}</label>
                        <div className="flex">
                            <select name="countryCode" value={formData.countryCode} onChange={handleChange} className="p-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 focus:outline-none">
                                {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                            </select>
                            <input 
                                type="tel" 
                                name="phone" 
                                value={formData.phone} 
                                onChange={handleChange} 
                                required 
                                pattern={selectedCountry?.pattern}
                                maxLength={selectedCountry?.len}
                                placeholder={selectedCountry?.placeholder}
                                className="w-full p-3 border border-gray-300 rounded-r-lg focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-2">{L.province}</label>
                            <select name="province" value={formData.province} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500">
                                <option value="">Select...</option>
                                {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-2">{L.city}</label>
                            <select name="city" value={formData.city} onChange={handleChange} required disabled={!formData.province} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100">
                                <option value="">Select...</option>
                                {cities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <button type="submit" className="w-full bg-purple-600 text-white py-3 mt-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors">{L.submit}</button>
                </form>
                <p className="text-center text-sm text-gray-600 mt-6">{L.switch} <Link to="/login" className="font-semibold text-purple-600 hover:underline">{L.link}</Link></p>
            </div>
        </div>
    );
}

export default SignupPage;