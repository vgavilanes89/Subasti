const CATEGORY_EN = {
    'Electrónicos': 'Electronics',
    'Hogar': 'Home',
    'Deportes': 'Sports',
    'Moda': 'Fashion',
    'Libros': 'Books',
    'Vehículos': 'Vehicles',
};

const SUBCATEGORY_EN = {
    'Celulares': 'Cell Phones',
    'Computadoras': 'Computers',
    'Cámaras': 'Cameras',
    'Audio y Video': 'Audio & Video',
    'Videojuegos': 'Video Games',
    'Muebles': 'Furniture',
    'Electrodomésticos': 'Appliances',
    'Decoración': 'Decor',
    'Jardinería': 'Gardening',
    'Herramientas': 'Tools',
    'Ciclismo': 'Cycling',
    'Fitness': 'Fitness',
    'Deportes de Equipo': 'Team Sports',
    'Acuáticos': 'Water Sports',
    'Ropa de Mujer': "Women's Clothing",
    'Ropa de Hombre': "Men's Clothing",
    'Calzado': 'Footwear',
    'Accesorios': 'Accessories',
    'Bolsos': 'Bags',
    'Ficción': 'Fiction',
    'No Ficción': 'Non-Fiction',
    'Infantil y Juvenil': 'Children & Young Adult',
    'Académicos': 'Academic',
    'Comics y Manga': 'Comics & Manga',
    'Repuestos y Accesorios': 'Parts & Accessories',
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
