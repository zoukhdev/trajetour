import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Plus, X } from 'lucide-react';
import type { Offer } from '../../types';

interface OfferFormProps {
    onClose: () => void;
    initialData?: Offer;
}

const OfferForm = ({ onClose, initialData }: OfferFormProps) => {
    const { addOffer, updateOffer } = useData();
    const [currentStep, setCurrentStep] = useState(1);

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
        roomPricing: [],
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
                roomPricing: initialData.roomPricing || [],
            });
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (initialData) {
            updateOffer({ ...initialData, ...formData } as Offer);
        } else {
            const newOffer: Offer = {
                id: Math.random().toString(36).substr(2, 9),
                ...formData as Omit<Offer, 'id'>
            };
            addOffer(newOffer);
        }
        onClose();
    };

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

    const addRoomPricing = () => {
        setFormData(prev => ({
            ...prev,
            roomPricing: [
                ...(prev.roomPricing || []),
                {
                    id: Math.random().toString(36).substr(2, 9),
                    description: '',
                    price: 0,
                }
            ]
        }));
    };

    const removeRoomPricing = (id: string) => {
        setFormData(prev => ({
            ...prev,
            roomPricing: prev.roomPricing?.filter(room => room.id !== id) || []
        }));
    };

    const updateRoomPricing = (id: string, field: 'description' | 'price', value: string | number) => {
        setFormData(prev => ({
            ...prev,
            roomPricing: prev.roomPricing?.map(room =>
                room.id === id ? { ...room, [field]: field === 'price' ? Number(value) : value } : room
            ) || []
        }));
    };

    const goToNextStep = (e?: React.MouseEvent<HTMLButtonElement>) => {
        e?.preventDefault();
        if (currentStep === 1) {
            // Validate Step 1
            if (!formData.title || !formData.destination || !formData.startDate || !formData.endDate) {
                alert('Veuillez remplir tous les champs obligatoires');
                return;
            }
            setCurrentStep(2);
        }
    };

    const goToPreviousStep = (e?: React.MouseEvent<HTMLButtonElement>) => {
        e?.preventDefault();
        if (currentStep === 2) {
            setCurrentStep(1);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-6">
                <div className="flex items-center gap-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${currentStep >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                        1
                    </div>
                    <div className={`h-1 w-20 ${currentStep >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${currentStep >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                        2
                    </div>
                </div>
            </div>

            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de base</h3>

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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prix (DZD)</label>
                            <input
                                type="number"
                                name="price"
                                required
                                min="0"
                                value={formData.price}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            />
                        </div>
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            >
                                <option value="Active">Active</option>
                                <option value="Draft">Brouillon</option>
                                <option value="Archived">Archivée</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hôtel (Optionnel)</label>
                            <input
                                type="text"
                                name="hotel"
                                value={formData.hotel}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                placeholder="Nom de l'hôtel"
                            />
                        </div>
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

            {/* Step 2: Inclusions and Room Pricing */}
            {currentStep === 2 && (
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Options et configurations</h3>

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

                    {/* Section B: Room Pricing */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-md font-medium text-gray-800">Configurations de chambres</h4>
                            <button
                                type="button"
                                onClick={addRoomPricing}
                                className="flex items-center gap-1 text-sm bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus size={16} />
                                <span>Ajouter</span>
                            </button>
                        </div>

                        <div className="space-y-3">
                            {formData.roomPricing && formData.roomPricing.length > 0 ? (
                                formData.roomPricing.map((room) => (
                                    <div key={room.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                                                <input
                                                    type="text"
                                                    value={room.description}
                                                    onChange={(e) => updateRoomPricing(room.id, 'description', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                    placeholder="Ex: Chambre 3 lits"
                                                />
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Prix (DZD)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={room.price}
                                                        onChange={(e) => updateRoomPricing(room.id, 'price', e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                        placeholder="150000"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeRoomPricing(room.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">Aucune configuration de chambre. Cliquez sur "Ajouter" pour commencer.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between gap-3 pt-4 border-t">
                {currentStep === 1 ? (
                    <>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={goToNextStep}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Suivant
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={goToPreviousStep}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Précédent
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            {initialData ? 'Modifier' : 'Créer Offre'}
                        </button>
                    </>
                )}
            </div>
        </form>
    );
};

export default OfferForm;
