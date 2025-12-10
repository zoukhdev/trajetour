import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; // Use configured API instance
import { Plus, Trash2, User as UserIcon, AlertCircle, Building2 } from 'lucide-react';
import type { Passenger } from '../../types';

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
        api.get('/clients').then(res => setClients(res.data.data || res.data)).catch(console.error); // Handle paginated or direct array
        // Fetch active offers
        api.get('/offers').then(res => setOffers(res.data)).catch(console.error);
    }, []);

    // Fetch rooms when offer changes
    useEffect(() => {
        if (!selectedOfferId) {
            setAvailableRooms([]);
            return;
        }
        api.get(`/rooms?offerId=${selectedOfferId}`)
            .then(res => setAvailableRooms(res.data))
            .catch(console.error);
    }, [selectedOfferId]);

    // Auto-calculate Total Amount based on Room Prices
    useEffect(() => {
        const calculatedTotal = passengers.reduce((sum, p) => {
            const room = availableRooms.find(r => r.id === (p as any).assignedRoomId);
            return sum + (room ? Number(room.price || 0) : 0);
        }, 0);
        setTotalAmount(calculatedTotal);
    }, [passengers, availableRooms]);


    // Handlers
    const updatePassenger = (index: number, field: string, value: any) => {
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
                totalAmount, // Assuming entered or calculated
                notes,
                status: 'Non payé' // Default status for new order
            };

            await api.post('/orders', orderData);
            navigate('/orders'); // Navigate to main orders list
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
                        {passengers.map((p, index) => {
                            // Derive unique hotels from availableRooms
                            const uniqueHotels = Array.from(new Set(availableRooms.map(r => r.hotel_name))).filter(Boolean);
                            const passengerHotel = (p as any).selectedHotel || '';
                            const filteredRooms = availableRooms.filter(r => r.hotel_name === passengerHotel);

                            return (
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
                                            <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-2 bg-blue-50 p-2 rounded-lg border border-blue-100">
                                                <div>
                                                    <label className="text-xs text-gray-500 block font-bold text-blue-800 mb-1">1. Filtrer par Hôtel</label>
                                                    <select
                                                        value={passengerHotel}
                                                        onChange={e => updatePassenger(index, 'selectedHotel', e.target.value)}
                                                        className="w-full p-2 border rounded text-sm bg-white"
                                                    >
                                                        <option value="">-- Tous les Hôtels --</option>
                                                        {uniqueHotels.map(hotel => (
                                                            <option key={hotel} value={hotel}>{hotel}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-gray-500 block font-bold text-blue-800 mb-1">2. Assigner Chambre</label>
                                                    <select
                                                        value={(p as any).assignedRoomId || ''}
                                                        onChange={e => updatePassenger(index, 'assignedRoomId', e.target.value)}
                                                        className="w-full p-2 border rounded text-sm bg-white"
                                                        disabled={!passengerHotel && uniqueHotels.length > 0} // Optional: force hotel selection
                                                    >
                                                        <option value="">-- Non assigné --</option>
                                                        {(passengerHotel ? filteredRooms : availableRooms).map(room => {
                                                            const occupied = parseInt(room.occupied_count || '0');
                                                            const isFull = occupied >= room.capacity;
                                                            // Allow selecting if not full OR if it's the already selected room (to keep selection)
                                                            if (isFull && (p as any).assignedRoomId !== room.id) return null;

                                                            return (
                                                                <option key={room.id} value={room.id}>
                                                                    {room.hotel_name} - {room.room_number} ({room.gender}) - {occupied}/{room.capacity} - {room.price} DZD
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                </div>
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
                            );
                        })}
                    </div>
                </div>

                {/* Totals */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-end gap-2">
                    <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-gray-700">Total Calculé (DZD):</span>
                        <div className="text-2xl font-bold text-primary">
                            {totalAmount.toLocaleString()} DZD
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">Calculé automatiquement selon les chambres assignées.</p>
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
