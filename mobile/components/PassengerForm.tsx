import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { ThemedText } from './ui/ThemedText';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { DatePicker } from './ui/DatePicker';
import { User, Phone, Mail, CreditCard, BedDouble } from 'lucide-react-native';
import type { Passenger, Room } from '../types';

interface PassengerFormProps {
    passenger?: Passenger;
    onSave: (passenger: Passenger) => void;
    onCancel: () => void;
    rooms?: Room[]; // Available rooms for selection
    offerId?: string; // To filter rooms by offer
}

export default function PassengerForm({ passenger, onSave, onCancel, rooms = [], offerId }: PassengerFormProps) {
    const [formData, setFormData] = useState<Passenger>(
        passenger || {
            id: Math.random().toString(36).substring(2, 9),
            firstName: '',
            lastName: '',
            passportNumber: '',
            passportExpiry: '',
            phoneNumber: '',
            email: '',
            birthDate: '',
            gender: 'Homme',
            photo: ''
        }
    );

    const [selectedHotel, setSelectedHotel] = useState('');

    const handleChange = (field: keyof Passenger, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            alert('Le nom et le prénom sont obligatoires');
            return;
        }
        onSave(formData);
    };

    return (
        <ScrollView className="flex-1 bg-white p-4">
            <View className="flex-row gap-4 mb-4">
                <View className="flex-1">
                    <View className="mb-2 flex-row items-center gap-2">
                        <User size={16} color="#6B7280" />
                        <ThemedText className="text-sm font-medium text-gray-700">Prénom *</ThemedText>
                    </View>
                    <Input
                        value={formData.firstName}
                        onChangeText={(text) => handleChange('firstName', text)}
                        placeholder="Prénom"
                    />
                </View>
                <View className="flex-1">
                    <View className="mb-2 flex-row items-center gap-2">
                        <User size={16} color="#6B7280" />
                        <ThemedText className="text-sm font-medium text-gray-700">Nom *</ThemedText>
                    </View>
                    <Input
                        value={formData.lastName}
                        onChangeText={(text) => handleChange('lastName', text)}
                        placeholder="Nom"
                    />
                </View>
            </View>

            <View className="mb-4">
                <DatePicker
                    label="Date de naissance"
                    value={formData.birthDate}
                    onChange={(date) => handleChange('birthDate', date)}
                    placeholder="Sélectionner la date de naissance"
                />
            </View>

            <View className="mb-4">
                <View className="mb-2 flex-row items-center gap-2">
                    <User size={16} color="#6B7280" />
                    <ThemedText className="text-sm font-medium text-gray-700">Genre</ThemedText>
                </View>
                <View className="flex-row gap-4">
                    {['Homme', 'Femme'].map((gender) => (
                        <Button
                            key={gender}
                            variant={formData.gender === gender ? 'primary' : 'outline'}
                            size="sm"
                            onPress={() => handleChange('gender', gender as 'Homme' | 'Femme')}
                            title={gender}
                        />
                    ))}
                </View>
            </View>

            <View className="mb-4">
                <View className="mb-2 flex-row items-center gap-2">
                    <CreditCard size={16} color="#6B7280" />
                    <ThemedText className="text-sm font-medium text-gray-700">Numéro de passeport</ThemedText>
                </View>
                <Input
                    value={formData.passportNumber}
                    onChangeText={(text) => handleChange('passportNumber', text)}
                    placeholder="Numéro de passeport"
                />
            </View>

            <View className="mb-4">
                <DatePicker
                    label="Expiration Passeport"
                    value={formData.passportExpiry}
                    onChange={(date) => handleChange('passportExpiry', date)}
                    placeholder="Sélectionner la date d'expiration"
                />
            </View>

            {/* Room Selection */}
            {rooms && rooms.length > 0 && (
                <View className="mb-4">
                    <View className="mb-2 flex-row items-center gap-2">
                        <BedDouble size={16} color="#6B7280" />
                        <ThemedText className="text-sm font-medium text-gray-700">Chambre Assignée</ThemedText>
                    </View>

                    {/* Hotel Selection */}
                    <ThemedText className="text-xs text-gray-500 mb-2">1. Sélectionner l'hôtel</ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 mb-3">
                        {Array.from(new Set(rooms.filter(r => !offerId || r.offerId === offerId).map(r => r.hotelName))).map((hotel) => (
                            <TouchableOpacity
                                key={hotel}
                                onPress={() => {
                                    setSelectedHotel(hotel);
                                    // Clear room selection when changing hotel
                                    if (formData.assignedRoomId) {
                                        const currentRoom = rooms.find(r => r.id === formData.assignedRoomId);
                                        if (currentRoom?.hotelName !== hotel) {
                                            handleChange('assignedRoomId', '');
                                        }
                                    }
                                }}
                                className={`px-4 py-2 rounded-lg border ${selectedHotel === hotel ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'}`}
                            >
                                <ThemedText className={`text-sm font-semibold ${selectedHotel === hotel ? 'text-white' : 'text-gray-700'}`}>
                                    {hotel}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Room Selection - Only show if hotel is selected */}
                    {selectedHotel && (
                        <>
                            <ThemedText className="text-xs text-gray-500 mb-2">2. Sélectionner la chambre</ThemedText>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                                <TouchableOpacity
                                    onPress={() => handleChange('assignedRoomId', '')}
                                    className={`px-4 py-3 rounded-lg border ${!formData.assignedRoomId ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-200'
                                        }`}
                                >
                                    <ThemedText className={!formData.assignedRoomId ? 'font-semibold text-gray-700' : 'text-gray-500'}>
                                        Aucune
                                    </ThemedText>
                                </TouchableOpacity>
                                {rooms
                                    .filter(r => !offerId || r.offerId === offerId)
                                    .filter(r => r.hotelName === selectedHotel)
                                    .filter(r => (r.occupiedCount || 0) < r.capacity || r.id === formData.assignedRoomId)
                                    .map((room) => {
                                        const isSelected = formData.assignedRoomId === room.id;
                                        const isFull = (room.occupiedCount || 0) >= room.capacity && !isSelected;
                                        const genderLabel = room.gender === 'MEN' ? 'Homme' : room.gender === 'WOMEN' ? 'Femme' : 'Mixte';

                                        return (
                                            <TouchableOpacity
                                                key={room.id}
                                                onPress={() => !isFull && handleChange('assignedRoomId', room.id)}
                                                disabled={isFull}
                                                className={`px-4 py-3 rounded-lg border min-w-[140px] ${isSelected
                                                        ? 'bg-blue-600 border-blue-600'
                                                        : isFull
                                                            ? 'bg-gray-50 border-gray-200 opacity-50'
                                                            : 'bg-white border-gray-200'
                                                    }`}
                                            >
                                                <View className="flex-row items-center justify-between mb-1">
                                                    <ThemedText className={`font-bold text-base ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                                        #{room.roomNumber}
                                                    </ThemedText>
                                                    <View className={`px-2 py-0.5 rounded ${room.gender === 'MEN' ? 'bg-blue-100' : room.gender === 'WOMEN' ? 'bg-pink-100' : 'bg-purple-100'
                                                        }`}>
                                                        <ThemedText className={`text-xs font-semibold ${isSelected ? 'text-white' :
                                                                room.gender === 'MEN' ? 'text-blue-700' :
                                                                    room.gender === 'WOMEN' ? 'text-pink-700' : 'text-purple-700'
                                                            }`}>
                                                            {genderLabel}
                                                        </ThemedText>
                                                    </View>
                                                </View>
                                                <ThemedText className={`text-xs ${isSelected ? 'text-blue-200' : 'text-gray-500'}`}>
                                                    {room.occupiedCount || 0}/{room.capacity} occupés
                                                    {isFull && ' (Complet)'}
                                                </ThemedText>
                                            </TouchableOpacity>
                                        );
                                    })}
                            </ScrollView>
                        </>
                    )}
                </View>
            )}

            <View className="mb-4">
                <View className="mb-2 flex-row items-center gap-2">
                    <Phone size={16} color="#6B7280" />
                    <ThemedText className="text-sm font-medium text-gray-700">Téléphone</ThemedText>
                </View>
                <Input
                    value={formData.phoneNumber}
                    onChangeText={(text) => handleChange('phoneNumber', text)}
                    placeholder="+213..."
                    keyboardType="phone-pad"
                />
            </View>

            <View className="mb-6">
                <View className="mb-2 flex-row items-center gap-2">
                    <Mail size={16} color="#6B7280" />
                    <ThemedText className="text-sm font-medium text-gray-700">Email</ThemedText>
                </View>
                <Input
                    value={formData.email}
                    onChangeText={(text) => handleChange('email', text)}
                    placeholder="Email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>

            <View className="flex-row gap-3 pt-4 border-t border-gray-100 mb-8">
                <View className="flex-1">
                    <Button variant="outline" onPress={onCancel} title="Annuler" />
                </View>
                <View className="flex-1">
                    <Button variant="primary" onPress={handleSubmit} title={passenger ? 'Mettre à jour' : 'Ajouter'} />
                </View>
            </View>
        </ScrollView>
    );
}
