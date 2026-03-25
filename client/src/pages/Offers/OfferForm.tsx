import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Plus, X, Image as ImageIcon, Upload } from 'lucide-react';
import type { Offer } from '../../types';

interface OfferHotel {
    id: string; // Assignment ID
    room_id: string;
    hotel_name: string;
    room_number: string;
    capacity: number;
    infant_price: number;
    child_price: number;
    adult_price: number;
}

interface Room {
    id: string;
    hotel_name: string;
    room_number: string;
    capacity: number;
    price: number;
    infant_price: number;
    child_price: number;
    adult_price: number;
}

interface OfferFormProps {
    onClose: () => void;
    initialData?: Offer;
}

const OfferForm = ({ onClose, initialData }: OfferFormProps) => {
    const { addOffer, updateOffer, uploadOfferImage } = useData();
    const [currentStep, setCurrentStep] = useState(1);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const [formData, setFormData] = useState<Partial<Offer>>({
        title: '',
        type: 'Omra',
        destination: '',
        price: 0,
        disponibilite: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        hotel: '',
        transport: 'Avion',
        description: '',
        status: 'Active',
        inclusions: {
            visa: false,
            transfer: false,
            assurance: false,
            guide: false,
            photos: false,
            excursions: false,
            petitDejeuner: false,
            dejeuner: false,
            diner: false,
            bagages: false,
        },
        isFeatured: false,
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                inclusions: initialData.inclusions || {
                    visa: false,
                    transfer: false,
                    assurance: false,
                    guide: false,
                    photos: false,
                    excursions: false,
                    petitDejeuner: false,
                    dejeuner: false,
                    diner: false,
                    bagages: false,
                },
            });
            if (initialData.imageUrl) {
                setImagePreview(initialData.imageUrl);
            }
        }
    }, [initialData]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Hotels state for age-based pricing
    const [hotels, setHotels] = useState<OfferHotel[]>([]);
    const [availableRooms, setAvailableRooms] = useState<Room[]>([]);

    // Selection state
    const [selectedHotelFilter, setSelectedHotelFilter] = useState<string>('');
    const [selectedRoomId, setSelectedRoomId] = useState<string>('');
    const [isAddingRoom, setIsAddingRoom] = useState(false);

    // Derived state for unique hotel names
    const uniqueHotels = Array.from(new Set(availableRooms.map(r => r.hotel_name))).sort();

    // Filter rooms by selected hotel
    const filteredRooms = selectedHotelFilter
        ? availableRooms.filter(r => r.hotel_name === selectedHotelFilter)
        : [];

    const [roomsDebugInfo, setRoomsDebugInfo] = useState<any>(null); // Store debug feedback

    // Fetch hotels when editing
    useEffect(() => {
        if (initialData?.id) {
            fetchOfferHotels(initialData.id);
            if (currentStep === 2) {
                fetchAvailableRooms(initialData.id);
            }
        }
    }, [initialData, currentStep]);

    const fetchOfferHotels = async (offerId: string) => {
        try {
            const response = await fetch(`/api/offers/${offerId}/hotels`, {
                credentials: 'include'
            });
            const data = await response.json();
            setHotels(data.hotels || []);
        } catch (error) {
            console.error('Error fetching hotels:', error);
        }
    };

    const fetchAvailableRooms = async (offerId: string) => {
        try {
            // Fetch ALL active rooms from the proven /api/rooms endpoint
            const response = await fetch(`/api/rooms`, {
                credentials: 'include'
            });
            const allRooms = await response.json();

            // Fetch rooms already assigned to THIS offer
            const assignedResponse = await fetch(`/api/offers/${offerId}/hotels`, {
                credentials: 'include'
            });
            const assignedData = await assignedResponse.json();
            const assignedRoomIds = (assignedData.hotels || []).map((h: any) => h.room_id);

            // Filter out already-assigned rooms
            const available = allRooms.filter((room: any) =>
                !assignedRoomIds.includes(room.id)
            );

            setAvailableRooms(available);
            setRoomsDebugInfo({
                totalInDb: allRooms.length,
                activeInDb: allRooms.length,
                foundAvailable: available.length
            });
            console.log('Rooms fetched:', { total: allRooms.length, available: available.length, assigned: assignedRoomIds.length });
        } catch (error) {
            console.error('Error fetching available rooms:', error);
        }
    };

    const addRoomToOffer = async () => {
        if (!selectedRoomId || !initialData?.id) return;

        try {
            const response = await fetch(`/api/offers/${initialData.id}/hotels`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ room_id: selectedRoomId })
            });

            if (response.ok) {
                await fetchOfferHotels(initialData.id);
                await fetchAvailableRooms(initialData.id);
                setIsAddingRoom(false);
                setSelectedRoomId('');
            }
        } catch (error) {
            console.error('Error adding room:', error);
            alert('Erreur lors de l\'ajout du voyage');
        }
    };

    const removeHotel = async (assignmentId: string) => {
        if (!initialData?.id) return;

        try {
            await fetch(`/api/offers/hotels/${assignmentId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            await fetchOfferHotels(initialData.id);
            await fetchAvailableRooms(initialData.id);
        } catch (error) {
            alert('Erreur lors de la suppression');
        }
    };

    // Helper to format currency
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(price);
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);

        try {
            let savedOffer: Offer;

            if (initialData) {
                savedOffer = { ...initialData, ...formData } as Offer;
                await updateOffer(savedOffer);
            } else {
                const tempId = Math.random().toString(36).substr(2, 9);
                const offerToCreate = {
                    ...formData,
                    id: tempId
                } as Offer;
                savedOffer = await addOffer(offerToCreate);
            }

            // Upload image if selected
            if (imageFile && (savedOffer.id || initialData?.id)) {
                const targetId = savedOffer.id || initialData!.id!;
                await uploadOfferImage(targetId, imageFile);
            }

            onClose();
        } catch (error) {
            console.error('Failed to save offer:', error);
            alert('Erreur lors de l\'enregistrement de l\'offre. Veuillez vérifier les champs et réessayer.');
        } finally {
            setIsUploading(false);
        }
    };

    // Removed old saveOfferHotels - using direct API calls now

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: (name === 'price' || name === 'disponibilite') ? Number(value) : value
        }));
    };

    const handleInclusionChange = (key: keyof NonNullable<Offer['inclusions']>) => {
        setFormData(prev => ({
            ...prev,
            inclusions: {
                ...prev.inclusions!,
                [key]: !prev.inclusions![key]
            }
        }));
    };



    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: checked
        }));
    };

    const goToNextStep = (e?: React.MouseEvent<HTMLButtonElement>) => {
        e?.preventDefault();
        if (currentStep === 1) {
            if (!formData.title || !formData.destination || !formData.startDate || !formData.endDate) {
                alert('Veuillez remplir tous les champs obligatoires');
                return;
            }
            setCurrentStep(2);
        }
    };

    const goToPreviousStep = (e?: React.MouseEvent<HTMLButtonElement>) => {
        e?.preventDefault();
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-6">
                <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${currentStep >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
                    <div className={`h-1 w-10 ${currentStep >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${currentStep >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                </div>
            </div>

            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de base</h3>

                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Titre de l'offre</label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    placeholder="Ex: Omra Ramadan 2024"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    >
                                        <option value="Omra">Omra</option>
                                        <option value="Haj">Haj</option>
                                        <option value="Voyage Organisé">Voyage Organisé</option>
                                        <option value="Visa">Visa</option>
                                        <option value="Autre">Autre</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                                    <input
                                        type="text"
                                        name="destination"
                                        required
                                        value={formData.destination}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        placeholder="Ex: La Mecque"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-4">
                                <input
                                    type="checkbox"
                                    id="isFeatured"
                                    name="isFeatured"
                                    checked={formData.isFeatured || false}
                                    onChange={handleCheckboxChange}
                                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                />
                                <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    Mettre en avant cette offre sur la page d'accueil (Packages Populaires)
                                </label>
                            </div>
                        </div>

                        {/* Image Upload Section */}
                        <div className="w-full md:w-48">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Photo de l'offre</label>
                            <div className="relative group">
                                <div className={`aspect-[4/3] w-full border-2 border-dashed rounded-xl overflow-hidden flex flex-col items-center justify-center transition-all ${imagePreview ? 'border-primary/50 bg-primary/5' : 'border-gray-300 bg-gray-50 hover:border-primary/50'}`}>
                                    {imagePreview ? (
                                        <>
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => { setImageFile(null); setImagePreview(null); }}
                                                className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm text-red-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={14} />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="text-center p-4">
                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                                                <ImageIcon className="text-gray-400" size={20} />
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-medium">PNG, JPG up to 5MB</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                                {!imagePreview && (
                                    <div className="mt-2 flex items-center justify-center gap-1.5 text-primary text-xs font-semibold">
                                        <Upload size={14} />
                                        <span>Choisir une photo</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date de départ</label>
                            <input
                                type="date"
                                name="startDate"
                                required
                                value={formData.startDate}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date de retour</label>
                            <input
                                type="date"
                                name="endDate"
                                required
                                value={formData.endDate}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Disponibilité</label>
                            <input
                                type="number"
                                name="disponibilite"
                                required
                                min="0"
                                step="1"
                                pattern="[0-9]*"
                                value={formData.disponibilite}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                placeholder="Nombre de places disponibles"
                            />
                        </div>
                    </div>



                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Transport</label>
                            <select
                                name="transport"
                                value={formData.transport}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            >
                                <option value="Avion">Avion</option>
                                <option value="Bus">Bus</option>
                                <option value="Sans Transport">Sans Transport</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            placeholder="Détails de l'offre..."
                        />
                    </div>
                </div>
            )}

            {/* Step 2: Rooms & Age-Based Pricing */}
            {currentStep === 2 && (
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Hôtels et Tarification par Âge</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Sélectionnez les chambres du "Rooming List" pour associer leurs tarifs à cette offre.
                        Les prix sont récupérés automatiquement de la configuration de la chambre.
                    </p>

                    {/* Room Management Section */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-md font-medium text-gray-800">Chambres / Hôtels assignés</h4>
                            {initialData?.id ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        fetchAvailableRooms(initialData.id!);
                                        setIsAddingRoom(true);
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                >
                                    <Plus size={16} />
                                    Ajouter Chambre
                                </button>
                            ) : (
                                <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                    Enregistrez l'offre d'abord pour ajouter des chambres
                                </div>
                            )}
                        </div>

                        {/* Validating Data Availability with Debug Info */}
                        {isAddingRoom && availableRooms.length === 0 && (
                            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
                                <p className="font-bold flex items-center gap-2">
                                    <span className="text-xl">⚠️</span>
                                    Aucune chambre disponible trouvée.
                                </p>
                                {roomsDebugInfo ? (
                                    <ul className="list-disc ml-8 mt-2 space-y-1 text-xs text-amber-900">
                                        <li>Total chambres en base de données: <strong>{roomsDebugInfo.totalInDb}</strong></li>
                                        <li>Chambres avec statut 'ACTIVE': <strong>{roomsDebugInfo.activeInDb}</strong></li>
                                        <li>Chambres filtrées (non déjà assignées): <strong>{roomsDebugInfo.foundAvailable}</strong></li>
                                    </ul>
                                ) : (
                                    <p className="mt-2 text-xs font-bold text-red-600 bg-red-50 p-2 rounded">
                                        ⚠️ Le serveur semble ne pas avoir redémarré avec la nouvelle mise à jour de diagnostic. Veuillez patienter 10 secondes et réessayer.
                                    </p>
                                )}
                                <p className="mt-2 text-xs">
                                    Vérifiez que vous avez bien créé des chambres et qu'elles ne sont pas archivées.
                                    Le système ignore la casse (Active/active) et les chambres déjà liées à cette offre.
                                </p>
                            </div>
                        )}

                        {/* Add Room Modal/Inline Form */}
                        {isAddingRoom && (
                            <div className="mb-4 bg-white p-4 rounded-lg border border-primary/20 shadow-sm">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ajouter une chambre</label>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                    {/* 1. Select Hotel */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">1. Choisir l'Hôtel</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 text-sm"
                                            value={selectedHotelFilter}
                                            onChange={(e) => {
                                                setSelectedHotelFilter(e.target.value);
                                                setSelectedRoomId(''); // Reset room when hotel changes
                                            }}
                                        >
                                            <option value="">-- Sélectionner un hôtel --</option>
                                            {uniqueHotels.map(hotel => (
                                                <option key={hotel} value={hotel}>{hotel}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 2. Select Room (Filtered) */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">2. Choisir la Chambre</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 text-sm"
                                            value={selectedRoomId}
                                            onChange={(e) => setSelectedRoomId(e.target.value)}
                                            disabled={!selectedHotelFilter}
                                        >
                                            <option value="">
                                                {selectedHotelFilter ? '-- Sélectionner une chambre --' : '-- Choisir un hôtel d\'abord --'}
                                            </option>
                                            {filteredRooms.map(room => (
                                                <option key={room.id} value={room.id}>
                                                    Ch.{room.room_number} ({room.capacity} pers) - {formatPrice(room.adult_price)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsAddingRoom(false);
                                            setSelectedHotelFilter('');
                                            setSelectedRoomId('');
                                        }}
                                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="button"
                                        onClick={addRoomToOffer}
                                        disabled={!selectedRoomId}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                                    >
                                        Confirmer Ajout
                                    </button>
                                </div>
                            </div>
                        )}

                        {hotels.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                                <p>Aucune chambre assignée. Cliquez sur "Ajouter Chambre" pour lier une chambre du Rooming List.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {hotels.map((hotel, index) => (
                                    <div key={hotel.id || index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                        <div className="flex justify-between items-start mb-3 border-b pb-2">
                                            <div>
                                                <h5 className="font-semibold text-gray-900">{hotel.hotel_name}</h5>
                                                <div className="text-xs text-gray-500">
                                                    Chambre {hotel.room_number} • Capacité: {hotel.capacity} pers
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeHotel(hotel.id!)}
                                                className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                                title="Retirer cette chambre"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="bg-blue-50 p-2 rounded text-center">
                                                <span className="block text-xs font-bold text-blue-700 mb-1">Bébé (0-2) 👶</span>
                                                <span className="font-mono text-sm">{formatPrice(hotel.infant_price)}</span>
                                            </div>
                                            <div className="bg-green-50 p-2 rounded text-center">
                                                <span className="block text-xs font-bold text-green-700 mb-1">Enfant (3-17) 🧒</span>
                                                <span className="font-mono text-sm">{formatPrice(hotel.child_price)}</span>
                                            </div>
                                            <div className="bg-purple-50 p-2 rounded text-center">
                                                <span className="block text-xs font-bold text-purple-700 mb-1">Adulte (18+) 👤</span>
                                                <span className="font-mono text-sm">{formatPrice(hotel.adult_price)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Section A: Inclusions */}
                    <div>
                        <h4 className="text-md font-medium text-gray-800 mb-3">Inclusions</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                                { key: 'visa', label: 'Visa' },
                                { key: 'transfer', label: 'Transfer' },
                                { key: 'assurance', label: 'Assurance' },
                                { key: 'guide', label: 'Guide' },
                                { key: 'photos', label: 'Photos' },
                                { key: 'excursions', label: 'Excursions' },
                                { key: 'petitDejeuner', label: 'Petit déjeuner' },
                                { key: 'dejeuner', label: 'Déjeuner' },
                                { key: 'diner', label: 'Dîner' },
                                { key: 'bagages', label: 'Bagages' },
                            ].map((inclusion) => (
                                <label key={inclusion.key} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.inclusions?.[inclusion.key as keyof NonNullable<Offer['inclusions']>] || false}
                                        onChange={() => handleInclusionChange(inclusion.key as keyof NonNullable<Offer['inclusions']>)}
                                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                    />
                                    <span className="text-sm text-gray-700">{inclusion.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>


                </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-3 pt-4 border-t">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 border rounded-lg hover:bg-gray-50 font-medium text-gray-700"
                >
                    Annuler
                </button>
                <div className="flex gap-3">
                    {currentStep > 1 && (
                        <button
                            type="button"
                            onClick={goToPreviousStep}
                            className="px-6 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium"
                        >
                            Précédent
                        </button>
                    )}
                    {currentStep < 2 ? (
                        <button
                            type="button"
                            onClick={goToNextStep}
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                        >
                            Suivant
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={isUploading}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isUploading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            {initialData ? 'Mettre à jour' : 'Créer l\'Offre'}
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
};

export default OfferForm;
