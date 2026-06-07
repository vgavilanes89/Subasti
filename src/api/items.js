let ITEMS = [
    {id:'i1',title:'iPhone 13 128GB - Medianoche',description: 'Vendo iPhone 13 en excelentes condiciones, casi nuevo. Tiene 128GB de almacenamiento y el color es medianoche. La batería está al 95% de su capacidad. Siempre usado con protector.', category:'Electrónicos', subCategory: 'Celulares', currency:'CRC', price:220000,image:'https://placehold.co/600x400/8b5cf6/ffffff?text=iPhone+13', images: ['https://placehold.co/600x400/8b5cf6/ffffff?text=iPhone+1', 'https://placehold.co/600x400/8b5cf6/ffffff?text=iPhone+2', 'https://placehold.co/600x400/8b5cf6/ffffff?text=iPhone+3'], saleType: 'buy', condition: 'used', conditionDetail: 'Leve rasguño en esquina', sellerId: 'user1', quantity: 1, shippingShip: true, shippingLocal: true, shippingCost: 3000},
    {id:'i2',title:'Sofá Seccional Gris Moderno',description: 'Sofá seccional de 3 piezas en color gris oscuro. Es muy cómodo y está en perfecto estado, sin manchas ni rasgaduras. Ideal para una sala de estar grande. Lo vendo por mudanza.', category:'Hogar', subCategory: 'Muebles', currency:'CRC', price:150000,image:'https://placehold.co/600x400/64748b/ffffff?text=Sofá', images: ['https://placehold.co/600x400/64748b/ffffff?text=Sofá'], saleType: 'auc', currentBid: 165000, bids: 3, reservePrice: 160000, endAt: new Date().getTime() - 1000, condition: 'new', sellerId: 'user2', quantity: 1, shippingShip: false, shippingLocal: true, buyNowPrice: 220000, shippingCost: 0},
    {id:'i3',title:'Bicicleta de Montaña Aro 29',description: 'Bicicleta de montaña marca Trek, aro 29, con frenos de disco hidráulicos y suspensión delantera. Tiene 21 velocidades y está en excelente estado, lista para usarse.', category:'Deportes', subCategory: 'Ciclismo', currency:'USD', price:350,image:'https://placehold.co/600x400/16a34a/ffffff?text=Bicicleta', images: ['https://placehold.co/600x400/16a34a/ffffff?text=Bicicleta'], saleType: 'buy', condition: 'new', sellerId: 'user1', quantity: 5, shippingShip: true, shippingLocal: false, shippingCost: 25},
    {id:'i4',title:'Cámara Canon EOS R con Lente 24-105mm',description: 'Vendo cámara profesional Canon EOS R, full-frame mirrorless. Incluye el lente RF 24-105mm f/4L IS USM. Está en perfectas condiciones, sin rayones y con poco uso. Incluye batería, cargador y caja original.', category:'Electrónicos', subCategory: 'Cámaras', currency:'USD', price:1500,image:'https://placehold.co/600x400/dc2626/ffffff?text=Cámara', images: ['https://placehold.co/600x400/dc2626/ffffff?text=Cámara'], saleType: 'auc', currentBid: 1560, bids: 5, reservePrice: 1600, endAt: new Date().getTime() + 5 * 24 * 60 * 60 * 1000, condition: 'new', sellerId: 'user1', quantity: 1, shippingShip: true, shippingLocal: true, shippingCost: 15},
    {id:'i5',title:'Taladro Inalámbrico 20V',description: 'Potente taladro inalámbrico de 20V, incluye 2 baterías de litio, cargador y maletín. Usado solo un par de veces, como nuevo.', category:'Hogar', subCategory: 'Herramientas', currency:'CRC', price:45000,image:'https://placehold.co/600x400/f59e0b/ffffff?text=Taladro', images: ['https://placehold.co/600x400/f59e0b/ffffff?text=Taladro'], saleType: 'buy', condition: 'used', conditionDetail: 'Como nuevo', sellerId: 'user2', quantity: 1, shippingShip: true, shippingLocal: true, shippingCost: 2500},
];

export const fetchItems = async () => {
    return [...ITEMS];
};

export const fetchItemById = (id) => {
    return ITEMS.find(i => i.id === id);
};

export const createItem = async (item) => {
    ITEMS = [item, ...ITEMS];
    return item;
};

export const deleteItem = async (id) => {
    ITEMS = ITEMS.filter(i => i.id !== id);
    return id;
};

export const getBidIncrement = (currentBid, currency = 'CRC') => {
    if (currency === 'USD') {
        return Math.max(1, Math.ceil(currentBid * 0.05 * 100) / 100);
    }
    return Math.max(1000, Math.ceil(currentBid * 0.05));
};

export const getMinBid = (item) => {
    if (!item || item.saleType !== 'auc') return 0;
    const currency = item.currency || 'CRC';
    const current = item.currentBid ?? item.price ?? 0;
    return current + getBidIncrement(current, currency);
};

export const placeBid = async (id, amount) => {
    const item = ITEMS.find(i => i.id === id);
    if (!item || item.saleType !== 'auc') {
        throw new Error('INVALID_AUCTION');
    }
    if (item.endAt < Date.now()) {
        throw new Error('AUCTION_ENDED');
    }
    const minBid = getMinBid(item);
    if (amount < minBid) {
        throw new Error('BID_TOO_LOW');
    }
    const updated = {
        ...item,
        currentBid: amount,
        bids: (item.bids || 0) + 1,
    };
    ITEMS = ITEMS.map(i => (i.id === id ? updated : i));
    return updated;
};