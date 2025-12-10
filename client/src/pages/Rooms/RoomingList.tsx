import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Plus, Hotel, Users, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal';

// Define Room Interface here since it's new
interface Room {
    id: string;
    offer_id: string;
    hotel_name: string;
    room_number: string;
    capacity: number;
    gender: 'MEN' | 'WOMEN' | 'MIXED';
    status: 'ACTIVE' | 'OUT_OF_SERVICE';
    occupied_count?: number; // Calculated field
}

const RoomingList = () => {
    const { offers } = useData();
    const { user } = useAuth(); // for permissions
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [selectedOfferId, setSelectedOfferId] = useState('');
    const [selectedHotel, setSelectedHotel] = useState('');

    // Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newRoom, setNewRoom] = useState({
        roomNumber: '',
        capacity: 4,
        gender: 'MIXED',
        hotelName: '' // Will default to selectedHotel if possible
    });

    // Valid role check for modifications
    const canManageRooms = user?.role === 'admin' || user?.role === 'staff';

    // 1. Fetch Rooms when filters change
    useEffect(() => {
        if (!selectedOfferId) {
            setRooms([]);
            return;
        }

        const fetchRooms = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({ offerId: selectedOfferId });
                if (selectedHotel) params.append('hotelName', selectedHotel);

                const res = await fetch(`/api/rooms?${params.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    setRooms(data);
                }
            } catch (err) {
                console.error("Failed to fetch rooms", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRooms();
    }, [selectedOfferId, selectedHotel]);

    // 2. Handle Add Room
    const handleAddRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOfferId) return alert("Veuillez sélectionner une offre d'abord.");
        if (!newRoom.hotelName) return alert("Veuillez entrer le nom de l'hôtel.");

        try {
            const res = await fetch('/api/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    offerId: selectedOfferId,
                    ...newRoom
                })
            });

            if (res.ok) {
                const createdRoom = await res.json();
                setRooms([createdRoom, ...rooms]); // Prepend
                setIsAddModalOpen(false);
                setNewRoom({ ...newRoom, roomNumber: '' }); // Reset number
            } else {
                alert("Erreur lors de la création.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    // 3. Handle Delete (Soft)
    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cette chambre ?")) return;
        try {
            const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setRooms(rooms.filter(r => r.id !== id));
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Derive available hotels from Offer (if possible) or just text input
    // Ideally, offers should have a list of hotels, but for now we rely on inputs.
    // We can also extract unique hotels from the rooms list itself.

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 font-display flex items-center gap-2">
                    <Hotel className="text-primary" />
                    Rooming List
                </h1>
                {canManageRooms && selectedOfferId && (
                    <button
                        onClick={() => {
                            setNewRoom(prev => ({ ...prev, hotelName: selectedHotel || '' }));
                            setIsAddModalOpen(true);
                        }}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        <span>Ajouter une chambre</span>
                    </button>
                )}
            </div>

            {/* Filters Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sélectionner une Offre (Voyage) *
                        </label>
                        <select
                            value={selectedOfferId}
                            onChange={(e) => {
                                setSelectedOfferId(e.target.value);
                                setSelectedHotel(''); // Reset hotel filter
                            }}
                            className="w-full px-3 py-2 border border-blue-200 bg-blue-50/50 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                        >
                            <option value="">-- Choisir une offre --</option>
                            {offers.map(offer => (
                                <option key={offer.id} value={offer.id}>
                                    {offer.title} ({offer.destination})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sélectionner un Hôtel
                        </label>
                        <select
                            value={selectedHotel}
                            onChange={(e) => {
                                if (e.target.value === 'NEW') {
                                    const name = prompt("Entrez le nom du nouvel hôtel :");
                                    if (name) setSelectedHotel(name);
                                } else {
                                    setSelectedHotel(e.target.value);
                                }
                            }}
                            disabled={!selectedOfferId}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                        >
                            <option value="">-- Tous les hôtels --</option>
                            {Array.from(new Set(rooms.map(r => r.hotel_name).filter(Boolean))).map(h => (
                                <option key={h} value={h}>{h}</option>
                            ))}
                            <option value="NEW" className="font-bold text-primary">+ Ajouter un hôtel</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Room Content */}
            {!selectedOfferId ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                    <Hotel size={48} className="mx-auto mb-3 opacity-20" />
                    <p>Veuillez sélectionner une offre pour voir le Rooming List.</p>
                </div>
            ) : loading ? (
                <div className="text-center py-12">Chargement...</div>
            ) : (
                <div className="space-y-6">
                    {/* Contextual Add Button */}
                    {canManageRooms && selectedHotel && (
                        <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <div>
                                <h3 className="font-bold text-lg text-blue-900">{selectedHotel}</h3>
                                <p className="text-sm text-blue-600">
                                    {rooms.filter(r => r.hotel_name === selectedHotel).length} chambres configurées
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setNewRoom(prev => ({ ...prev, hotelName: selectedHotel }));
                                    setIsAddModalOpen(true);
                                }}
                                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <Plus size={20} />
                                <span>Ajouter une chambre à {selectedHotel}</span>
                            </button>
                        </div>
                    )}

                    {/* Room Grid */}
                    {rooms.filter(r => !selectedHotel || r.hotel_name === selectedHotel).length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            {selectedHotel ? "Aucune chambre dans cet hôtel." : "Aucune chambre configurée pour cette offre."}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {rooms
                                .filter(r => !selectedHotel || r.hotel_name === selectedHotel)
                                .map(room => {
                                    const occupancy = room.occupied_count || 0;
                                    const isFull = occupancy >= room.capacity;
                                    const occupancyRate = (occupancy / room.capacity) * 100;

                                    return (
                                        <div key={room.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                                            {/* Header */}
                                            <div className={`p-3 border-b border-gray-50 flex justify-between items-start ${room.gender === 'MEN' ? 'bg-blue-50/30' : room.gender === 'WOMEN' ? 'bg-pink-50/30' : 'bg-purple-50/30'
                                                }`}>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-lg">Room {room.room_number}</h3>
                                                    <p className="text-xs text-gray-500 font-medium truncate max-w-[150px]" title={room.hotel_name}>
                                                        {room.hotel_name}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${room.gender === 'MEN' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                    room.gender === 'WOMEN' ? 'bg-pink-100 text-pink-700 border-pink-200' :
                                                        'bg-purple-100 text-purple-700 border-purple-200'
                                                    }`}>
                                                    {room.gender}
                                                </span>
                                            </div>

                                            {/* Body */}
                                            <div className="p-4 space-y-3">
                                                {/* Occupancy Bar */}
                                                <div>
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-gray-600 font-medium">{occupancy} / {room.capacity} Occupés</span>
                                                        <span className={`${isFull ? 'text-red-500' : 'text-green-500'}`}>
                                                            {isFull ? 'COMPLET' : 'DISPONIBLE'}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-500 ${isFull ? 'bg-red-500' : occupancyRate > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                                                }`}
                                                            style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Placeholders for occupants (Visual Only for now) */}
                                                <div className="flex items-center gap-1 text-gray-400">
                                                    <Users size={14} />
                                                    <span className="text-xs">
                                                        {occupancy === 0 ? "Vide" : `${occupancy} pèlerins assignés`}
                                                    </span>
                                                    {/* TODO: Add 'View Occupants' button/modal later */}
                                                </div>
                                            </div>

                                            {/* Footer / Actions */}
                                            {canManageRooms && (
                                                <div className="px-4 py-2 border-t border-gray-50 bg-gray-50/50 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleDelete(room.id)}
                                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                        title="Supprimer la chambre"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                </div>
            )}

            {/* ADD MODAL */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Ajouter une nouvelle chambre"
            >
                <form onSubmit={handleAddRoom} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hôtel</label>
                        <input
                            type="text"
                            required
                            placeholder="Ex: Hilton Makkah"
                            value={newRoom.hotelName}
                            onChange={(e) => setNewRoom({ ...newRoom, hotelName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de chambre</label>
                            <input
                                type="text"
                                required
                                placeholder="Ex: 104"
                                value={newRoom.roomNumber}
                                onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Capacité (Lits)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                max="10"
                                value={newRoom.capacity}
                                onChange={(e) => setNewRoom({ ...newRoom, capacity: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Genre / Restriction</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['MEN', 'WOMEN', 'MIXED'] as const).map(g => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => setNewRoom({ ...newRoom, gender: g })}
                                    className={`py-2 px-3 rounded-lg border text-sm font-bold transition-all ${newRoom.gender === g
                                        ? 'bg-primary text-white border-primary shadow-sm'
                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {g === 'MEN' ? 'Hommes' : g === 'WOMEN' ? 'Femmes' : 'Mixte'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
                        >
                            Créer la chambre
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default RoomingList;
