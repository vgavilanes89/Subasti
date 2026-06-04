import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useItems } from '../context/ItemsContext';

// Reusable Form Components
const FormSection = ({ title, children }) => (
    <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);

const FormField = ({ label, children }) => (
    <div>
        <label className="text-sm font-bold text-gray-700 block mb-2">{label}</label>
        {children}
    </div>
);

const SellPage = ({ loc, categories }) => {
    const { user } = useAuth();
    const { addItem } = useItems();
    const navigate = useNavigate();
    // If categories is not passed, fallback to empty object to prevent crash
    const CATEGORIES = categories || {}; 
    const initialCategory = Object.keys(CATEGORIES)[0] || '';
    const initialSubCategory = (CATEGORIES[initialCategory] && CATEGORIES[initialCategory][0]) || '';
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        saleType: 'auc', // 'buy' or 'auc'
        category: initialCategory,
        subCategory: initialSubCategory,
        condition: 'new', // 'new' or 'used'
        usedCondition: 'good', // 'like_new', 'good', 'fair', 'parts_only'
        usedConditionDetail: '',
        price: '',
        buyNowPrice: '',
        quantity: 1,
        reservePrice: '',
        auctionDuration: '7',
        images: [],
        shippingShip: true,
        shippingLocal: false,
        shippingCost: '3000',
    });
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = React.useRef(null);

    const L = loc === 'en' ? {
        title: 'List Your Item',
        itemTitle: 'Item Title',
        description: 'Description',
        saleType: 'Sale Type',
        buyNow: 'Buy Now',
        buyNowPrice: 'Buy Now Price (Optional)',
        auction: 'Auction',
        category: 'Category',
        subCategory: 'Sub-Category',
        condition: 'Condition',
        new: 'New',
        used: 'Used',
        usedInfo: 'Used Item Details',
        usedCondition: 'Condition',
        likeNew: 'Like New',
        good: 'Good',
        fair: 'Fair',
        partsOnly: 'Parts Only',
        conditionDetail: 'Condition Details (e.g., scratches, defects)',
        pricing: 'Pricing & Quantity',
        price: 'Price',
        quantity: 'Quantity Available',
        startBid: 'Starting Bid',
        reservePrice: 'Reserve Price (Optional)',
        auctionDuration: 'Auction Duration',
        fastAuc24h: '24 Hour Auction',
        days3: '3 Days',
        days7: '7 Days',
        days15: '15 Days',
        days21: '21 Days',
        endsOn: 'Ends on',
        images: 'Images',
        imageDesc: 'Drag & drop images here, or click to select files. (Max 5)',
        addImage: 'Add Image',
        publish: 'Publish Item',
        errorMsg: 'Please add at least one image to publish your item.',
        titleLengthError: 'Title must be at least 10 characters long.',
        descLengthError: 'Description must be at least 15 words long.',
        buyNowPriceError: 'Buy Now price must be at least 15% higher than the starting bid.',
        wordCount: 'words',
        shippingOptions: 'Shipping Options',
        shippingDesc: 'Select how the buyer can receive your item.',
        ship: 'Ship this item',
        shippingCost: 'Shipping Cost',
        localPickup: 'Local pickup available',
    } : {
        title: 'Publica Tu Artículo',
        itemTitle: 'Título del Artículo',
        description: 'Descripción',
        saleType: 'Tipo de Venta',
        buyNow: 'Compra Inmediata',
        buyNowPrice: 'Precio de Compra Inmediata (Opcional)',
        auction: 'Subasta',
        category: 'Categoría',
        subCategory: 'Sub-Categoría',
        condition: 'Condición',
        new: 'Nuevo',
        used: 'Usado',
        usedInfo: 'Detalles del Artículo Usado',
        usedCondition: 'Condición',
        likeNew: 'Como Nuevo',
        good: 'Bueno',
        fair: 'Aceptable',
        partsOnly: 'Solo Partes',
        conditionDetail: 'Detalles de la condición (ej. rayones, defectos)',
        pricing: 'Precio y Cantidad',
        price: 'Precio',
        quantity: 'Cantidad Disponible',
        startBid: 'Oferta Inicial',
        reservePrice: 'Precio de Reserva (Opcional)',
        auctionDuration: 'Duración de Subasta',
        fastAuc24h: 'Subasta de 24 Horas',
        days3: '3 Días',
        days7: '7 Días',
        days15: '15 Días',
        days21: '21 Días',
        endsOn: 'Termina el',
        images: 'Imágenes',
        imageDesc: 'Arrastra y suelta imágenes aquí, o haz clic para seleccionar archivos. (Máx 5)',
        addImage: 'Agregar Imagen',
        publish: 'Publicar Artículo',
        errorMsg: 'Por favor, agrega al menos una imagen para publicar tu artículo.',
        titleLengthError: 'El título debe tener al menos 10 caracteres.',
        descLengthError: 'La descripción debe tener al menos 15 palabras.',
        buyNowPriceError: 'El precio de Compra Inmediata debe ser al menos 15% más alto que la oferta inicial.',
        wordCount: 'palabras',
        shippingOptions: 'Opciones de Envío',
        shippingDesc: 'Selecciona cómo el comprador puede recibir tu artículo.',
        ship: 'Enviar este artículo',
        shippingCost: 'Costo de Envío',
        localPickup: 'Recogida local disponible',
    };

    const descriptionWordCount = useMemo(() => {
        return formData.description.trim().split(/\s+/).filter(Boolean).length;
    }, [formData.description]);

    const auctionEndDate = useMemo(() => {
        if (formData.saleType !== 'auc') return null;
        const now = new Date();
        const durationDays = parseInt(formData.auctionDuration, 10);
        now.setDate(now.getDate() + durationDays);
        return now;
    }, [formData.saleType, formData.auctionDuration]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            const newState = {
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            };
            if (name === 'category') {
                const subCats = CATEGORIES[value];
                newState.subCategory = subCats && subCats.length > 0 ? subCats[0] : '';
            }
            return newState;
        });
    };

    const processFiles = (files) => {
        if (!files) return;
        const newImages = [];
        for (let i = 0; i < files.length; i++) {
            if (formData.images.length + newImages.length >= 5) break;
            const file = files[i];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    newImages.push(e.target.result);
                    if (i === files.length - 1 || formData.images.length + newImages.length === 5) {
                        setFormData(prev => ({...prev, images: [...prev.images, ...newImages]}));
                    }
                };
                reader.readAsDataURL(file);
            }
        }
    };
    
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        processFiles(e.dataTransfer.files);
    };

    const handleFileSelect = (e) => {
        processFiles(e.target.files);
    }

    const handleRemoveImage = (index) => {
        setFormData(prev => ({...prev, images: prev.images.filter((_, i) => i !== index) }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validation checks
        if (formData.title.trim().length < 10) {
            alert(L.titleLengthError);
            return;
        }
        if (descriptionWordCount < 15) {
            alert(L.descLengthError);
            return;
        }
        if (formData.images.length === 0) {
            alert(L.errorMsg);
            return;
        }

        const startPrice = Number(formData.price);
        const buyNowPrice = Number(formData.buyNowPrice);

        if (formData.saleType === 'auc' && buyNowPrice > 0) {
            if (buyNowPrice < startPrice * 1.15) {
                alert(L.buyNowPriceError);
                return;
            }
        }

        const newItem = {
            id: `item_${Date.now()}`,
            sellerId: user.id,
            ...formData,
            price: Number(formData.price),
            buyNowPrice: formData.buyNowPrice ? Number(formData.buyNowPrice) : null,
            quantity: formData.saleType === 'buy' ? Number(formData.quantity) : 1,
            reservePrice: formData.reservePrice ? Number(formData.reservePrice) : null,
            shippingCost: formData.shippingShip ? Number(formData.shippingCost) : 0,
            image: formData.images[0], // Use first image as main
            images: formData.images, // Save all images
            // For auctions, set initial bid and end time
            ...(formData.saleType === 'auc' && {
                currentBid: Number(formData.price),
                bids: 0,
                endAt: new Date().getTime() + parseInt(formData.auctionDuration, 10) * 24 * 60 * 60 * 1000
            })
        };
        addItem(newItem);
        navigate('/'); // Redirect to home after publishing
    };

    if (!user) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-md border text-center">
                <h2 className="text-2xl font-bold text-gray-800">{loc === 'en' ? 'Please log in to sell' : 'Por favor inicia sesión para vender'}</h2>
                <button onClick={() => navigate('/login')} className="mt-6 bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                    {loc === 'en' ? 'Log In' : 'Iniciar Sesión'}
                </button>
            </div>
        );
    }
    
    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">{L.title}</h2>
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Info */}
                    <div>
                        <FormField label={L.itemTitle}>
                            <input type="text" name="title" value={formData.title} onChange={handleChange} required minLength="10" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500" />
                        </FormField>
                        <FormField label={L.description}>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows="4" required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"></textarea>
                            <p className={`text-sm mt-1 ${descriptionWordCount < 15 ? 'text-red-500' : 'text-gray-500'}`}>{descriptionWordCount} / 15 {L.wordCount}</p>
                        </FormField>
                    </div>

                    {/* Sale Details */}
                    <FormSection title={L.saleType}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label={L.category}>
                                <select name="category" value={formData.category} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500">
                                    {Object.keys(CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </FormField>
                            <FormField label={L.subCategory}>
                                <select 
                                    name="subCategory" 
                                    value={formData.subCategory} 
                                    onChange={handleChange} 
                                    disabled={!formData.category || !CATEGORIES[formData.category]}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100"
                                >
                                    {formData.category && CATEGORIES[formData.category] && CATEGORIES[formData.category].map(sub => <option key={sub} value={sub}>{sub}</option>)}
                                </select>
                            </FormField>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                            <FormField label={L.saleType}>
                                <select name="saleType" value={formData.saleType} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500">
                                    <option value="auc">{L.auction}</option>
                                    <option value="buy">{L.buyNow}</option>
                                </select>
                            </FormField>
                            <FormField label={L.condition}>
                                <select name="condition" value={formData.condition} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500">
                                    <option value="new">{L.new}</option>
                                    <option value="used">{L.used}</option>
                                </select>
                            </FormField>
                        </div>
                    </FormSection>

                    {/* Used Condition Details */}
                    {formData.condition === 'used' && (
                        <FormSection title={L.usedInfo}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label={L.usedCondition}>
                                    <select name="usedCondition" value={formData.usedCondition} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500">
                                        <option value="like_new">{L.likeNew}</option>
                                        <option value="good">{L.good}</option>
                                        <option value="fair">{L.fair}</option>
                                        <option value="parts_only">{L.partsOnly}</option>
                                    </select>
                                </FormField>
                                <FormField label={L.conditionDetail}>
                                    <input type="text" name="usedConditionDetail" value={formData.usedConditionDetail} onChange={handleChange} required={formData.usedCondition === 'fair' || formData.usedCondition === 'parts_only'} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500" />
                                </FormField>
                            </div>
                        </FormSection>
                    )}
                    
                    {/* Pricing */}
                    <FormSection title={L.pricing}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label={formData.saleType === 'auc' ? L.startBid : L.price}>
                                <input type="number" name="price" value={formData.price} onChange={handleChange} required min="0" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500" />
                            </FormField>
                            {formData.saleType === 'buy' ? (
                                <FormField label={L.quantity}>
                                    <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required min="1" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500" />
                                </FormField>
                            ) : ( // Auction fields
                                <>
                                <FormField label={L.reservePrice}>
                                    <input type="number" name="reservePrice" value={formData.reservePrice} onChange={handleChange} min="0" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500" />
                                </FormField>
                                <FormField label={L.buyNowPrice}>
                                    <input type="number" name="buyNowPrice" value={formData.buyNowPrice} onChange={handleChange} min="0" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500" />
                                </FormField>
                                <div className="md:col-span-2">
                                    <FormField label={L.auctionDuration}>
                                        <select name="auctionDuration" value={formData.auctionDuration} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500">
                                            <option value="1">{L.fastAuc24h}</option>
                                            <option value="3">{L.days3}</option>
                                            <option value="7">{L.days7}</option>
                                            <option value="15">{L.days15}</option>
                                            <option value="21">{L.days21}</option>
                                        </select>
                                    </FormField>
                                    {auctionEndDate && (
                                        <p className="text-sm text-gray-600 mt-2">
                                            {L.endsOn}: {auctionEndDate.toLocaleString(loc === 'en' ? 'en-US' : 'es-CR', { dateStyle: 'full', timeStyle: 'short' })}
                                        </p>
                                    )}
                                </div>
                                </>
                            )}
                        </div>
                    </FormSection>

                    {/* Shipping Options */}
                    <FormSection title={L.shippingOptions}>
                        <p className="text-sm text-gray-500 -mt-2 mb-4">{L.shippingDesc}</p>
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <input 
                                    type="checkbox" 
                                    id="shippingShip" 
                                    name="shippingShip" 
                                    checked={formData.shippingShip} 
                                    onChange={handleChange}
                                    className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                                <label htmlFor="shippingShip" className="ml-3 block text-sm font-medium text-gray-700">{L.ship}</label>
                            </div>
                            {formData.shippingShip && (
                                <div className="pl-7 pt-2">
                                    <FormField label={L.shippingCost}>
                                        <input 
                                            type="number" 
                                            name="shippingCost" 
                                            value={formData.shippingCost} 
                                            onChange={handleChange} 
                                            required 
                                            min="0" 
                                            className="w-full md:w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500" 
                                        />
                                    </FormField>
                                </div>
                            )}
                            <div className="flex items-center">
                                <input 
                                    type="checkbox" 
                                    id="shippingLocal" 
                                    name="shippingLocal" 
                                    checked={formData.shippingLocal} 
                                    onChange={handleChange}
                                    className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                                <label htmlFor="shippingLocal" className="ml-3 block text-sm font-medium text-gray-700">{L.localPickup}</label>
                            </div>
                        </div>
                    </FormSection>

                    {/* Image Uploader */}
                    <FormSection title={L.images}>
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current.click()}
                            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                                isDragging ? 'border-purple-600 bg-purple-50' : 'border-gray-300 hover:border-purple-400'
                            }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mb-2"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><line x1="16" x2="22" y1="5" y2="5"/><line x1="19" x2="19" y1="2" y2="8"/><path d="m9 12 2.221 2.221a2 2 0 0 0 2.828 0L17 11"/></svg>
                            <p className="text-sm text-gray-500">{L.imageDesc}</p>
                        </div>
                        <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-4">
                            {formData.images.map((img, index) => (
                                <div key={index} className="relative">
                                    <img src={img} alt="" className="w-full h-24 object-cover rounded-lg border" />
                                    <button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold">&times;</button>
                                </div>
                            ))}
                        </div>
                    </FormSection>
                    
                    <button type="submit" className="w-full bg-purple-600 text-white py-4 mt-6 rounded-lg font-semibold text-lg hover:bg-purple-700 transition-colors">{L.publish}</button>
                </form>
            </div>
        </div>
    );
}

export default SellPage;