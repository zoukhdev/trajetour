import { useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useData } from '../../../../../context/DataContext';
import { ThemedText } from '../../../../../components/ui/ThemedText';
import { Button } from '../../../../../components/ui/Button';
import { ArrowLeft, Plus, FileText, Hotel, Bus, Plane, Utensils, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react-native';
import { supplierContractsAPI } from '../../../../../services/api';
import { SupplierContract, ContractType } from '../../../../../types';

const contractIcons: Record<string, any> = {
    'Rooms': Hotel,
    'Visa': FileText,
    'Transportation': Bus,
    'Flight': Plane,
    'Food': Utensils
};

export default function SupplierContractsList() {
    const router = useRouter();
    const { id: supplierId } = useLocalSearchParams<{ id: string }>();
    const { suppliers } = useData();

    const [contracts, setContracts] = useState<SupplierContract[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const supplier = suppliers.find(s => s.id === supplierId);

    const loadContracts = useCallback(async () => {
        if (!supplierId) return;
        try {
            const data = await supplierContractsAPI.getBySupplier(supplierId);
            setContracts(data);
        } catch (error) {
            console.error('Failed to load contracts:', error);
            Alert.alert('Erreur', 'Impossible de charger les contrats');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [supplierId]);

    useFocusEffect(
        useCallback(() => {
            loadContracts();
        }, [loadContracts])
    );

    const handleDelete = (contractId: string) => {
        Alert.alert(
            "Supprimer",
            "Voulez-vous vraiment supprimer ce contrat ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await supplierContractsAPI.delete(contractId);
                            loadContracts();
                        } catch (error) {
                            Alert.alert('Erreur', 'Impossible de supprimer le contrat');
                        }
                    }
                }
            ]
        );
    };

    const renderDetails = (contract: SupplierContract) => {
        const details = contract.details as any;
        const Icon = contractIcons[contract.contractType] || FileText;

        switch (contract.contractType) {
            case 'Rooms':
                return (
                    <View className="space-y-2">
                        <ThemedText className="text-sm">Quantité: {details.quantity} chambres</ThemedText>
                        <ThemedText className="text-sm">Prix/pers: {details.pricePerPersonDzd} DA</ThemedText>
                        <ThemedText className="text-sm">Hôtel: {details.hotelName} ({details.cityIn})</ThemedText>
                        <ThemedText className="text-sm">Dates: {details.dateIn} au {details.dateOut}</ThemedText>
                    </View>
                );
            case 'Visa':
                return (
                    <View className="space-y-2">
                        <ThemedText className="text-sm">Quantité: {details.quantity} visas</ThemedText>
                        <ThemedText className="text-sm">Prix/visa: {details.pricePerVisa}</ThemedText>
                        <ThemedText className="text-sm">Type: {details.visaType} ({details.country})</ThemedText>
                    </View>
                );
            case 'Transportation':
                return (
                    <View className="space-y-2">
                        <ThemedText className="text-sm">Type: {details.vehicleType} ({details.quantity})</ThemedText>
                        <ThemedText className="text-sm">Route: {details.route}</ThemedText>
                        <ThemedText className="text-sm">Dates: {details.dateFrom} - {details.dateTo}</ThemedText>
                    </View>
                );
            case 'Flight':
                return (
                    <View className="space-y-2">
                        <ThemedText className="text-sm">Cie: {details.airline}</ThemedText>
                        <ThemedText className="text-sm">Billets: {details.ticketQuantity}</ThemedText>
                        <ThemedText className="text-sm">Vol: {details.departure?.airport} {'->'} {details.arrival?.airport}</ThemedText>
                    </View>
                );
            case 'Food':
                return (
                    <View className="space-y-2">
                        <ThemedText className="text-sm">Type: {details.mealType}</ThemedText>
                        <ThemedText className="text-sm">Qté: {details.quantity}</ThemedText>
                        <ThemedText className="text-sm">Lieu: {details.location}</ThemedText>
                    </View>
                );
            default:
                return <ThemedText className="text-sm text-gray-500">Détails non disponibles</ThemedText>;
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 shadow-sm z-10 flex-row justify-between items-center">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={() => router.back()}>
                        <ArrowLeft size={24} color="#374151" />
                    </TouchableOpacity>
                    <View>
                        <ThemedText variant="h3" className="text-gray-900">Contrats</ThemedText>
                        <ThemedText className="text-xs text-gray-500">{supplier?.name || 'Fournisseur'}</ThemedText>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={() => router.push({ pathname: '/(tabs)/suppliers/[id]/contracts/form', params: { id: supplierId } })}
                    className="bg-purple-600 px-3 py-2 rounded-lg flex-row items-center gap-2 shadow-md"
                >
                    <Plus size={18} color="white" />
                    <ThemedText className="text-white font-bold text-sm">Nouveau</ThemedText>
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1 p-4"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadContracts(); }} />}
            >
                {loading ? (
                    <ActivityIndicator size="large" color="#9333ea" className="mt-8" />
                ) : contracts.length === 0 ? (
                    <View className="flex-1 items-center justify-center py-20 opacity-50">
                        <View className="bg-gray-100 p-6 rounded-full mb-4">
                            <FileText size={48} color="#9CA3AF" />
                        </View>
                        <ThemedText className="text-gray-500 font-medium">Aucun contrat trouvé</ThemedText>
                        <Button
                            title="Créer le premier contrat"
                            variant="link"
                            onPress={() => router.push({ pathname: '/(tabs)/suppliers/[id]/contracts/form', params: { id: supplierId } })}
                        />
                    </View>
                ) : (
                    contracts.map((contract) => {
                        const Icon = contractIcons[contract.contractType] || FileText;
                        const isExpanded = expandedRow === contract.id;

                        return (
                            <View key={contract.id} className="bg-white rounded-xl shadow-sm border border-gray-100 mb-3 overflow-hidden">
                                <TouchableOpacity
                                    className="p-4 flex-row items-center justify-between"
                                    onPress={() => setExpandedRow(isExpanded ? null : contract.id)}
                                >
                                    <View className="flex-row items-center gap-3">
                                        <View className="w-10 h-10 rounded-lg bg-blue-50 items-center justify-center">
                                            <Icon size={20} color="#2563EB" />
                                        </View>
                                        <View>
                                            <ThemedText className="font-bold text-gray-900">{contract.contractType}</ThemedText>
                                            <ThemedText className="text-xs text-gray-500">
                                                {new Date(contract.datePurchased).toLocaleDateString('fr-FR')}
                                            </ThemedText>
                                        </View>
                                    </View>
                                    <View className="items-end">
                                        <ThemedText className="font-bold text-gray-900">
                                            {contract.contractValueDzd.toLocaleString('fr-DZ', { maximumFractionDigits: 0 })} DA
                                        </ThemedText>
                                        <View className="flex-row items-center mt-1">
                                            <ThemedText className="text-xs text-gray-400 mr-1">
                                                {isExpanded ? 'Masquer' : 'Détails'}
                                            </ThemedText>
                                            {isExpanded ? <ChevronUp size={14} color="#9CA3AF" /> : <ChevronDown size={14} color="#9CA3AF" />}
                                        </View>
                                    </View>
                                </TouchableOpacity>

                                {isExpanded && (
                                    <View className="px-4 pb-4 border-t border-gray-100 bg-gray-50/50 pt-3">
                                        {renderDetails(contract)}

                                        <View className="flex-row justify-between items-center pt-3 mt-3 border-t border-gray-200">
                                            <ThemedText className="text-xs text-gray-500">
                                                Devise: {contract.contractValue} {contract.paymentCurrency} (Taux: {contract.exchangeRate})
                                            </ThemedText>

                                            <View className="flex-row gap-2">
                                                <TouchableOpacity
                                                    onPress={() => router.push({
                                                        pathname: '/(tabs)/suppliers/[id]/contracts/form',
                                                        params: { id: supplierId, contractId: contract.id } // Pass contractId as param
                                                    })}
                                                    className="bg-white border border-gray-200 p-2 rounded-lg"
                                                >
                                                    <Pencil size={16} color="#4B5563" />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => handleDelete(contract.id)}
                                                    className="bg-red-50 border border-red-100 p-2 rounded-lg"
                                                >
                                                    <Trash2 size={16} color="#EF4444" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}
