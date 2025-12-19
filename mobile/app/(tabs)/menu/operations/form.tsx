import { View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { useData } from '../../../../context/DataContext';
import { useLanguage } from '../../../../context/LanguageContext';
import { ThemedText } from '../../../../components/ui/ThemedText';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';
import type { Room } from '../../../../types';

export default function RoomFormScreen() {
    const { t } = useLanguage();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const { rooms, addRoom, updateRoom } = useData();

    const [hotelName, setHotelName] = useState('');
    const [roomNumber, setRoomNumber] = useState('');
    const [capacity, setCapacity] = useState('');
    const [gender, setGender] = useState<'MEN' | 'WOMEN' | 'MIXED'>('MIXED');
    const [price, setPrice] = useState('');
    const [adultPrice, setAdultPrice] = useState('');
    const [childPrice, setChildPrice] = useState('');
    const [infantPrice, setInfantPrice] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (id) {
            const room = rooms.find(r => r.id === id);
            if (room) {
                setHotelName(room.hotelName);
                setRoomNumber(room.roomNumber);
                setCapacity(room.capacity.toString());
                setGender(room.gender);
                setPrice(room.price.toString());
                setAdultPrice(room.pricing?.adult?.toString() || room.price.toString());
                setChildPrice(room.pricing?.child?.toString() || '0');
                setInfantPrice(room.pricing?.infant?.toString() || '0');
            }
        }
    }, [id, rooms]);

    const handleSave = async () => {
        if (!hotelName || !roomNumber || !capacity || !price) {
            Alert.alert(t('common.error'), t('common.required_fields'));
            return;
        }

        setIsLoading(true);
        try {
            const roomData: Room = {
                id: id || '',
                hotelName,
                roomNumber,
                capacity: parseInt(capacity),
                gender,
                price: parseFloat(adultPrice || price),
                pricing: {
                    adult: parseFloat(adultPrice || price),
                    child: parseFloat(childPrice || '0'),
                    infant: parseFloat(infantPrice || '0')
                },
                status: 'ACTIVE'
            };

            if (id) {
                await updateRoom(roomData);
                Alert.alert(t('common.success'), t('menu.room_updated'));
            } else {
                await addRoom(roomData);
                Alert.alert(t('common.success'), t('menu.room_created'));
            }
            router.back();
        } catch (error) {
            Alert.alert(t('common.error'), t('common.error_occurred'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView className="flex-1 bg-gray-50 p-4">
            <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
                <View>
                    <ThemedText className="text-sm font-[Inter_500Medium] text-gray-700 mb-2">
                        {t('menu.hotel_name')} *
                    </ThemedText>
                    <Input
                        placeholder="Hilton Makkah"
                        value={hotelName}
                        onChangeText={setHotelName}
                    />
                </View>

                <View>
                    <ThemedText className="text-sm font-[Inter_500Medium] text-gray-700 mb-2">
                        {t('menu.room_number')} *
                    </ThemedText>
                    <Input
                        placeholder="101"
                        value={roomNumber}
                        onChangeText={setRoomNumber}
                    />
                </View>

                <View>
                    <ThemedText className="text-sm font-[Inter_500Medium] text-gray-700 mb-2">
                        {t('menu.capacity')} *
                    </ThemedText>
                    <Input
                        placeholder="2"
                        value={capacity}
                        onChangeText={setCapacity}
                        keyboardType="number-pad"
                    />
                </View>

                <View>
                    <ThemedText className="text-sm font-[Inter_500Medium] text-gray-700 mb-2">
                        {t('menu.gender')} *
                    </ThemedText>
                    <View className="flex-row gap-2">
                        {(['MEN', 'WOMEN', 'MIXED'] as const).map((g) => (
                            <TouchableOpacity
                                key={g}
                                onPress={() => setGender(g)}
                                className={`flex-1 p-3 rounded-xl border ${gender === g ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'
                                    }`}
                            >
                                <ThemedText className={`text-center text-sm font-semibold ${gender === g ? 'text-blue-600' : 'text-gray-600'
                                    }`}>
                                    {t(`menu.${g.toLowerCase()}`)}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View>
                    <ThemedText className="text-sm font-[Inter_600SemiBold] text-gray-700 mb-3">
                        Prix par Catégorie d'Âge (DZD)
                    </ThemedText>
                    <View className="bg-gray-50 p-4 rounded-xl border border-gray-200 gap-3">
                        <View>
                            <ThemedText className="text-xs font-[Inter_500Medium] text-gray-600 mb-2">
                                Adulte (ADT) *
                            </ThemedText>
                            <Input
                                placeholder="50000"
                                value={adultPrice}
                                onChangeText={(val) => {
                                    setAdultPrice(val);
                                    setPrice(val); // Keep price synced with adult
                                }}
                                keyboardType="decimal-pad"
                            />
                        </View>

                        <View>
                            <ThemedText className="text-xs font-[Inter_500Medium] text-gray-600 mb-2">
                                Enfant (CHD) 2-11 ans
                            </ThemedText>
                            <Input
                                placeholder="25000"
                                value={childPrice}
                                onChangeText={setChildPrice}
                                keyboardType="decimal-pad"
                            />
                        </View>

                        <View>
                            <ThemedText className="text-xs font-[Inter_500Medium] text-gray-600 mb-2">
                                Bébé (INF) 0-1 an
                            </ThemedText>
                            <Input
                                placeholder="0"
                                value={infantPrice}
                                onChangeText={setInfantPrice}
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </View>
                </View>

                <View className="flex-row gap-4 mt-4">
                    <Button
                        title={t('common.cancel')}
                        onPress={() => router.back()}
                        variant="secondary"
                        className="flex-1"
                    />
                    <Button
                        title={t('common.save')}
                        onPress={handleSave}
                        isLoading={isLoading}
                        className="flex-1"
                    />
                </View>
            </View>
        </ScrollView>
    );
}
