import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = ({loc}) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const L = loc === 'en' 
        ? {title:'Log In', email:'Email', pass:'Password', submit:'Log In', switch:"Don't have an account?", link:'Sign up', error: 'Invalid credentials'}
        : {title:'Iniciar Sesión', email:'Correo', pass:'Contraseña', submit:'Iniciar Sesión', switch:'¿No tienes una cuenta?', link:'Regístrate', error: 'Credenciales inválidas'};

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(L.error);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-8">
            <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">{L.title}</h2>
                {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-2">{L.email}</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"/>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-2">{L.pass}</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"/>
                    </div>
                    <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">{L.submit}</button>
                </form>
                <p className="text-center text-sm text-gray-600 mt-6">{L.switch} <Link to="/signup" className="font-semibold text-purple-600 hover:underline">{L.link}</Link></p>
            </div>
        </div>
    );
}

export default LoginPage;