import { useState, useEffect } from 'react';
import { View, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useData } from '../../../context/DataContext';
import { ThemedText } from '../../../components/ui/ThemedText';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { DatePicker } from '../../../components/ui/DatePicker';
import { User, Phone, CreditCard, MapPin, Calendar } from 'lucide-react-native';
import type { Client } from '../../../types';

export default function ClientFormScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { clients, addClient, updateClient } = useData();

    const isEditing = !!id;
    const existingClient = clients.find(c => c.id === id);

    const [isLoading, setIsLoading] = useState(false);
    const [type, setType] = useState<'Individual' | 'Entreprise'>('Individual');
    const [formData, setFormData] = useState({
        fullName: '',
        mobileNumber: '',
        passportNumber: '',
        passportExpiry: ''
    });

    useEffect(() => {
        if (existingClient) {
            setType(existingClient.type);
            setFormData({
                fullName: existingClient.fullName,
                mobileNumber: existingClient.mobileNumber,
                passportNumber: existingClient.passportNumber || '',
                passportExpiry: existingClient.passportExpiry || ''
            });
        }
    }, [existingClient]);

    const handleSubmit = async () => {
        if (!formData.fullName || !formData.mobileNumber) {
            Alert.alert('Erreur', 'Le nom et le numéro de téléphone sont requis.');
            return;
        }

        setIsLoading(true);
        try {
            const clientData: Client = {
                id: (id as string) || Math.random().toString(36).substr(2, 9),
                type,
                fullName: formData.fullName,
                mobileNumber: formData.mobileNumber,
                passportNumber: formData.passportNumber || undefined,
                passportExpiry: formData.passportExpiry || undefined
            };

            if (isEditing) {
                await updateClient(clientData);
            } else {
                await addClient(clientData);
            }
            router.back();
        } catch (error: any) {
            Alert.alert('Erreur', error.message || 'Une erreur est survenue');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
            <View className="p-4 border-b border-gray-100 flex-row items-center justify-between pt-12 bg-white">
                <ThemedText variant="h2">{isEditing ? 'Modifier Client' : 'Nouveau Client'}</ThemedText>
                <TouchableOpacity onPress={() => router.back()}>
                    <ThemedText className="text-blue-600">Annuler</ThemedText>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4">
                {/* Type Selection */}
                <View className="flex-row gap-4 mb-6">
                    <TouchableOpacity
                        className={`flex-1 p-4 rounded-xl border flex-row items-center justify-center gap-2 ${type === 'Individual' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}
                        onPress={() => setType('Individual')}
                    >
                        <User size={20} color={type === 'Individual' ? '#2563EB' : '#6B7280'} />
                        <ThemedText className={type === 'Individual' ? 'text-blue-700 font-bold' : 'text-gray-500'}>Individuel</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className={`flex-1 p-4 rounded-xl border flex-row items-center justify-center gap-2 ${type === 'Entreprise' ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}
                        onPress={() => setType('Entreprise')}
                    >
                        <User size={20} color={type === 'Entreprise' ? '#7C3AED' : '#6B7280'} />
                        <ThemedText className={type === 'Entreprise' ? 'text-purple-700 font-bold' : 'text-gray-500'}>Entreprise</ThemedText>
                    </TouchableOpacity>
                </View>

                <View className="space-y-4">
                    <Input
                        label="Nom Complet"
                        placeholder="Ex: Mohamed Amine"
                        value={formData.fullName}
                        onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                    />

                    <Input
                        label="Numéro de Mobile"
                        placeholder="Ex: 0550 12 34 56"
                        keyboardType="phone-pad"
                        value={formData.mobileNumber}
                        onChangeText={(text) => setFormData({ ...formData, mobileNumber: text })}
                    />

                    <Input
                        label="N° Passeport (Optionnel)"
                        placeholder="Ex: 123456789"
                        value={formData.passportNumber}
                        onChangeText={(text) => setFormData({ ...formData, passportNumber: text })}
                    />

                    {/* Date picker for passport expiry */}
                    <DatePicker
                        label="Expiration Passeport"
                        value={formData.passportExpiry}
                        onChange={(date) => setFormData({ ...formData, passportExpiry: date })}
                        placeholder="Sélectionner la date d'expiration"
                    />
                </View>
            </ScrollView>

            <View className="p-4 border-t border-gray-100">
                <Button
                    title={isEditing ? "Enregistrer" : "Créer"}
                    onPress={handleSubmit}
                    isLoading={isLoading}
                />
            </View>
        </View>
    );
}
