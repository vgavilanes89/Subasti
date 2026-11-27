import React, { useEffect, useState, useMemo, useRef } from 'react';
import PasswordChecklist, { PASSWORD_PROBLEM_TEXT } from '../components/PasswordChecklist';
import { checkPassword } from '../lib/passwordPolicy';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { COSTA_RICA_LOCATIONS, COUNTRY_CODES } from '../data/Constants';
import PasswordInput from '../components/PasswordInput';
import TurnstileWidget from '../components/TurnstileWidget';

const SignupPage = ({loc}) => {
    const { signup } = useAuth();
    const [passwordError, setPasswordError] = useState('');
    // Set only when the lookup returned a name for the number now in the box.
    const [verification, setVerification] = useState(null);
    const [cedulaError, setCedulaError] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    // Bot check before a lookup (only when the server has it switched on).
    const [siteKey, setSiteKey] = useState(null);
    const botToken = useRef('');
    const botWidget = useRef(null);
    const waitingForBotCheck = useRef(false);
    const lookupRef = useRef(null);
    useEffect(() => {
        fetch('/api/cedula?config=1')
            .then(res => (res.ok ? res.json() : null))
            .then(config => setSiteKey(config?.turnstileSiteKey || null))
            .catch(() => {});
    }, []);
    const handleBotToken = (token) => {
        botToken.current = token;
        if (token && waitingForBotCheck.current) {
            waitingForBotCheck.current = false;
            setCedulaError('');
            lookupRef.current?.();
        }
    };
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ cedula: '', realName: '', profileName: '', email: '', password: '', countryCode: '+506', phone: '', province: '', city: ''});
    const [isFetchingCedula, setIsFetchingCedula] = useState(false);
    const [profileNameError, setProfileNameError] = useState('');
    // Caches the outcome of the last completed lookup so re-blurring an unchanged
    // cedula (e.g. tabbing through the field) doesn't re-bill the paid lookup.
    const cedulaLookupCache = useRef(null);

    const provinces = Object.keys(COSTA_RICA_LOCATIONS);
    const cities = formData.province ? COSTA_RICA_LOCATIONS[formData.province] : [];


    const L = loc === 'en' 
        ? {title:'Create Your Account', cedula: 'ID Number (Cédula)', fetching: 'Fetching...', realName: 'Full Name', profileName: 'Profile Name (public)', email:'Email', pass:'Password', phone:'Phone Number', province:'Province', city: 'City', submit:'Create Account', switch:'Already have an account?', link:'Log in', cedulaNotFound: 'We could not find a name for this ID number, so an account cannot be created with it. If you are not a Costa Rican national, another way to register is coming.', nameFromId: 'Filled in from your ID number', agreeStart: 'I have read and agree to the', agreeTerms: 'Terms and Conditions', agreeAnd: 'and the', agreePrivacy: 'Privacy Policy', botCheckWait: 'Complete the security check below to verify your ID.', botCheckFailed: 'The security check did not pass. Try it again, then click into the ID box and out.', alreadyRegistered: 'An account already exists for this ID number. Log in, or reset your password if you forgot it.', lookupLimit: 'Too many ID lookups from your connection. Please try again later.', verifyFirst: 'Enter your ID number so we can verify your name before creating the account.', verifyAgain: 'Your ID verification expired. Click into the ID number box and out again to verify it.', profileNameInvalid: 'Profile name can only contain letters and numbers.', profileNameSameAsReal: 'Profile name cannot be the same as your full name.', select: 'Select...', profileNameHint: 'Letters and numbers only, no spaces.'}
        : {title:'Crea Tu Cuenta', cedula: 'Número de Cédula', fetching: 'Consultando...', realName: 'Nombre Completo', profileName: 'Nombre de Perfil (público)', email:'Correo', pass:'Contraseña', phone:'Número de Teléfono', province:'Provincia', city: 'Cantón', submit:'Crear Cuenta', switch:'¿Ya tienes una cuenta?', link:'Inicia sesión', cedulaNotFound: 'No encontramos un nombre para esta cédula, así que no se puede crear una cuenta con ella. Si no eres costarricense, pronto habrá otra forma de registrarte.', nameFromId: 'Se completa con tu cédula', agreeStart: 'He leído y acepto los', agreeTerms: 'Términos y Condiciones', agreeAnd: 'y la', agreePrivacy: 'Política de Privacidad', botCheckWait: 'Completa la verificación de seguridad de abajo para verificar tu cédula.', botCheckFailed: 'La verificación de seguridad no pasó. Inténtalo de nuevo y luego entra y sal de la casilla de cédula.', alreadyRegistered: 'Ya existe una cuenta para esta cédula. Inicia sesión, o restablece tu contraseña si la olvidaste.', lookupLimit: 'Demasiadas consultas de cédula desde tu conexión. Inténtalo más tarde.', verifyFirst: 'Escribe tu cédula para verificar tu nombre antes de crear la cuenta.', verifyAgain: 'La verificación de tu cédula venció. Entra en la casilla de cédula y sal de nuevo para verificarla.', profileNameInvalid: 'El nombre de perfil solo puede contener letras y números.', profileNameSameAsReal: 'El nombre de perfil no puede ser igual a su nombre completo.', select: 'Seleccionar...', profileNameHint: 'Solo letras y números, sin espacios.'};
    
    const selectedCountry = useMemo(() => COUNTRY_CODES.find(c => c.code === formData.countryCode), [formData.countryCode]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'profileName') {
            setProfileNameError(''); // Clear error on change
        }
        if (name === 'cedula') {
            // A different number has to be verified again, and the old name goes with it.
            setVerification(null);
            setCedulaError('');
        }
        setFormData(prev => {
            const newState = {...prev, [name]: value};
            if (name === 'cedula') {
                newState.realName = '';
            }
            if(name === 'province') {
                newState.city = ''; // Reset city when province changes
            }
            if (name === 'countryCode') {
                newState.phone = ''; // Reset phone when country changes
            }
            if (name === 'cedula') {
                newState.realName = '';
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

    const isVerified = Boolean(verification && verification.cedula === formData.cedula);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const error = validateProfileName(formData.profileName, formData.realName);
        if (error) {
            setProfileNameError(error);
            return;
        }
        const policy = checkPassword(formData.password, formData);
        if (!policy.ok) {
            setPasswordError(PASSWORD_PROBLEM_TEXT[loc][policy.problems[0]]);
            return;
        }
        try {
            await signup({ ...formData, verificationToken: verification?.token, acceptedTerms });
            navigate('/');
        } catch (err) {
            if (err.message === 'CEDULA_NOT_VERIFIED') {
                setVerification(null);
                cedulaLookupCache.current = null;
                setCedulaError(L.verifyAgain);
                return;
            }
            if (err.message === 'WEAK_PASSWORD') {
                setPasswordError(PASSWORD_PROBLEM_TEXT[loc].TOO_COMMON);
                return;
            }
            alert(loc === 'en' ? 'Error creating account' : 'Error al crear la cuenta');
        }
    };

    const toTitleCase = (str) =>
        (str || '')
            .toLowerCase()
            .split(/\s+/)
            .filter(Boolean)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

    const handleFetchCedulaData = async () => {
        if (!formData.cedula) return;

        const documentNumber = formData.cedula.replace(/[\s-]/g, '');
        if (!/^\d{9,12}$/.test(documentNumber)) {
            return;
        }

        const cached = cedulaLookupCache.current;
        if (cached && cached.cedula === formData.cedula) {
            if (cached.result === 'success') {
                setFormData((prev) => ({ ...prev, realName: cached.realName, profileName: cached.profileName }));
                setVerification({ cedula: cached.cedula, token: cached.token });
            } else if (cached.result === 'not_found') {
                alert(L.cedulaNotFound);
            }
            return;
        }

        // Wait for the bot check; the lookup then runs by itself.
        if (siteKey && !botToken.current) {
            waitingForBotCheck.current = true;
            setCedulaError(L.botCheckWait);
            return;
        }

        setIsFetchingCedula(true);
        setVerification(null);
        setCedulaError('');
        try {
            const res = await fetch(`/api/cedula?cedula=${encodeURIComponent(formData.cedula)}`, {
                headers: botToken.current ? { 'x-turnstile-token': botToken.current } : {},
            });
            if (res.status === 403) {
                setCedulaError(L.botCheckFailed);
                return;
            }
            if (res.status === 409) {
                setFormData((prev) => ({ ...prev, realName: '' }));
                setCedulaError(L.alreadyRegistered);
                return;
            }
            if (res.status === 404) {
                cedulaLookupCache.current = { cedula: formData.cedula, result: 'not_found' };
                setFormData((prev) => ({ ...prev, realName: '' }));
                setCedulaError(L.cedulaNotFound);
                return;
            }
            if (res.status === 429) {
                setCedulaError(L.lookupLimit);
                return;
            }
            if (res.status === 503) {
                alert(loc === 'en'
                    ? 'ID verification is temporarily unavailable. Your number was not rejected — please try again later.'
                    : 'La verificación de cédula no está disponible temporalmente. Su número no fue rechazado; intente de nuevo más tarde.');
                return;
            }
            if (!res.ok) {
                alert(loc === 'en' ? 'Could not look up ID number.' : 'No se pudo consultar la cédula.');
                return;
            }
            const data = await res.json();
            if (!data.fullName || !data.verificationToken) {
                setCedulaError(L.cedulaNotFound);
                return;
            }
            const fullName = data.fullName;
            const firstName = toTitleCase(data.firstName).replace(/\s/g, '');
            const lastNameFirst = toTitleCase(data.lastName).split(/\s+/)[0] || '';
            const profileName = `${firstName}${lastNameFirst}`.replace(/[^a-zA-Z0-9]/g, '');
            cedulaLookupCache.current = { cedula: formData.cedula, result: 'success', realName: fullName, profileName, token: data.verificationToken };
            setVerification({ cedula: formData.cedula, token: data.verificationToken });
            setFormData((prev) => ({ ...prev, realName: fullName, profileName }));
        } catch {
            alert(loc === 'en' ? 'Could not look up ID number.' : 'No se pudo consultar la cédula.');
        } finally {
            setIsFetchingCedula(false);
            // A bot-check token only works once.
            if (siteKey) {
                botToken.current = '';
                botWidget.current?.reset();
            }
        }
    };
    lookupRef.current = handleFetchCedulaData;

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
                        {cedulaError && <p className="text-xs text-red-600 mt-1" role="alert">{cedulaError}</p>}
                        {siteKey && (
                            <TurnstileWidget ref={botWidget} siteKey={siteKey} loc={loc} onToken={handleBotToken} onError={() => setCedulaError(L.botCheckFailed)} />
                        )}
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-2">{L.realName}</label>
                        <input type="text" name="realName" value={formData.realName} readOnly required placeholder={L.nameFromId} className="bg-gray-100 w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-200 disabled:cursor-not-allowed"/>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-2">{L.profileName}</label>
                        <input type="text" name="profileName" value={formData.profileName} onChange={handleChange} onBlur={handleProfileNameBlur} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"/>
                        <p className="text-xs text-gray-500 mt-1">{L.profileNameHint}</p>
                        {profileNameError && <p className="text-xs text-red-500 mt-1">{profileNameError}</p>}
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-2">{L.email}</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"/>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-2">{L.pass}</label>
                        <PasswordInput loc={loc} name="password" value={formData.password} onChange={(e) => { setPasswordError(''); handleChange(e); }} required maxLength={200} autoComplete="new-password" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"/>
                        <PasswordChecklist password={formData.password} context={formData} loc={loc} />
                        {passwordError && <p className="text-xs text-red-500 mt-1">{passwordError}</p>}
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
                                <option value="">{L.select}</option>
                                {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-2">{L.city}</label>
                            <select name="city" value={formData.city} onChange={handleChange} required disabled={!formData.province} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100">
                                <option value="">{L.select}</option>
                                {cities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    {/* Links open in a new tab so what's been typed here isn't lost. */}
                    <label className="flex items-start gap-2 text-sm text-gray-700 mt-2">
                        <input
                            type="checkbox"
                            name="acceptedTerms"
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            required
                            className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span>
                            {L.agreeStart}{' '}
                            <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-purple-600 hover:underline">{L.agreeTerms}</a>
                            {' '}{L.agreeAnd}{' '}
                            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-purple-600 hover:underline">{L.agreePrivacy}</a>.
                        </span>
                    </label>
                    {!isVerified && <p className="text-xs text-gray-500 mt-4">{L.verifyFirst}</p>}
                    <button type="submit" disabled={!isVerified || !acceptedTerms} className="w-full bg-purple-600 text-white py-3 mt-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{L.submit}</button>
                </form>
                <p className="text-center text-sm text-gray-600 mt-6">{L.switch} <Link to="/login" className="font-semibold text-purple-600 hover:underline">{L.link}</Link></p>
            </div>
        </div>
    );
}

export default SignupPage;