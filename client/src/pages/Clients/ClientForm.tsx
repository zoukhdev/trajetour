import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import type { Client, Order, Passenger, Room, Offer } from '../../types';
import { Calendar, CreditCard, Plus, Trash2, Users, AlertTriangle, Building2, TrendingUp, DollarSign } from 'lucide-react';
import Modal from '../../components/Modal';

interface ClientFormProps {
    onClose: () => void;
    initialData?: Client;
}

const ClientForm = ({ onClose, initialData }: ClientFormProps) => {
    const { addClient, updateClient, offers, addOrder, agencies } = useData();
    const { user } = useAuth();
    
    // Client / Lead Passenger Fields
    const [formData, setFormData] = useState<Partial<Client>>(
        initialData || {
            type: 'Individual',
            fullName: '',
            mobileNumber: '',
            passportNumber: '',
            passportExpiry: ''
        }
    );
    const [leadBirthDate, setLeadBirthDate] = useState('');
    
    // Reservation Fields
    const [selectedOfferId, setSelectedOfferId] = useState('');
    const [offerHotels, setOfferHotels] = useState<Room[]>([]);
    
    // Multi-passenger
    const [passengers, setPassengers] = useState<Passenger[]>([]);
    
    // Taxes / Overrides
    const [taxType, setTaxType] = useState<'none' | 'tax' | 'reduction'>('none');
    const [taxAmount, setTaxAmount] = useState(0);
    
    // State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [passportWarning, setPassportWarning] = useState<string | null>(null);

    // Fetch rooms when offer changes
    useEffect(() => {
        if (!selectedOfferId) {
            setOfferHotels([]);
            return;
        }
        
        const fetchOfferRooms = async () => {
            try {
                const response = await fetch(`/api/rooms?offerId=${selectedOfferId}`, { credentials: 'include' });
                if (response.ok) {
                    const data = await response.json();
                    setOfferHotels(data);
                }
            } catch (err) {
                console.error("Failed to fetch rooms for offer", err);
            }
        };
        fetchOfferRooms();
    }, [selectedOfferId]);
    
    // Validate Passport for Lead (Client) and Passengers
    useEffect(() => {
        let warning = null;
        const checkExpiry = (expiryStr: string | undefined, name: string) => {
            if (!expiryStr) return;
            const expiry = new Date(expiryStr);
            const today = new Date();
            const sixMonths = new Date();
            sixMonths.setMonth(today.getMonth() + 6);
            if (expiry < sixMonths) {
                warning = `Le passeport de ${name} expire dans moins de 6 mois ! Soumission bloquée.`;
            }
        };

        checkExpiry(formData.passportExpiry, formData.fullName || 'Lead');
        passengers.forEach(p => checkExpiry(p.passportExpiry, `${p.firstName} ${p.lastName}`));

        setPassportWarning(warning);
    }, [formData.passportExpiry, formData.fullName, passengers]);
    

    const calculateAgeCategory = (dob: string | undefined): 'ADT' | 'CHD' | 'INF' => {
        if (!dob) return 'ADT'; // default
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        if (age < 2) return 'INF';
        if (age >= 2 && age < 12) return 'CHD';
        return 'ADT';
    };

    const getRoomPrice = (roomId: string, category: 'ADT' | 'CHD' | 'INF'): number => {
        const room = offerHotels.find(r => r.id === roomId);
        if (!room) return 0;
        
        if (room.pricing) {
            if (category === 'INF') return room.pricing.infant || 0;
            if (category === 'CHD') return room.pricing.child || 0;
            return room.pricing.adult || 0;
        }
        // Fallback
        return room.price || 0;
    };


    const handleAddPassenger = () => {
        setPassengers(prev => [
            ...prev,
            {
                id: Math.random().toString(36).substr(2, 9),
                firstName: '',
                lastName: '',
                gender: 'Homme',
                birthDate: '',
                ageCategory: 'ADT',
                assignedRoomId: '',
                suggestedPrice: 0,
                finalPrice: 0,
                priceOverridden: false
            }
        ]);
    };

    const updatePassenger = (id: string, field: keyof Passenger, value: any) => {
        setPassengers(prev => prev.map(p => {
            if (p.id !== id) return p;
            
            const updated = { ...p, [field]: value };
            
            // Recalculate category and price if dob or room changes
            if (field === 'birthDate' || field === 'assignedRoomId') {
                const cat = calculateAgeCategory(updated.birthDate);
                updated.ageCategory = cat;
                if (!updated.priceOverridden && updated.assignedRoomId) {
                    updated.suggestedPrice = getRoomPrice(updated.assignedRoomId, cat);
                    updated.finalPrice = updated.suggestedPrice;
                }
            }
            
            if (field === 'finalPrice') {
                updated.priceOverridden = true;
            }
            
            return updated;
        }));
    };
    
    // Auto calculate lead price if offer logic applies
    const [leadRoomId, setLeadRoomId] = useState('');
    const [leadPrice, setLeadPrice] = useState(0);
    const [leadPriceOverridden, setLeadPriceOverridden] = useState(false);
    
    useEffect(() => {
        if (!leadPriceOverridden && leadRoomId) {
            const cat = calculateAgeCategory(leadBirthDate);
            setLeadPrice(getRoomPrice(leadRoomId, cat));
        }
    }, [leadRoomId, leadBirthDate, offerHotels, leadPriceOverridden]);

    const calculateGrandTotal = () => {
        let total = leadPrice;
        passengers.forEach(p => {
            total += (p.finalPrice || 0);
        });
        
        if (taxType === 'tax') total += taxAmount;
        if (taxType === 'reduction') total -= taxAmount;
        
        return Math.max(0, total);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (passportWarning) {
            setError(passportWarning);
            return;
        }
        
        setIsLoading(true);
        setError(null);

        try {
            // 1. Create or Update Client
            const clientData: Client = {
                id: initialData?.id || Math.random().toString(36).substr(2, 9),
                fullName: formData.fullName!,
                mobileNumber: formData.mobileNumber!,
                type: formData.type as 'Individual' | 'Entreprise',
                passportNumber: formData.passportNumber || undefined,
                passportExpiry: formData.passportExpiry || undefined
            };

            let savedClient: Client;
            if (initialData) {
                await updateClient(clientData);
                savedClient = clientData;
            } else {
                savedClient = await addClient(clientData) || clientData;
            }
            
            // If it's a new reservation we create the associated Order.
            if (!initialData && selectedOfferId) {
                const allPassengers: Passenger[] = [
                    {
                        id: Math.random().toString(36).substr(2, 9),
                        firstName: formData.fullName?.split(' ')[0] || '',
                        lastName: formData.fullName?.split(' ').slice(1).join(' ') || '',
                        birthDate: leadBirthDate,
                        passportNumber: formData.passportNumber,
                        passportExpiry: formData.passportExpiry,
                        assignedRoomId: leadRoomId,
                        finalPrice: leadPrice,
                        ageCategory: calculateAgeCategory(leadBirthDate)
                    },
                    ...passengers
                ];
                
                const grandTotal = calculateGrandTotal();
                
                const newOrder: Order = {
                    id: Math.random().toString(36).substr(2, 9),
                    clientId: savedClient.id,
                    agencyId: user?.role === 'agent' ? user?.agencyId : undefined,
                    passengers: allPassengers,
                    hotels: [],
                    orderCurrency: 'DZD',
                    items: [{
                        id: 'res-item-1',
                        description: `Réservation pour ${allPassengers.length} passager(s)`,
                        quantity: 1,
                        unitPrice: grandTotal,
                        amount: grandTotal
                    }],
                    totalAmount: grandTotal,
                    totalAmountDZD: grandTotal,
                    remainingBalanceDZD: grandTotal,
                    payments: [],
                    status: 'Non payé',
                    createdAt: new Date().toISOString(),
                    createdBy: user?.username || 'Unknown',
                    notes: (taxType !== 'none' ? `Ajustement: ${taxType === 'tax' ? '+' : '-'}${taxAmount} DZD. ` : '')
                };
                
                await addOrder(newOrder);
            }
            
            onClose();
        } catch (err: any) {
            console.error('Failed to process reservation:', err);
            const errorMessage = err.response?.data?.error
                ? `${err.response.data.error}: ${JSON.stringify(err.response.data.details)}`
                : err.message || 'Impossible de sauvegarder la réservation.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Warning logic */}
            {passportWarning && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertTriangle size={20} />
                    <p className="text-sm font-medium">{passportWarning}</p>
                </div>
            )}
        
            {/* --- CLIENT (LEAD) SECTION --- */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Users size={18} className="text-primary"/> 
                    {initialData ? 'Modifier Client' : 'Titulaire de la réservation (Lead)'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type de Client</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="type"
                                    value="Individual"
                                    checked={formData.type === 'Individual'}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                    className="text-primary focus:ring-primary"
                                />
                                <span className="text-sm text-gray-700">Individuel</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="type"
                                    value="Entreprise"
                                    checked={formData.type === 'Entreprise'}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                    className="text-primary focus:ring-primary"
                                />
                                <span className="text-sm text-gray-700">Entreprise</span>
                            </label>
                        </div>
                    </div>

                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom Complet *</label>
                        <input
                            type="text"
                            required
                            value={formData.fullName}
                            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            placeholder="Ex: Mohamed Amine"
                        />
                    </div>
                    
                    {!initialData && (
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                            <input
                                type="date"
                                required
                                value={leadBirthDate}
                                onChange={e => setLeadBirthDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            />
                        </div>
                    )}

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de Mobile *</label>
                        <input
                            type="tel"
                            required
                            value={formData.mobileNumber}
                            onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            placeholder="Ex: 0550 12 34 56"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">N° Passeport</label>
                        <input
                            type="text"
                            value={formData.passportNumber}
                            onChange={e => setFormData({ ...formData, passportNumber: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Passeport</label>
                        <input
                            type="date"
                            value={formData.passportExpiry}
                            onChange={e => setFormData({ ...formData, passportExpiry: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${
                                passportWarning ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                        />
                    </div>
                </div>
            </div>

            {/* --- NEW RESERVATION ONLY: OFFERS AND MULTI PASSENGERS --- */}
            {!initialData && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Offre Touristique</label>
                            <select
                                required
                                value={selectedOfferId}
                                onChange={(e) => setSelectedOfferId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            >
                                <option value="">Sélectionner une offre</option>
                                {offers.map(offer => (
                                    <option key={offer.id} value={offer.id}>
                                        {offer.title} - {offer.destination}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        {offerHotels.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chambre (Lead)</label>
                                <select
                                    required
                                    value={leadRoomId}
                                    onChange={(e) => setLeadRoomId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                >
                                    <option value="">Sélectionner chambre</option>
                                    {offerHotels.map(r => (
                                        <option key={r.id} value={r.id}>
                                            {r.hotelName} ({r.roomNumber}) - {r.capacity} pax
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        
                        {offerHotels.length > 0 && leadRoomId && (
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Prix Lead ({calculateAgeCategory(leadBirthDate)})</label>
                                <div className="flex relative">
                                    <input
                                        type="number"
                                        value={leadPrice}
                                        onChange={(e) => {
                                            setLeadPrice(Number(e.target.value));
                                            setLeadPriceOverridden(true);
                                        }}
                                        className="w-full pl-8 pr-3 py-2 border border-blue-300 bg-blue-50 rounded-lg outline-none font-medium"
                                    />
                                    <span className="absolute left-3 top-2.5 text-blue-500 font-bold">DZ</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* PASSENGERS */}
                    {selectedOfferId && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mt-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-md font-semibold text-gray-800 flex items-center gap-2">
                                    <Users size={18} className="text-gray-600"/> 
                                    Autres Passagers ({passengers.length})
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleAddPassenger}
                                    className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm flex items-center gap-1"
                                >
                                    <Plus size={16} /> Ajouter
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                {passengers.map((p, index) => (
                                    <div key={p.id} className="p-4 bg-white border border-gray-100 rounded-lg relative shadow-sm">
                                        <button
                                            type="button"
                                            onClick={() => setPassengers(prev => prev.filter(pas => pas.id !== p.id))}
                                            className="absolute top-3 right-3 text-red-400 hover:text-red-600"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mr-6">
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="Prénom"
                                                    value={p.firstName}
                                                    onChange={e => updatePassenger(p.id, 'firstName', e.target.value)}
                                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary outline-none"
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="Nom"
                                                    value={p.lastName}
                                                    onChange={e => updatePassenger(p.id, 'lastName', e.target.value)}
                                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary outline-none"
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="date"
                                                    title="Date de naissance"
                                                    value={p.birthDate}
                                                    onChange={e => updatePassenger(p.id, 'birthDate', e.target.value)}
                                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary outline-none"
                                                />
                                            </div>
                                            <div>
                                                <select
                                                    value={p.assignedRoomId || ''}
                                                    onChange={e => updatePassenger(p.id, 'assignedRoomId', e.target.value)}
                                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary outline-none"
                                                >
                                                    <option value="">Chambre...</option>
                                                    {offerHotels.map(r => (
                                                        <option key={r.id} value={r.id}>{r.roomNumber}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <input
                                                    type="text"
                                                    placeholder="N° Passeport"
                                                    value={p.passportNumber || ''}
                                                    onChange={e => updatePassenger(p.id, 'passportNumber', e.target.value)}
                                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary outline-none"
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="date"
                                                    title="Expiration Passeport"
                                                    value={p.passportExpiry || ''}
                                                    onChange={e => updatePassenger(p.id, 'passportExpiry', e.target.value)}
                                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary outline-none"
                                                />
                                            </div>
                                            {p.assignedRoomId && (
                                                <div className="col-span-2">
                                                    <div className="flex relative items-center gap-2">
                                                        <span className="text-xs bg-gray-200 px-2 pl-3 py-1 rounded font-bold shrink-0">{p.ageCategory}</span>
                                                        <input
                                                            type="number"
                                                            title="Prix Modifiable"
                                                            value={p.finalPrice || ''}
                                                            onChange={e => updatePassenger(p.id, 'finalPrice', Number(e.target.value))}
                                                            className="w-full px-3 py-1.5 text-sm border border-blue-300 bg-blue-50 rounded focus:ring-1 focus:ring-primary outline-none font-semibold text-right"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* TAXES AND TOTAL */}
                    {selectedOfferId && (
                        <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-5 flex flex-col items-end mt-6">
                            <div className="w-full max-w-sm space-y-3">
                                <div className="flex justify-between items-center text-gray-600">
                                    <span>Sous-total Prix:</span>
                                    <span className="font-semibold">{passengers.reduce((sum, p) => sum + (p.finalPrice || 0), leadPrice).toLocaleString()} DZD</span>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <select
                                        value={taxType}
                                        onChange={(e) => {
                                            setTaxType(e.target.value as any);
                                            if (e.target.value === 'none') setTaxAmount(0);
                                        }}
                                        className="w-2/3 px-3 py-1.5 border border-gray-300 rounded text-sm outline-none"
                                    >
                                        <option value="none">Ajustement (Aucun)</option>
                                        <option value="tax">Taxe Positive (+)</option>
                                        <option value="reduction">Taxe Négative/Remise (-)</option>
                                    </select>
                                    
                                    {taxType !== 'none' && (
                                        <input 
                                            type="number" 
                                            value={taxAmount}
                                            onChange={e => setTaxAmount(Number(e.target.value))}
                                            className="w-1/3 px-3 py-1.5 border border-gray-300 rounded text-sm outline-none text-right" 
                                            placeholder="Montant"
                                        />
                                    )}
                                </div>
                                
                                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                                    <span className="text-lg font-bold text-gray-800">Total Réservation:</span>
                                    <span className="text-2xl font-black text-primary">{calculateGrandTotal().toLocaleString()} DZD</span>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mt-4">
                    <p className="text-sm">{error}</p>
                </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    disabled={isLoading || !!passportWarning}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Traitement...
                        </>
                    ) : (
                        initialData ? 'Mettre à jour' : 'Confirmer la réservation'
                    )}
                </button>
            </div>
        </form>
    );
};

export default ClientForm;
