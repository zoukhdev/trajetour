import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Trash2, User as UserIcon, AlertCircle, Building2 } from 'lucide-react';
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

const OrderFormV2 = () => {
    const navigate = useNavigate();

    // Form State
    const [clientId, setClientId] = useState(''); // Need to select client (mock or fetch)
    const [agencyId, setAgencyId] = useState('');
    const [notes, setNotes] = useState('');

    // Hotels
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [newHotelName, setNewHotelName] = useState('');

    // Room Allocation
    const [offers, setOffers] = useState<any[]>([]);
    const [selectedOfferId, setSelectedOfferId] = useState('');
    const [availableRooms, setAvailableRooms] = useState<any[]>([]);


    // Passengers
    const [passengers, setPassengers] = useState<Passenger[]>([
        { id: '1', firstName: '', lastName: '', passportNumber: '', phoneNumber: '', roomType: 'Double' }
    ]);

    // Financials
    const [totalAmount, setTotalAmount] = useState<number>(0);
    const [loading, setLoading] = useState(false);

    // Mock Client Fetch (Replace with real selector)
    const [clients, setClients] = useState<any[]>([]);
    useEffect(() => {
        // Fetch clients for dropdown
        axios.get('/api/clients').then(res => setClients(res.data.data)).catch(console.error);
        // Fetch active offers
        axios.get('/api/offers?status=active').then(res => setOffers(res.data)).catch(console.error);
    }, []);

    // Fetch rooms when offer changes
    useEffect(() => {
        if (!selectedOfferId) {
            setAvailableRooms([]);
            return;
        }
        axios.get(`/api/rooms?offerId=${selectedOfferId}`)
            .then(res => setAvailableRooms(res.data))
            .catch(console.error);
    }, [selectedOfferId]);


    // Handlers
    const addHotel = () => {
        if (newHotelName.trim()) {
            setHotels([...hotels, { name: newHotelName.trim() }]);
            setNewHotelName('');
        }
    };

    const removeHotel = (index: number) => {
        setHotels(hotels.filter((_, i) => i !== index));
    };

    const updatePassenger = (index: number, field: keyof Passenger, value: any) => {
        const newPassengers = [...passengers];
        newPassengers[index] = { ...newPassengers[index], [field]: value };
        setPassengers(newPassengers);
    };

    const addPassenger = () => {
        setPassengers([...passengers, {
            id: Math.random().toString(36).substr(2, 9),
            firstName: '', lastName: '',
            passportNumber: '', phoneNumber: '', roomType: 'Double'
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
            const orderData = {
                clientId,
                agencyId: agencyId || null,
                items: [], // Legacy items field, can default to empty or structured
                passengers,
                hotels, // Sending raw hotels array
                totalAmount, // Assuming entered or calculated
                notes
            };

            await axios.post('/api/orders', orderData);
            navigate('/orders-v2');
        } catch (err) {
            console.error(err);
            alert('Erreur lors de la création de la commande');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <h1 className="text-2xl font-bold text-gray-800">Nouvelle Commande (V2)</h1>

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

                {/* Offer Selection (Context for Rooms) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Building2 size={20} /> Allocation & Offre
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Offre (Voyage) *</label>
                            <select
                                value={selectedOfferId}
                                onChange={e => setSelectedOfferId(e.target.value)}
                                className="w-full p-2 border rounded-lg"
                                required
                            >
                                <option value="">Choisir une offre...</option>
                                {offers.map(o => (
                                    <option key={o.id} value={o.id}>{o.title}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Sélectionnez une offre pour voir les chambres disponibles.</p>
                        </div>
                    </div>
                </div>

                {/* Hotels Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Building2 size={20} /> Hôtels
                    </h2>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Nom de l'hôtel"
                            value={newHotelName}
                            onChange={e => setNewHotelName(e.target.value)}
                            className="flex-1 p-2 border rounded-lg"
                        />
                        <button
                            type="button"
                            onClick={addHotel}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Ajouter
                        </button>
                    </div>
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
                                        <label className="text-xs text-gray-500 block">Chambre (Type)</label>
                                        <select value={p.roomType} onChange={e => updatePassenger(index, 'roomType', e.target.value)} className="w-full p-2 border rounded text-sm">
                                            <option value="Single">Single</option>
                                            <option value="Double">Double</option>
                                            <option value="Triple">Triple</option>
                                            <option value="Quad">Quad</option>
                                        </select>
                                    </div>

                                    {selectedOfferId && (
                                        <div className="col-span-1 md:col-span-2">
                                            <label className="text-xs text-gray-500 block font-bold text-blue-600">Assigner Chambre (Optionnel)</label>
                                            <select
                                                value={(p as any).assignedRoomId || ''}
                                                onChange={e => updatePassenger(index, 'assignedRoomId', e.target.value)}
                                                className="w-full p-2 border rounded text-sm border-blue-200 bg-blue-50"
                                            >
                                                <option value="">-- Non assigné --</option>
                                                {availableRooms.map(room => {
                                                    const occupied = parseInt(room.occupied_count || '0');
                                                    const isFull = occupied >= room.capacity;
                                                    // Allow selecting if not full OR if it's the already selected room (to keep selection)
                                                    if (isFull && (p as any).assignedRoomId !== room.id) return null;

                                                    return (
                                                        <option key={room.id} value={room.id}>
                                                            {room.hotel_name} - {room.room_number} ({room.gender}) - {occupied}/{room.capacity}
                                                        </option>
                                                    );
                                                })}
                                            </select>
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

                {/* Totals */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-end items-center gap-4">
                    <span className="text-lg font-bold">Total DZD:</span>
                    <input
                        type="number"
                        value={totalAmount}
                        onChange={e => setTotalAmount(Number(e.target.value))}
                        className="w-48 p-2 border rounded-lg text-right font-bold text-xl"
                        placeholder="0.00"
                    />
                </div>

                <div className="flex justify-end gap-4">
                    <button type="button" onClick={() => navigate('/orders-v2')} className="px-6 py-2 border rounded-lg hover:bg-gray-50">Annuler</button>
                    <button type="submit" disabled={loading} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium">
                        {loading ? 'Création...' : 'Créer Commande'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default OrderFormV2;
