// Mock User Database
let USERS = {
    'admin': {
        id: 'admin',
        isAdmin: true,
        accountNumber: 'SUB-00000001',
        cedula: '0-0000-0000',
        realName: 'Admin User',
        profileName: 'Admin',
        email: 'admin@subasti.com',
        password: 'admin',
        countryCode: '+506',
        phone: '0000-0000',
        province: 'San José',
        city: 'San José',
        reviews: []
    },
    'user1': { 
        id: 'user1',
        accountNumber: 'SUB-10018374',
        cedula: '1-1234-5678',
        realName: 'Ana Rodriguez',
        profileName: 'AnaRdz', 
        email: 'ana@subasti.com', 
        password: '123',
        countryCode: '+506',
        phone: '8888-8888',
        province: 'San José',
        city: 'San José',
        defaultAddressId: 'addr1',
        defaultPaymentId: 'pay2',
        savedAddresses: [
            { id: 'addr1', alias: 'Casa', address: '123 Calle Ficticia, Residencial El Roble', province: 'San José', city: 'San José', postalCode: '10101' },
            { id: 'addr2', alias: 'Oficina', address: 'Avenida Central, Edificio Principal, Piso 5', province: 'San José', city: 'Curridabat', postalCode: '10102' }
        ],
        savedPayments: [
            { id: 'pay1', type: 'card', alias: 'Visa Personal', number: '************1234', expiry: '12/28', nameOnCard: 'Ana Rodriguez' },
            { id: 'pay2', type: 'sinpe', alias: 'SINPE Principal', phone: '8888-8888' }
        ],
        reviews: [
            { from: 'user2', rating: 5, comment: "Great seller, fast shipping!" },
        ],
    },
    'user2': {
        id: 'user2',
        accountNumber: 'SUB-29475638',
        cedula: '2-2222-2222',
        realName: 'Carlos Perez',
        profileName: 'CPerez',
        email: 'carlos@subasti.com',
        password: '123',
        countryCode: '+506',
        phone: '7777-7777',
        province: 'Heredia',
        city: 'Heredia',
        reviews: [
            { from: 'user1', rating: 4.5, comment: "Item was as described. Would buy again." },
            { from: 'guest', rating: 4, comment: "Good communication." }
        ],
    }
};

export const loginUser = async (email, password) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    const user = Object.values(USERS).find(u => u.email === email && u.password === password);
    if (!user) throw new Error('Invalid credentials');
    return user;
};

export const registerUser = async (userData) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newId = `user${Object.keys(USERS).length + 1}`;
    const accountNumber = `SUB-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const newUser = {
        ...userData,
        id: newId,
        accountNumber,
        savedAddresses: [],
        savedPayments: [],
        reviews: []
    };
    USERS[newId] = newUser;
    return newUser;
};

export const getUserById = (id) => USERS[id];
export const getAllUsers = () => USERS; // For Admin