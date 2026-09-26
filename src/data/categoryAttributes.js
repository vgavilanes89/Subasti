// Category-specific "extra detail" fields for the Sell page (e.g. brand +
// model for a phone, brand + size for shoes, bike type for cycling). Kept
// separate from the category/subcategory tree itself (src/App.js CATEGORIES)
// since these are per-listing attributes, not navigation.
//
// Each field: { key, label: {en, es}, type: 'text' | 'select', options? }
// Select options are { value, en, es } — value is what's stored, en/es are
// display-only. Values are free text otherwise, always optional.

const label = (en, es) => ({ en, es });
const opt = (value, en, es) => ({ value, en, es });

const OTHER = opt('other', 'Other', 'Otro');

const BRAND = (options) => ({
    key: 'brand',
    label: label('Brand', 'Marca'),
    type: options ? 'select' : 'text',
    options: options ? [...options, OTHER] : undefined,
});

const MODEL = { key: 'model', label: label('Model', 'Modelo'), type: 'text' };
const YEAR = { key: 'year', label: label('Year', 'Año'), type: 'text' };

const PHONE_BRANDS = [
    opt('apple', 'Apple', 'Apple'), opt('samsung', 'Samsung', 'Samsung'), opt('xiaomi', 'Xiaomi', 'Xiaomi'),
    opt('motorola', 'Motorola', 'Motorola'), opt('huawei', 'Huawei', 'Huawei'), opt('google', 'Google', 'Google'),
];
const STORAGE = {
    key: 'storage',
    label: label('Storage', 'Almacenamiento'),
    type: 'select',
    options: ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB+'].map((v) => opt(v, v, v)).concat(OTHER),
};
const COMPUTER_BRANDS = [
    opt('apple', 'Apple', 'Apple'), opt('dell', 'Dell', 'Dell'), opt('hp', 'HP', 'HP'), opt('lenovo', 'Lenovo', 'Lenovo'),
    opt('asus', 'Asus', 'Asus'), opt('acer', 'Acer', 'Acer'), opt('msi', 'MSI', 'MSI'),
];
const RAM = {
    key: 'ram',
    label: label('RAM', 'Memoria RAM'),
    type: 'select',
    options: ['4GB', '8GB', '16GB', '32GB', '64GB+'].map((v) => opt(v, v, v)).concat(OTHER),
};
const CAMERA_BRANDS = [
    opt('canon', 'Canon', 'Canon'), opt('nikon', 'Nikon', 'Nikon'), opt('sony', 'Sony', 'Sony'),
    opt('fujifilm', 'Fujifilm', 'Fujifilm'), opt('panasonic', 'Panasonic', 'Panasonic'), opt('gopro', 'GoPro', 'GoPro'),
];
const TV_BRANDS = [
    opt('samsung', 'Samsung', 'Samsung'), opt('lg', 'LG', 'LG'), opt('sony', 'Sony', 'Sony'),
    opt('tcl', 'TCL', 'TCL'), opt('hisense', 'Hisense', 'Hisense'),
];
const SCREEN_SIZE = { key: 'screenSize', label: label('Screen Size (inches)', 'Tamaño de Pantalla (pulgadas)'), type: 'text' };
const PLATFORM = {
    key: 'platform',
    label: label('Platform', 'Plataforma'),
    type: 'select',
    options: [
        opt('playstation', 'PlayStation', 'PlayStation'), opt('xbox', 'Xbox', 'Xbox'),
        opt('switch', 'Nintendo Switch', 'Nintendo Switch'), opt('pc', 'PC', 'PC'),
    ].concat(OTHER),
};

const FURNITURE_TYPE = {
    key: 'furnitureType',
    label: label('Furniture Type', 'Tipo de Mueble'),
    type: 'select',
    options: [
        opt('sofa', 'Sofa', 'Sofá'), opt('table', 'Table', 'Mesa'), opt('chair', 'Chair', 'Silla'),
        opt('bed', 'Bed', 'Cama'), opt('cabinet', 'Cabinet/Wardrobe', 'Armario'), opt('desk', 'Desk', 'Escritorio'),
    ].concat(OTHER),
};
const MATERIAL = {
    key: 'material',
    label: label('Material', 'Material'),
    type: 'select',
    options: [opt('wood', 'Wood', 'Madera'), opt('metal', 'Metal', 'Metal'), opt('fabric', 'Fabric', 'Tela'), opt('leather', 'Leather', 'Cuero'), opt('glass', 'Glass', 'Vidrio')].concat(OTHER),
};
const APPLIANCE_TYPE = {
    key: 'applianceType',
    label: label('Appliance Type', 'Tipo de Electrodoméstico'),
    type: 'select',
    options: [
        opt('fridge', 'Refrigerator', 'Refrigeradora'), opt('washer', 'Washing Machine', 'Lavadora'),
        opt('microwave', 'Microwave', 'Microondas'), opt('stove', 'Stove/Oven', 'Cocina/Horno'), opt('ac', 'Air Conditioner', 'Aire Acondicionado'),
    ].concat(OTHER),
};

const BIKE_TYPE = {
    key: 'bikeType',
    label: label('Type', 'Tipo'),
    type: 'select',
    options: [
        opt('road', 'Road Bike', 'Bicicleta de Ruta'), opt('mountain', 'Mountain Bike', 'Bicicleta de Montaña'),
        opt('bmx', 'BMX', 'BMX'), opt('electric', 'Electric Bike', 'Bicicleta Eléctrica'),
        opt('kids', "Kids' Bike", 'Bicicleta Infantil'), opt('parts', 'Parts', 'Repuestos'),
        opt('accessories', 'Accessories', 'Accesorios'), opt('apparel', 'Apparel', 'Indumentaria'),
    ].concat(OTHER),
};
const FRAME_SIZE = { key: 'frameSize', label: label('Frame Size', 'Talla del Cuadro'), type: 'text' };
const BIKE_BRANDS = [
    opt('trek', 'Trek', 'Trek'), opt('giant', 'Giant', 'Giant'), opt('specialized', 'Specialized', 'Specialized'),
    opt('cannondale', 'Cannondale', 'Cannondale'), opt('scott', 'Scott', 'Scott'),
];
const FITNESS_TYPE = {
    key: 'fitnessType',
    label: label('Type', 'Tipo'),
    type: 'select',
    options: [opt('weights', 'Weights', 'Pesas'), opt('machine', 'Machine', 'Máquina'), opt('apparel', 'Apparel', 'Ropa'), opt('yoga', 'Yoga/Pilates', 'Yoga/Pilates')].concat(OTHER),
};
const TEAM_SPORT = {
    key: 'sport',
    label: label('Sport', 'Deporte'),
    type: 'select',
    options: [opt('soccer', 'Soccer', 'Fútbol'), opt('basketball', 'Basketball', 'Baloncesto'), opt('baseball', 'Baseball', 'Béisbol'), opt('volleyball', 'Volleyball', 'Voleibol')].concat(OTHER),
};
const FISHING_TYPE = {
    key: 'fishingType',
    label: label('Type', 'Tipo'),
    type: 'select',
    options: [opt('rod', 'Rod', 'Caña'), opt('reel', 'Reel', 'Carrete'), opt('lures', 'Lures/Bait', 'Señuelos/Carnada'), opt('tackle', 'Tackle Box', 'Caja de Aparejos')].concat(OTHER),
};
const CAMPING_TYPE = {
    key: 'campingType',
    label: label('Type', 'Tipo'),
    type: 'select',
    options: [opt('tent', 'Tent', 'Carpa'), opt('sleepingbag', 'Sleeping Bag', 'Bolsa de Dormir'), opt('backpack', 'Backpack', 'Mochila'), opt('stove', 'Camping Stove', 'Cocina de Campamento')].concat(OTHER),
};

const CLOTHING_SIZE = {
    key: 'size',
    label: label('Size', 'Talla'),
    type: 'select',
    options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((v) => opt(v, v, v)).concat(OTHER),
};
const SHOE_SIZE = { key: 'shoeSize', label: label('Shoe Size', 'Talla de Zapato'), type: 'text' };
const JEWELRY_MATERIAL = {
    key: 'jewelryMaterial',
    label: label('Material', 'Material'),
    type: 'select',
    options: [opt('gold', 'Gold', 'Oro'), opt('silver', 'Silver', 'Plata'), opt('steel', 'Stainless Steel', 'Acero Inoxidable'), opt('costume', 'Costume/Fashion', 'Bisutería')].concat(OTHER),
};

const RECOMMENDED_AGE = { key: 'recommendedAge', label: label('Recommended Age', 'Edad Recomendada'), type: 'text' };
const AUTHOR = { key: 'author', label: label('Author', 'Autor'), type: 'text' };
const BOOK_LANGUAGE = {
    key: 'language',
    label: label('Language', 'Idioma'),
    type: 'select',
    options: [opt('spanish', 'Spanish', 'Español'), opt('english', 'English', 'Inglés')].concat(OTHER),
};

const GUITAR_TYPE = {
    key: 'guitarType',
    label: label('Guitar Type', 'Tipo de Guitarra'),
    type: 'select',
    options: [opt('acoustic', 'Acoustic', 'Acústica'), opt('electric', 'Electric', 'Eléctrica'), opt('bass', 'Bass', 'Bajo'), opt('classical', 'Classical', 'Clásica')].concat(OTHER),
};
const KEY_COUNT = { key: 'keyCount', label: label('Number of Keys', 'Número de Teclas'), type: 'text' };
const PERCUSSION_TYPE = {
    key: 'percussionType',
    label: label('Type', 'Tipo'),
    type: 'select',
    options: [opt('acoustic_kit', 'Acoustic Drum Kit', 'Batería Acústica'), opt('electronic_kit', 'Electronic Drum Kit', 'Batería Electrónica'), opt('percussion', 'Hand Percussion', 'Percusión Menor')].concat(OTHER),
};

const YEAR_MINTED = { key: 'yearMinted', label: label('Year', 'Año'), type: 'text' };
const ORIGIN_COUNTRY = { key: 'originCountry', label: label('Country of Origin', 'País de Origen'), type: 'text' };
const CARD_GAME = {
    key: 'cardGame',
    label: label('Game/Franchise', 'Juego/Franquicia'),
    type: 'select',
    options: [opt('pokemon', 'Pokémon', 'Pokémon'), opt('mtg', 'Magic: The Gathering', 'Magic: The Gathering'), opt('sports', 'Sports Cards', 'Tarjetas Deportivas'), opt('yugioh', 'Yu-Gi-Oh!', 'Yu-Gi-Oh!')].concat(OTHER),
};

const CAR_BRANDS = [
    opt('toyota', 'Toyota', 'Toyota'), opt('honda', 'Honda', 'Honda'), opt('hyundai', 'Hyundai', 'Hyundai'),
    opt('kia', 'Kia', 'Kia'), opt('nissan', 'Nissan', 'Nissan'), opt('suzuki', 'Suzuki', 'Suzuki'),
    opt('ford', 'Ford', 'Ford'), opt('chevrolet', 'Chevrolet', 'Chevrolet'),
];
const MILEAGE = { key: 'mileage', label: label('Mileage (km)', 'Kilometraje (km)'), type: 'text' };
const TRANSMISSION = {
    key: 'transmission',
    label: label('Transmission', 'Transmisión'),
    type: 'select',
    options: [opt('manual', 'Manual', 'Manual'), opt('automatic', 'Automatic', 'Automática')],
};
const ENGINE_SIZE = { key: 'engineSize', label: label('Engine Size (cc)', 'Cilindraje (cc)'), type: 'text' };
const TIRE_SIZE = { key: 'tireSize', label: label('Tire Size', 'Medida de Llanta'), type: 'text' };
const COMPATIBLE_BRAND = { key: 'compatibleBrand', label: label('Compatible Brand/Model', 'Marca/Modelo Compatible'), type: 'text' };

// category -> { default: [...fields for any subcategory not listed below],
//               subcategories: { [subCategoryName]: [...fields] } }
export const CATEGORY_ATTRIBUTES = {
    'Electrónicos': {
        default: [BRAND(), MODEL],
        subcategories: {
            'Celulares': [BRAND(PHONE_BRANDS), MODEL, STORAGE],
            'Computadoras': [BRAND(COMPUTER_BRANDS), MODEL, RAM],
            'Tablets': [BRAND(PHONE_BRANDS), MODEL, STORAGE],
            'Cámaras': [BRAND(CAMERA_BRANDS), MODEL],
            'Televisores': [BRAND(TV_BRANDS), SCREEN_SIZE],
            'Videojuegos': [PLATFORM],
        },
    },
    'Hogar': {
        default: [],
        subcategories: {
            'Muebles': [FURNITURE_TYPE, MATERIAL],
            'Electrodomésticos': [APPLIANCE_TYPE, BRAND()],
            'Herramientas': [BRAND()],
        },
    },
    'Deportes': {
        default: [],
        subcategories: {
            'Ciclismo': [BIKE_TYPE, BRAND(BIKE_BRANDS), FRAME_SIZE],
            'Fitness': [FITNESS_TYPE],
            'Deportes de Equipo': [TEAM_SPORT],
            'Pesca': [FISHING_TYPE],
            'Camping': [CAMPING_TYPE],
        },
    },
    'Moda': {
        default: [BRAND(), CLOTHING_SIZE],
        subcategories: {
            'Calzado': [BRAND(), SHOE_SIZE],
            'Joyería': [JEWELRY_MATERIAL],
            'Relojes': [BRAND(), MODEL],
            'Bolsos': [BRAND()],
            'Accesorios': [BRAND()],
        },
    },
    'Salud y Belleza': {
        default: [BRAND()],
    },
    'Juguetes y Bebés': {
        default: [],
        subcategories: {
            'Juguetes': [RECOMMENDED_AGE, BRAND()],
            'Bebés': [BRAND()],
        },
    },
    'Mascotas': {
        default: [BRAND()],
    },
    'Libros': {
        default: [AUTHOR, BOOK_LANGUAGE],
    },
    'Música e Instrumentos': {
        default: [BRAND(), MODEL],
        subcategories: {
            'Guitarras': [GUITAR_TYPE, BRAND(), MODEL],
            'Teclados': [BRAND(), MODEL, KEY_COUNT],
            'Batería y Percusión': [PERCUSSION_TYPE, BRAND()],
            'Audio DJ': [BRAND(), MODEL],
        },
    },
    'Arte y Artesanía': {
        default: [],
    },
    'Coleccionables': {
        default: [],
        subcategories: {
            'Monedas y Billetes': [YEAR_MINTED, ORIGIN_COUNTRY],
            'Tarjetas Coleccionables': [CARD_GAME],
        },
    },
    'Oficina y Escuela': {
        default: [],
        subcategories: {
            'Muebles de Oficina': [FURNITURE_TYPE, MATERIAL],
        },
    },
    'Jardín y Exterior': {
        default: [],
    },
    'Alimentos': {
        default: [],
    },
    'Vehículos': {
        default: [BRAND(CAR_BRANDS), MODEL, YEAR],
        subcategories: {
            'Autos': [BRAND(CAR_BRANDS), MODEL, YEAR, MILEAGE, TRANSMISSION],
            'Camiones': [BRAND(CAR_BRANDS), MODEL, YEAR, MILEAGE],
            'Motos y ATV': [BRAND(), MODEL, YEAR, ENGINE_SIZE],
            'Llantas y Rines': [BRAND(), TIRE_SIZE],
            'Repuestos y Accesorios': [COMPATIBLE_BRAND],
            'Audio para Carro': [BRAND()],
        },
    },
};

export function getAttributeFields(category, subCategory) {
    const cfg = CATEGORY_ATTRIBUTES[category];
    if (!cfg) return [];
    return (subCategory && cfg.subcategories && cfg.subcategories[subCategory]) || cfg.default || [];
}

export function fieldLabel(field, loc) {
    return loc === 'en' ? field.label.en : field.label.es;
}

export function optionLabel(field, value, loc) {
    const found = field.options?.find((o) => o.value === value);
    if (!found) return value;
    return loc === 'en' ? found.en : found.es;
}
