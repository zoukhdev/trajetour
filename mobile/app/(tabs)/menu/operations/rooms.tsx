import { View, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useData } from '../../../../context/DataContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { useAuth } from '../../../../context/AuthContext';
import { ThemedText } from '../../../../components/ui/ThemedText';
import { Button } from '../../../../components/ui/Button';
import { BedDouble, Users, Plus, Edit, Trash2, ChevronDown, X, ArrowRightLeft } from 'lucide-react-native';
import { roomsAPI } from '../../../../services/api';

export default function RoomsScreen() {
    const { t } = useLanguage();
    const router = useRouter();
    const { rooms, deleteRoom, refreshData } = useData();
    const { user } = useAuth();

    const [selectedHotel, setSelectedHotel] = useState('');
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [occupants, setOccupants] = useState<any[]>([]);
    const [loadingOccupants, setLoadingOccupants] = useState(false);
    const [showHotelPicker, setShowHotelPicker] = useState(false);

    // Transfer state
    const [passengerToTransfer, setPassengerToTransfer] = useState<{ orderId: string; id: string } | null>(null);
    const [transferTargetHotel, setTransferTargetHotel] = useState('');
    const [transferTargetRoomId, setTransferTargetRoomId] = useState('');
    const [isTransferring, setIsTransferring] = useState(false);

    // Get unique hotel names for filter
    const uniqueHotels = Array.from(new Set(rooms.map(r => r.hotelName))).filter(Boolean).sort();

    // Filter rooms by selected hotel
    const filteredRooms = selectedHotel
        ? rooms.filter(r => r.hotelName === selectedHotel)
        : rooms;

    const handleDeleteRoom = (id: string, roomNumber: string) => {
        Alert.alert(
            t('common.delete'),
            t('menu.confirm_delete_room'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteRoom(id);
                            Alert.alert(t('common.success'), t('menu.room_deleted'));
                        } catch (error) {
                            Alert.alert(t('common.error'), t('common.error_occurred'));
                        }
                    }
                }
            ]
        );
    };

    const fetchOccupants = async (room: any) => {
        setLoadingOccupants(true);
        try {
            const data = await roomsAPI.getOccupants(room.id);
            setOccupants(data);
        } catch (error) {
            console.error('Failed to fetch occupants', error);
            setOccupants([]);
        } finally {
            setLoadingOccupants(false);
        }
    };

    const handleOpenDetails = (room: any) => {
        setSelectedRoom(room);
        setIsDetailsModalOpen(true);
        fetchOccupants(room);
        // Reset transfer state
        setPassengerToTransfer(null);
        setTransferTargetHotel('');
        setTransferTargetRoomId('');
    };

    const handleTransfer = async () => {
        if (!passengerToTransfer || !transferTargetRoomId) return;

        setIsTransferring(true);
        try {
            await roomsAPI.transfer({
                orderId: passengerToTransfer.orderId,
                passengerId: passengerToTransfer.id,
                newRoomId: transferTargetRoomId
            });

            Alert.alert(t('common.success'), 'Transfert réussi!');
            // Refresh occupants and global data
            if (selectedRoom) fetchOccupants(selectedRoom);
            refreshData(); // Update global room occupancy counts

            setPassengerToTransfer(null);
            setTransferTargetRoomId('');
            setTransferTargetHotel('');
        } catch (error: any) {
            Alert.alert(t('common.error'), error.message || t('common.error_occurred'));
        } finally {
            setIsTransferring(false);
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header with Filter and Add Button */}
            <View className="p-4 bg-white border-b border-gray-100">
                <View className="flex-row items-center gap-3 mb-3">
                    {/* Hotel Filter */}
                    <TouchableOpacity
                        onPress={() => setShowHotelPicker(!showHotelPicker)}
                        className="flex-1 flex-row items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-200"
                    >
                        <ThemedText className="text-sm text-gray-700">
                            {selectedHotel || 'Tous les hôtels'}
                        </ThemedText>
                        <ChevronDown size={16} color="#9CA3AF" />
                    </TouchableOpacity>

                    {/* Add Button */}
                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/menu/operations/form')}
                        className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center gap-2"
                    >
                        <Plus size={18} color="white" />
                        <ThemedText className="text-white font-semibold text-sm">Ajouter</ThemedText>
                    </TouchableOpacity>
                </View>

                {/* Hotel Picker Dropdown */}
                {showHotelPicker && (
                    <View className="bg-white border border-gray-200 rounded-lg mt-2 shadow-sm">
                        <TouchableOpacity
                            onPress={() => {
                                setSelectedHotel('');
                                setShowHotelPicker(false);
                            }}
                            className="p-3 border-b border-gray-100"
                        >
                            <ThemedText className="text-sm font-semibold text-gray-700">Tous les hôtels</ThemedText>
                        </TouchableOpacity>
                        {uniqueHotels.map((hotel) => (
                            <TouchableOpacity
                                key={hotel}
                                onPress={() => {
                                    setSelectedHotel(hotel);
                                    setShowHotelPicker(false);
                                }}
                                className="p-3 border-b border-gray-100"
                            >
                                <ThemedText className="text-sm text-gray-700">{hotel}</ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            <ScrollView className="flex-1 p-4">
                {filteredRooms.length > 0 ? (
                    filteredRooms.map((room) => {
                        const occupancy = room.occupiedCount || 0;
                        const isFull = occupancy >= room.capacity;
                        const occupancyRate = (occupancy / room.capacity) * 100;

                        return (
                            <TouchableOpacity
                                key={room.id}
                                onPress={() => handleOpenDetails(room)}
                                className="bg-white p-4 rounded-xl border border-gray-100 mb-3"
                            >
                                <View className="flex-row justify-between items-start mb-3">
                                    <View className="flex-1">
                                        <ThemedText className="font-[Inter_600SemiBold] text-gray-900 text-lg">
                                            {room.hotelName}
                                        </ThemedText>
                                        <View className="flex-row items-center gap-1 mt-1">
                                            <BedDouble size={14} color="#9CA3AF" />
                                            <ThemedText className="text-xs text-gray-500 font-medium">
                                                {t('menu.room_number')}: <ThemedText className="text-purple-600">{room.roomNumber}</ThemedText>
                                            </ThemedText>
                                        </View>
                                    </View>
                                    <View className={`px-2 py-1 rounded-md ${room.status === 'ACTIVE' ? 'bg-green-50' : 'bg-red-50'
                                        }`}>
                                        <ThemedText className={`text-xs font-bold ${room.status === 'ACTIVE' ? 'text-green-700' : 'text-red-700'
                                            }`}>
                                            {t(`menu.${room.status === 'ACTIVE' ? 'active' : 'out_of_service'}`)}
                                        </ThemedText>
                                    </View>
                                </View>

                                {/* Occupancy Progress Bar */}
                                <View className="mb-3">
                                    <View className="flex-row justify-between items-center mb-1">
                                        <ThemedText className="text-xs text-gray-600 font-medium">
                                            {occupancy} / {room.capacity} Occupés
                                        </ThemedText>
                                        <ThemedText className={`text-xs font-bold ${isFull ? 'text-red-500' : 'text-green-500'}`}>
                                            {isFull ? 'COMPLET' : 'DISPONIBLE'}
                                        </ThemedText>
                                    </View>
                                    <View className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <View
                                            className={`h-full ${isFull ? 'bg-red-500' : occupancyRate > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                            style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                                        />
                                    </View>
                                </View>

                                <View className="flex-row items-center gap-4 mb-3">
                                    <View className="flex-row items-center gap-1">
                                        <Users size={16} color="#6B7280" />
                                        <ThemedText className="text-sm text-gray-600">
                                            {room.capacity} {t('menu.capacity')}
                                        </ThemedText>
                                    </View>
                                    <View className="flex-row items-center gap-1">
                                        <ThemedText className="text-sm font-semibold text-gray-700">
                                            {t('menu.gender')}: <ThemedText className="text-blue-600">{t(`menu.${room.gender.toLowerCase()}`)}</ThemedText>
                                        </ThemedText>
                                    </View>
                                </View>

                                <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
                                    <View>
                                        <ThemedText className="text-lg font-[Outfit_700Bold] text-gray-900">
                                            {room.price.toLocaleString()} <ThemedText className="text-sm text-gray-400">DA</ThemedText>
                                        </ThemedText>
                                        {room.pricing && (
                                            <ThemedText className="text-xs text-gray-500 mt-1">
                                                CHD: {room.pricing.child?.toLocaleString()} • INF: {room.pricing.infant?.toLocaleString()}
                                            </ThemedText>
                                        )}
                                    </View>
                                    <View className="flex-row gap-2">
                                        {user?.role === 'admin' && (
                                            <>
                                                <TouchableOpacity
                                                    onPress={(e) => {
                                                        router.push({ pathname: '/(tabs)/menu/operations/form', params: { id: room.id } });
                                                    }}
                                                    className="w-9 h-9 bg-blue-50 rounded-lg items-center justify-center"
                                                >
                                                    <Edit size={16} color="#3B82F6" />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => handleDeleteRoom(room.id, room.roomNumber)}
                                                    className="w-9 h-9 bg-red-50 rounded-lg items-center justify-center"
                                                >
                                                    <Trash2 size={16} color="#EF4444" />
                                                </TouchableOpacity>
                                            </>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                ) : (
                    <View className="p-8 items-center justify-center">
                        <BedDouble size={48} color="#D1D5DB" />
                        <ThemedText className="text-gray-400 italic mt-4">
                            {selectedHotel ? `Aucune chambre pour "${selectedHotel}"` : 'Aucune chambre trouvée'}
                        </ThemedText>
                        {selectedHotel && (
                            <TouchableOpacity onPress={() => setSelectedHotel('')} className="mt-2">
                                <ThemedText className="text-blue-600 text-sm font-semibold">Voir toutes</ThemedText>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Room Details Modal */}
            <Modal
                visible={isDetailsModalOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setIsDetailsModalOpen(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '85%' }}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Header */}
                            <View className="flex-row justify-between items-center mb-4">
                                <ThemedText className="text-xl font-[Outfit_700Bold] text-gray-900">
                                    Chambre {selectedRoom?.roomNumber}
                                </ThemedText>
                                <TouchableOpacity
                                    onPress={() => setIsDetailsModalOpen(false)}
                                    className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                                >
                                    <X size={18} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            {/* Room Info */}
                            <View className="bg-gray-50 p-4 rounded-xl mb-4 flex-row justify-between">
                                <View>
                                    <ThemedText className="text-xs text-gray-500">Hôtel</ThemedText>
                                    <ThemedText className="font-semibold text-gray-900">{selectedRoom?.hotelName}</ThemedText>
                                </View>
                                <View>
                                    <ThemedText className="text-xs text-gray-500">Type</ThemedText>
                                    <ThemedText className="font-semibold text-gray-900">{selectedRoom?.gender}</ThemedText>
                                </View>
                                <View>
                                    <ThemedText className="text-xs text-gray-500">Prix</ThemedText>
                                    <ThemedText className="font-semibold text-gray-900">{selectedRoom?.price} DA</ThemedText>
                                </View>
                            </View>

                            {/* Occupants List */}
                            <View className="mt-2">
                                <View className="flex-row items-center gap-2 mb-3">
                                    <Users size={18} color="#374151" />
                                    <ThemedText className="font-bold text-gray-900">
                                        Occupants ({(occupants || []).length} / {selectedRoom?.capacity || '?'})
                                    </ThemedText>
                                </View>

                                {loadingOccupants ? (
                                    <View className="py-10 items-center">
                                        <ThemedText className="text-gray-400">Chargement...</ThemedText>
                                    </View>
                                ) : (occupants || []).length === 0 ? (
                                    <View className="py-10 items-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <ThemedText className="text-gray-400 italic">Aucun occupant</ThemedText>
                                    </View>
                                ) : (
                                    <View>
                                        {occupants.map((occ, idx) => (
                                            <View key={idx} className="mb-2">
                                                <View className="flex-row justify-between items-center p-3 bg-white border border-gray-100 rounded-xl">
                                                    <View className="flex-1">
                                                        <ThemedText className="font-semibold text-gray-900 text-sm">
                                                            {occ.firstName || occ.first_name || 'N/A'} {occ.lastName || occ.last_name || ''}
                                                        </ThemedText>
                                                        <ThemedText className="text-xs text-gray-500 mt-1">
                                                            {occ.passportNumber || occ.passport_number || 'No Passport'}
                                                        </ThemedText>
                                                    </View>
                                                    <View className="flex-row items-center gap-2">
                                                        <View className="bg-blue-50 px-2 py-1 rounded-md">
                                                            <ThemedText className="text-xs font-semibold text-blue-700">
                                                                {occ.gender}
                                                            </ThemedText>
                                                        </View>
                                                        {passengerToTransfer?.id !== occ.passenger_id && (
                                                            <TouchableOpacity
                                                                onPress={() => {
                                                                    setPassengerToTransfer({ orderId: occ.order_id, id: occ.passenger_id });
                                                                    setTransferTargetHotel(selectedRoom?.hotelName || '');
                                                                }}
                                                                className="bg-purple-50 px-3 py-1 rounded-md"
                                                            >
                                                                <ThemedText className="text-xs font-semibold text-purple-700">
                                                                    Transférer
                                                                </ThemedText>
                                                            </TouchableOpacity>
                                                        )}
                                                    </View>
                                                </View>

                                                {/* Transfer UI */}
                                                {passengerToTransfer?.id === occ.passenger_id && (
                                                    <View className="mt-2 bg-purple-50 p-3 rounded-xl border border-purple-200">
                                                        <ThemedText className="text-xs font-semibold text-purple-900 mb-2">
                                                            Transférer vers:
                                                        </ThemedText>

                                                        {/* Hotel Selector */}
                                                        <View className="mb-2">
                                                            <ThemedText className="text-xs text-gray-600 mb-1">Hôtel</ThemedText>
                                                            <View className="bg-white border border-gray-200 rounded-lg">
                                                                {uniqueHotels.map((hotel) => (
                                                                    <TouchableOpacity
                                                                        key={hotel}
                                                                        onPress={() => {
                                                                            setTransferTargetHotel(hotel);
                                                                            setTransferTargetRoomId(''); // Reset room
                                                                        }}
                                                                        className={`p-2 border-b border-gray-100 ${transferTargetHotel === hotel ? 'bg-purple-50' : ''}`}
                                                                    >
                                                                        <ThemedText className={`text-xs ${transferTargetHotel === hotel ? 'font-semibold text-purple-700' : 'text-gray-700'}`}>
                                                                            {hotel}
                                                                        </ThemedText>
                                                                    </TouchableOpacity>
                                                                ))}
                                                            </View>
                                                        </View>

                                                        {/* Room Selector */}
                                                        {transferTargetHotel && (
                                                            <View className="mb-2">
                                                                <ThemedText className="text-xs text-gray-600 mb-1">Chambre</ThemedText>
                                                                <View className="bg-white border border-gray-200 rounded-lg max-h-32">
                                                                    <ScrollView>
                                                                        {rooms
                                                                            .filter(r =>
                                                                                r.hotelName === transferTargetHotel &&
                                                                                r.id !== selectedRoom?.id &&
                                                                                (r.occupiedCount || 0) < r.capacity
                                                                            )
                                                                            .map((room) => (
                                                                                <TouchableOpacity
                                                                                    key={room.id}
                                                                                    onPress={() => setTransferTargetRoomId(room.id)}
                                                                                    className={`p-2 border-b border-gray-100 flex-row justify-between ${transferTargetRoomId === room.id ? 'bg-purple-50' : ''}`}
                                                                                >
                                                                                    <ThemedText className={`text-xs ${transferTargetRoomId === room.id ? 'font-semibold text-purple-700' : 'text-gray-700'}`}>
                                                                                        Room {room.roomNumber}
                                                                                    </ThemedText>
                                                                                    <ThemedText className="text-xs text-gray-500">
                                                                                        ({room.gender})
                                                                                    </ThemedText>
                                                                                </TouchableOpacity>
                                                                            ))
                                                                        }
                                                                    </ScrollView>
                                                                </View>
                                                            </View>
                                                        )}

                                                        {/* Action Buttons */}
                                                        <View className="flex-row gap-2 mt-2">
                                                            <TouchableOpacity
                                                                onPress={() => setPassengerToTransfer(null)}
                                                                className="flex-1 bg-gray-200 py-2 rounded-lg"
                                                            >
                                                                <ThemedText className="text-center text-xs font-semibold text-gray-700">
                                                                    Annuler
                                                                </ThemedText>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                onPress={handleTransfer}
                                                                disabled={!transferTargetRoomId || isTransferring}
                                                                className={`flex-1 py-2 rounded-lg flex-row items-center justify-center gap-1 ${!transferTargetRoomId || isTransferring ? 'bg-gray-300' : 'bg-green-600'
                                                                    }`}
                                                            >
                                                                <ArrowRightLeft size={14} color="white" />
                                                                <ThemedText className="text-center text-xs font-semibold text-white">
                                                                    {isTransferring ? 'En cours...' : 'Transférer'}
                                                                </ThemedText>
                                                            </TouchableOpacity>
                                                        </View>
                                                    </View>
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>

                            <View className="h-8" />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
