const CATEGORY_EN = {
    'Electrónicos': 'Electronics',
    'Hogar': 'Home',
    'Deportes': 'Sports',
    'Moda': 'Fashion',
    'Salud y Belleza': 'Health & Beauty',
    'Juguetes y Bebés': 'Toys & Baby',
    'Mascotas': 'Pet Supplies',
    'Libros': 'Books',
    'Música e Instrumentos': 'Music & Instruments',
    'Arte y Artesanía': 'Arts & Crafts',
    'Coleccionables': 'Collectibles',
    'Oficina y Escuela': 'Office & School',
    'Jardín y Exterior': 'Garden & Outdoor',
    'Alimentos': 'Food & Grocery',
    'Vehículos': 'Vehicles',
};

const SUBCATEGORY_EN = {
    'Celulares': 'Cell Phones',
    'Computadoras': 'Computers',
    'Tablets': 'Tablets',
    'Cámaras': 'Cameras',
    'Televisores': 'TVs',
    'Audio y Video': 'Audio & Video',
    'Videojuegos': 'Video Games',
    'Accesorios Tech': 'Tech Accessories',
    'Muebles': 'Furniture',
    'Electrodomésticos': 'Appliances',
    'Cocina': 'Kitchen',
    'Decoración': 'Decor',
    'Jardinería': 'Gardening',
    'Herramientas': 'Tools',
    'Limpieza': 'Cleaning',
    'Ciclismo': 'Cycling',
    'Fitness': 'Fitness',
    'Deportes de Equipo': 'Team Sports',
    'Acuáticos': 'Water Sports',
    'Camping': 'Camping',
    'Ropa de Mujer': "Women's Clothing",
    'Ropa de Hombre': "Men's Clothing",
    'Ropa Infantil': "Kids' Clothing",
    'Calzado': 'Footwear',
    'Accesorios': 'Accessories',
    'Bolsos': 'Bags',
    'Joyería': 'Jewelry',
    'Cuidado Personal': 'Personal Care',
    'Maquillaje': 'Makeup',
    'Perfumes': 'Fragrances',
    'Suplementos': 'Supplements',
    'Juguetes': 'Toys',
    'Bebés': 'Baby Gear',
    'Juegos de Mesa': 'Board Games',
    'Alimentos para Mascotas': 'Pet Food',
    'Accesorios para Mascotas': 'Pet Accessories',
    'Higiene Animal': 'Pet Grooming',
    'Ficción': 'Fiction',
    'No Ficción': 'Non-Fiction',
    'Infantil y Juvenil': 'Children & Young Adult',
    'Académicos': 'Academic',
    'Comics y Manga': 'Comics & Manga',
    'Guitarras': 'Guitars',
    'Teclados': 'Keyboards',
    'Batería y Percusión': 'Drums & Percussion',
    'Audio DJ': 'DJ & Studio Audio',
    'Arte y Dibujo': 'Art & Drawing',
    'Hecho a Mano': 'Handmade',
    'Manualidades': 'Craft Supplies',
    'Monedas y Billetes': 'Coins & Currency',
    'Tarjetas Coleccionables': 'Trading Cards',
    'Memorabilia': 'Memorabilia',
    'Antigüedades': 'Antiques',
    'Útiles Escolares': 'School Supplies',
    'Muebles de Oficina': 'Office Furniture',
    'Impresión': 'Printing',
    'Plantas': 'Plants',
    'Parrillas': 'Grills & BBQ',
    'Muebles de Exterior': 'Outdoor Furniture',
    'Gourmet': 'Gourmet',
    'Bebidas': 'Beverages',
    'Orgánicos': 'Organic',
    'Repuestos y Accesorios': 'Parts & Accessories',
    'Motos y ATV': 'Motorcycles & ATVs',
    'Llantas y Rines': 'Tires & Rims',
    'Audio para Carro': 'Car Audio',
    'Otro': 'Other',
};

export const tCategory = (name, loc) =>
    loc === 'en' ? (CATEGORY_EN[name] || name) : name;

export const tSubCategory = (name, loc) =>
    loc === 'en' ? (SUBCATEGORY_EN[name] || name) : name;

export const formatCondition = (condition, loc, detail = '') => {
    const label = loc === 'en'
        ? (condition === 'new' ? 'New' : condition === 'used' ? 'Used' : condition)
        : (condition === 'new' ? 'Nuevo' : condition === 'used' ? 'Usado' : condition);
    return detail && condition === 'used' ? `${label} (${detail})` : label;
};

export const saleTypeBadge = (saleType, loc) =>
    saleType === 'auc'
        ? (loc === 'en' ? 'AUCTION' : 'SUBASTA')
        : (loc === 'en' ? 'BUY NOW' : 'COMPRA');
