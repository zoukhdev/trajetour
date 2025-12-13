import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { ordersAPI } from '../../services/api';
import { Plus, Trash2, User as UserIcon, AlertCircle, Building2, DollarSign } from 'lucide-react';
import type { Passenger, Hotel } from '../../types';

// Helper to calculate age category
const calculateAgeCategory = (birthDateString?: string): 'ADT' | 'CHD' | 'INF' => {
    if (!birthDateString) return 'ADT';
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    if (age < 2) return 'INF';
    if (age < 12) return 'CHD';
    return 'ADT';
};

const isPassportExpiringSoon = (expiryDateString?: string): boolean => {
    if (!expiryDateString) return false;
    const expiryDate = new Date(expiryDateString);
    const today = new Date();
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(today.getMonth() + 6);
    return expiryDate < sixMonthsFromNow;
};

// Helper to validate room gender against passenger gender
const validateRoomGender = (room: any, passengerGender: string): { isValid: boolean; message?: string } => {
    if (!room || room.gender === 'MIXED') return { isValid: true };

    const genderMap: Record<string, string> = { 'Homme': 'MEN', 'Femme': 'WOMEN' };
    const expectedRoomGender = genderMap[passengerGender];

    if (room.gender !== expectedRoomGender) {
        const genderLabel = room.gender === 'MEN' ? 'Hommes' : 'Femmes';
        return {
            isValid: false,
            message: `⚠️ Cette chambre est réservée aux ${genderLabel} uniquement`
        };
    }

    return { isValid: true };
};

const OrderFormV2 = () => {
    const navigate = useNavigate();

    // Form State
    const [clientId, setClientId] = useState(''); // Need to select client (mock or fetch)
    const [agencyId, setAgencyId] = useState('');
    const [notes, setNotes] = useState('');

    // Hotels
    const [hotels, setHotels] = useState<Hotel[]>([]);

    const [selectedHotelName, setSelectedHotelName] = useState('');
    const [uniqueSystemHotels, setUniqueSystemHotels] = useState<string[]>([]);

    // Room Allocation
    const [availableRooms, setAvailableRooms] = useState<any[]>([]);

    // Offers (Optional)
    const [offers, setOffers] = useState<any[]>([]);
    const [selectedOfferId, setSelectedOfferId] = useState('');


    // Passengers
    const [passengers, setPassengers] = useState<Passenger[]>([
        { id: '1', firstName: '', lastName: '', passportNumber: '', phoneNumber: '', gender: 'Homme' }
    ]);

    // Financials
    // const [totalAmount, setTotalAmount] = useState<number>(0);
    // Commission system (manual Tax or Reduction)
    const [commissionType, setCommissionType] = useState<'none' | 'tax' | 'reduction'>('none');
    const [commissionAmount, setCommissionAmount] = useState<number>(0);

    const [loading, setLoading] = useState(false);

    // Calculated Totals
    const passengerTotal = useMemo(() => {
        return passengers.reduce((sum, p) => sum + Number(p.finalPrice || 0), 0);
    }, [passengers]);

    const commissionValue = useMemo(() => {
        if (commissionType === 'tax') return commissionAmount;
        if (commissionType === 'reduction') return -commissionAmount;
        return 0;
    }, [commissionType, commissionAmount]);

    const finalTotal = passengerTotal + commissionValue;

    // Mock Client Fetch (Replace with real selector)
    const [clients, setClients] = useState<any[]>([]);
    useEffect(() => {
        // Fetch clients for dropdown
        api.get('/clients').then(res => setClients(res.data.data)).catch(console.error);
        // Fetch active offers (Capitalized 'Active')
        api.get('/offers?status=Active').then(res => setOffers(res.data)).catch(console.error);
        // Fetch all active rooms on mount
        api.get('/rooms').then(res => {
            setAvailableRooms(res.data);
            const unique = [...new Set(res.data.map((r: any) => r.hotel_name))].filter(Boolean).sort() as string[];
            setUniqueSystemHotels(unique);
        }).catch(console.error);
    }, []);

    // Fetch rooms when hotel selection changes
    useEffect(() => {
        if (!selectedHotelName) {
            // Fetch all rooms if no hotel selected
            api.get('/rooms')
                .then(res => setAvailableRooms(res.data))
                .catch(console.error);
            return;
        }
        // Fetch rooms filtered by hotel name
        api.get(`/rooms?hotelName=${encodeURIComponent(selectedHotelName)}`)
            .then(res => setAvailableRooms(res.data))
            .catch(console.error);
    }, [selectedHotelName]);

    // Removed auto-calculate effect in favor of useMemo
    // useEffect(() => { ... }, [passengers]);

    // State for price editing
    const [editingPriceFor, setEditingPriceFor] = useState<string | null>(null);

    // Handlers


    const removeHotel = (index: number) => {
        setHotels(hotels.filter((_, i) => i !== index));
    };

    const updatePassenger = (index: number, field: keyof Passenger, value: any) => {
        const newPassengers = [...passengers];
        newPassengers[index] = { ...newPassengers[index], [field]: value };

        // Auto-pricing Trigger: When room is assigned OR birthDate changes (if room assigned)
        if (field === 'assignedRoomId' || (field === 'birthDate' && newPassengers[index].assignedRoomId)) {
            const passenger = newPassengers[index];
            const roomId = passenger.assignedRoomId;
            const room = availableRooms.find(r => r.id === roomId);

            if (room) {
                const ageCategory = calculateAgeCategory(passenger.birthDate);
                let suggestedPrice = Number(room.price || 0);

                // Use age-based pricing if available
                if (room.pricing) {
                    const categoryMap: Record<string, keyof typeof room.pricing> = {
                        'ADT': 'adult',
                        'CHD': 'child',
                        'INF': 'infant'
                    };
                    const priceKey = categoryMap[ageCategory];
                    suggestedPrice = Number(room.pricing[priceKey] || room.price || 0);
                } else {
                    suggestedPrice = Number(room.price || 0);
                }

                // Set pricing fields
                // Set pricing fields
                newPassengers[index].ageCategory = ageCategory;
                newPassengers[index].suggestedPrice = suggestedPrice;
                newPassengers[index].finalPrice = suggestedPrice;
                newPassengers[index].priceOverridden = false;
            }
        }

        setPassengers(newPassengers);
    };

    const addPassenger = () => {
        setPassengers([...passengers, {
            id: Math.random().toString(36).substr(2, 9),
            firstName: '', lastName: '',
            passportNumber: '', phoneNumber: '', gender: 'Homme'
        }]);
    };

    const removePassenger = (index: number) => {
        if (passengers.length > 1) {
            setPassengers(passengers.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!clientId) return alert('Veuillez sélectionner un client');
        if (passengers.some(p => !p.firstName || !p.lastName || !p.passportNumber || !p.phoneNumber)) {
            return alert('Tous les passagers doivent avoir un nom, prénom, numéro de passeport et téléphone.');
        }

        setLoading(true);
        try {
            // Construct logic items for Tax/Reduction
            const items = [];
            if (commissionType === 'tax' && commissionAmount > 0) {
                items.push({
                    id: 'tax',
                    description: 'Taxe / Supplément',
                    quantity: 1,
                    unitPrice: commissionAmount,
                    amount: commissionAmount,
                    amountDZD: commissionAmount
                });
            } else if (commissionType === 'reduction' && commissionAmount > 0) {
                items.push({
                    id: 'reduction',
                    description: 'Réduction / Rabais',
                    quantity: 1,
                    unitPrice: -commissionAmount,
                    amount: -commissionAmount,
                    amountDZD: -commissionAmount
                });
            }

            const orderData = {
                clientId,
                agencyId: agencyId || null,
                items: items, // Include Tax/Reduction as items
                passengers,
                hotels,
                totalAmount: finalTotal, // Use final calculated total
                notes
            };

            await ordersAPI.create(orderData);
            navigate('/orders');
        } catch (err) {
            console.error(err);
            alert('Erreur lors de la création de la commande');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <h1 className="text-2xl font-bold text-gray-800">Nouvelle Commande (V2 Updated)</h1>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Client & Agency Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <UserIcon size={20} /> Informations Générales
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                            <select
                                value={clientId}
                                onChange={e => setClientId(e.target.value)}
                                className="w-full p-2 border rounded-lg"
                                required
                            >
                                <option value="">Sélectionner un client</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.fullName}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Agence (Optionnel)</label>
                            <input
                                type="text"
                                placeholder="ID Agence (Mock)"
                                value={agencyId}
                                onChange={e => setAgencyId(e.target.value)}
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full p-2 border rounded-lg"
                                rows={2}
                                placeholder="Observations..."
                            />
                        </div>
                    </div>
                </div>



                {/* Hotels Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Building2 size={20} /> Hôtels
                    </h2>

                    <div className="flex flex-wrap gap-2">
                        {hotels.map((hotel, index) => (
                            <div key={index} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm">
                                <span>{hotel.name}</span>
                                <button type="button" onClick={() => removeHotel(index)} className="text-red-500 hover:text-red-700">
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filtrer chambres par hôtel</label>
                        <select
                            value={selectedHotelName}
                            onChange={(e) => {
                                const selected = e.target.value;
                                if (selected) {
                                    if (!hotels.some(h => h.name === selected)) {
                                        setHotels(prev => [...prev, { name: selected }]);
                                    }
                                    setSelectedHotelName(selected);
                                } else {
                                    setSelectedHotelName('');
                                }
                            }}
                            className="w-full p-2 border rounded-lg"
                        >
                            <option value="">Tous les hôtels</option>
                            {uniqueSystemHotels.map((hotel) => (
                                <option key={hotel} value={hotel}>{hotel}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Sélectionnez un hôtel pour filtrer les chambres disponibles.</p>
                    </div>
                </div>

                {/* Passengers Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <UserIcon size={20} /> Passagers ({passengers.length})
                        </h2>
                        <button
                            type="button"
                            onClick={addPassenger}
                            className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
                        >
                            <Plus size={18} /> Ajouter Passager
                        </button>
                    </div>

                    <div className="space-y-4">
                        {passengers.map((p, index) => (
                            <div key={index} className="p-4 border border-gray-200 rounded-lg relative">
                                <div className="absolute top-2 right-2 flex gap-2">
                                    {/* Badge Age Category */}
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">
                                        {calculateAgeCategory(p.birthDate)}
                                    </span>
                                    {passengers.length > 1 && (
                                        <button type="button" onClick={() => removePassenger(index)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                                    <div>
                                        <label className="text-xs text-gray-500 block">Prénom *</label>
                                        <input type="text" value={p.firstName} onChange={e => updatePassenger(index, 'firstName', e.target.value)} className="w-full p-2 border rounded text-sm" required />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block">Nom *</label>
                                        <input type="text" value={p.lastName} onChange={e => updatePassenger(index, 'lastName', e.target.value)} className="w-full p-2 border rounded text-sm" required />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block">Sexe</label>
                                        <select value={p.gender || 'Homme'} onChange={e => updatePassenger(index, 'gender', e.target.value)} className="w-full p-2 border rounded text-sm">
                                            <option value="Homme">Homme</option>
                                            <option value="Femme">Femme</option>
                                        </select>
                                    </div>

                                    <div className="col-span-1 md:col-span-2">
                                        <label className="text-xs text-gray-500 block font-bold text-blue-600">Assigner Chambre (Optionnel)</label>
                                        <select
                                            value={p.assignedRoomId || ''}
                                            onChange={e => updatePassenger(index, 'assignedRoomId', e.target.value)}
                                            className="w-full p-2 border rounded text-sm border-blue-200 bg-blue-50"
                                        >
                                            <option value="">-- Non assigné --</option>
                                            {availableRooms.map(room => {
                                                const occupied = parseInt(room.occupied_count || '0');
                                                const isFull = occupied >= room.capacity;
                                                // Allow selecting if not full OR if it's the already selected room (to keep selection)
                                                if (isFull && p.assignedRoomId !== room.id) return null;

                                                return (
                                                    <option key={room.id} value={room.id}>
                                                        {room.hotel_name} - {room.room_number} ({room.gender}) - {occupied}/{room.capacity}
                                                    </option>
                                                );
                                            })}
                                        </select>

                                        {/* Gender Validation Error */}
                                        {p.assignedRoomId && (() => {
                                            const selectedRoom = availableRooms.find(r => r.id === p.assignedRoomId);
                                            const validation = validateRoomGender(selectedRoom, p.gender || 'Homme');
                                            if (!validation.isValid) {
                                                return (
                                                    <div className="mt-1 text-red-600 text-xs font-medium flex items-center gap-1">
                                                        <AlertCircle className="w-4 h-4" />
                                                        {validation.message}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>

                                    {/* Price Display & Override */}
                                    {p.assignedRoomId && p.finalPrice !== undefined && (
                                        <div className="col-span-1 md:col-span-2 bg-green-50 border border-green-200 p-3 rounded-lg">
                                            <label className="text-xs font-medium text-green-800 block mb-2">
                                                Prix de la Chambre {p.priceOverridden && <span className="text-orange-600 text-xs">⚠️ Modifié</span>}
                                            </label>
                                            {editingPriceFor === p.id ? (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        value={p.finalPrice}
                                                        onChange={e => {
                                                            const newPrice = Number(e.target.value);
                                                            const updated = [...passengers];
                                                            updated[index].finalPrice = newPrice;
                                                            updated[index].priceOverridden = true;
                                                            setPassengers(updated);
                                                        }}
                                                        className="flex-1 px-2 py-1 border border-green-400 rounded text-sm"
                                                        step="100"
                                                        min="0"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingPriceFor(null)}
                                                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                                    >
                                                        ✓
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-lg font-bold text-green-900">
                                                        {(p.finalPrice || 0).toLocaleString()} DZD
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingPriceFor(p.id)}
                                                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                                                    >
                                                        ✏️ Modifier
                                                    </button>
                                                </div>
                                            )}
                                            <p className="text-xs text-gray-600 mt-1">
                                                Catégorie: <strong>{p.ageCategory || 'ADT'}</strong> • Suggéré: {p.suggestedPrice || 0} DZD
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-xs text-gray-500 block">Passeport *</label>
                                        <input type="text" value={p.passportNumber} onChange={e => updatePassenger(index, 'passportNumber', e.target.value)} className="w-full p-2 border rounded text-sm" required />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block">Expiration Passeport</label>
                                        <input type="date" value={p.passportExpiry} onChange={e => updatePassenger(index, 'passportExpiry', e.target.value)} className={`w-full p-2 border rounded text-sm ${isPassportExpiringSoon(p.passportExpiry) ? 'border-red-500 text-red-600' : ''}`} />
                                        {isPassportExpiringSoon(p.passportExpiry) && <span className="text-red-500 text-xs flex items-center gap-1"><AlertCircle size={10} /> Expire bientôt (&lt; 6 mois)</span>}
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block">Date de Naissance</label>
                                        <input type="date" value={p.birthDate} onChange={e => updatePassenger(index, 'birthDate', e.target.value)} className="w-full p-2 border rounded text-sm" />
                                    </div>

                                    <div className="col-span-1 md:col-span-3">
                                        <label className="text-xs text-gray-500 block">Téléphone *</label>
                                        <input type="tel" value={p.phoneNumber} onChange={e => updatePassenger(index, 'phoneNumber', e.target.value)} className="w-full p-2 border rounded text-sm" required placeholder="05..." />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Offer Selection (Optional) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Building2 size={20} /> Offre (Optionnel)
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Offre (Voyage)</label>
                            <select
                                value={selectedOfferId}
                                onChange={e => setSelectedOfferId(e.target.value)}
                                className="w-full p-2 border rounded-lg"
                            >
                                <option value="">Aucune offre sélectionnée</option>
                                {offers.map(o => (
                                    <option key={o.id} value={o.id}>{o.title}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Optionnel : Associer cette commande à une offre spécifique.</p>
                        </div>
                    </div>
                </div>


                {/* Validated Commission / Tax / Reduction Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <DollarSign size={20} /> Commission / Taxe / Réduction
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Commission Type Selector */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type
                            </label>
                            <select
                                value={commissionType}
                                onChange={(e) => {
                                    setCommissionType(e.target.value as 'none' | 'tax' | 'reduction');
                                    if (e.target.value === 'none') {
                                        setCommissionAmount(0);
                                    }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            >
                                <option value="none">Aucun</option>
                                <option value="tax">Taxe (Supplément)</option>
                                <option value="reduction">Réduction (Rabais)</option>
                            </select>
                        </div>

                        {/* Tax Field - Only shown when 'tax' is selected */}
                        {commissionType === 'tax' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Montant de la taxe (DZD)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={commissionAmount}
                                    onChange={(e) => setCommissionAmount(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-green-300 bg-green-50 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                    placeholder="0.00"
                                />
                                <p className="text-xs text-green-600 mt-1">
                                    + {commissionAmount.toLocaleString()} DZD au total
                                </p>
                            </div>
                        )}

                        {/* Reduction Field - Only shown when 'reduction' is selected */}
                        {commissionType === 'reduction' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Montant de la réduction (DZD)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={commissionAmount}
                                    onChange={(e) => setCommissionAmount(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-red-300 bg-red-50 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                                    placeholder="0.00"
                                />
                                <p className="text-xs text-red-600 mt-1">
                                    - {commissionAmount.toLocaleString()} DZD du total
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Totals */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl shadow-sm border-2 border-green-300">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total de la Commande (Auto-calculé)</p>
                            <p className="text-xs text-gray-500">Somme des prix des chambres assignées</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-green-700">
                                {finalTotal.toLocaleString()} DZD
                            </div>
                            {commissionValue !== 0 && (
                                <p className={`text-sm ${commissionValue > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    Inclus: {commissionValue > 0 ? '+' : ''}{commissionValue.toLocaleString()} ({commissionType === 'tax' ? 'Taxe' : 'Réduction'})
                                </p>
                            )}
                            <p className="text-xs text-gray-600 mt-1">
                                {passengers.filter(p => p.finalPrice !== undefined).length} passager(s) avec chambres
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button type="button" onClick={() => navigate('/orders')} className="px-6 py-2 border rounded-lg hover:bg-gray-50">Annuler</button>
                    <button type="submit" disabled={loading} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium">
                        {loading ? 'Création...' : 'Créer Commande'}
                    </button>
                </div>
            </form >
        </div >
    );
};

export default OrderFormV2;
