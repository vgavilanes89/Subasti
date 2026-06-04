import React, { createContext, useContext, useState } from 'react';
import * as authService from '../api/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [usersMap, setUsersMap] = useState(authService.getAllUsers()); // Keep a local map of all users for UI display

    const login = async (email, password) => {
        const loggedUser = await authService.loginUser(email, password);
        setUser(loggedUser);
        return loggedUser;
    };

    const logout = () => {
        setUser(null);
    };

    const signup = async (userData) => {
        const newUser = await authService.registerUser(userData);
        setUser(newUser);
        setUsersMap(prev => ({...prev, [newUser.id]: newUser}));
    };

    const updateProfile = (updatedData) => {
        setUser(updatedData);
        // In a real app, you would call an API update here
    };

    // Address & Payment handlers (Moved from App.js)
    const saveAddress = (address) => {
        if (!user) return;
        const updatedUser = { ...user };
        const addresses = updatedUser.savedAddresses || [];
        if (address.id) {
            updatedUser.savedAddresses = addresses.map(a => a.id === address.id ? address : a);
        } else {
            const newAddress = { ...address, id: `addr_${Date.now()}` };
            updatedUser.savedAddresses = [...addresses, newAddress];
        }
        setUser(updatedUser);
    };

    const deleteAddress = (addressId) => {
        if (!user) return;
        const updatedUser = { ...user, savedAddresses: user.savedAddresses.filter(a => a.id !== addressId) };
        setUser(updatedUser);
    };

    const savePayment = (payment) => {
        if (!user) return;
        const updatedUser = { ...user };
        const payments = updatedUser.savedPayments || [];
        if (payment.id) {
            updatedUser.savedPayments = payments.map(p => p.id === payment.id ? payment : p);
        } else {
            const newPayment = { ...payment, id: `pay_${Date.now()}` };
            updatedUser.savedPayments = [...payments, newPayment];
        }
        setUser(updatedUser);
    };

    const deletePayment = (paymentId) => {
        if (!user) return;
        const updatedUser = { ...user, savedPayments: user.savedPayments.filter(p => p.id !== paymentId) };
        setUser(updatedUser);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            users: usersMap, // Expose all users for read-only (like reviews)
            login, 
            logout, 
            signup, 
            updateProfile,
            saveAddress,
            deleteAddress,
            savePayment,
            deletePayment
        }}>
            {children}
        </AuthContext.Provider>
    );
};