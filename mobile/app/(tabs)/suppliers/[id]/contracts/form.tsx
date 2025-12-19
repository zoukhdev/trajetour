import { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useData } from '../../../../../context/DataContext';
import { ThemedText } from '../../../../../components/ui/ThemedText';
import { Input } from '../../../../../components/ui/Input';
import { Button } from '../../../../../components/ui/Button';
import { ArrowLeft, Check, Calendar as CalendarIcon, DollarSign } from 'lucide-react-native';
import { supplierContractsAPI } from '../../../../../services/api';
import { ContractType, Currency } from '../../../../../types';
import { useExchangeRates } from '../../../../../context/ExchangeRateContext';

export default function SupplierContractForm() {
    const router = useRouter();
    const { id: supplierId, contractId } = useLocalSearchParams<{ id: string; contractId?: string }>();
    const { currentRates } = useExchangeRates();
    const { bankAccounts, refreshData } = useData(); // Needed for account selection, not used in UI yet to keep simple

    const isEditMode = !!contractId;
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode);

    // Form State
    const [contractType, setContractType] = useState<ContractType>('Rooms');
    const [currency, setCurrency] = useState<Currency>('DZD');
    const [exchangeRate, setExchangeRate] = useState('1.0');
    const [datePurchased, setDatePurchased] = useState(new Date().toISOString().split('T')[0]);
    const [accountId, setAccountId] = useState(''); // Optional: for transaction
    const [notes, setNotes] = useState('');

    // Abstract Details State (flexible for all types)
    const [details, setDetails] = useState<any>({});

    // Load existing contract if editing
    useEffect(() => {
        if (isEditMode && contractId) {
            const loadContract = async () => {
                try {
                    const contract = await supplierContractsAPI.getById(contractId);
                    setContractType(contract.contractType);
                    setCurrency(contract.paymentCurrency);
                    setExchangeRate(contract.exchangeRate.toString());
                    setDatePurchased(contract.datePurchased.split('T')[0]);
                    setDetails(contract.details || {});
                    setNotes(contract.notes || '');
                } catch (error) {
                    console.error('Failed to load contract:', error);
                    Alert.alert('Erreur', 'Impossible de charger le contrat');
                } finally {
                    setInitialLoading(false);
                }
            };
            loadContract();
        }
    }, [contractId, isEditMode]);

    // Auto-update exchange rate
    useEffect(() => {
        if (!isEditMode && currency === 'DZD') {
            setExchangeRate('1.0');
        } else if (!isEditMode && currentRates) {
            const rate = currency === 'EUR' ? currentRates.EUR :
                currency === 'USD' ? currentRates.USD :
                    currentRates.SAR;
            setExchangeRate(rate?.toString() || '1');
        }
    }, [currency, currentRates, isEditMode]);

    const calculateTotal = () => {
        // Simple calculation logic based on known fields
        const qty = parseFloat(details.quantity || details.ticketQuantity || '0') || 0;
        const price = parseFloat(details.pricePerPersonDzd || details.pricePerVisa || details.pricePerUnit || details.pricePerTicket || details.pricePerMeal || '0') || 0;
        return qty * price;
    };

    const totalValue = calculateTotal();
    const exchangeRateNum = parseFloat(exchangeRate) || 1;
    const totalValueDZD = totalValue * exchangeRateNum;

    const handleSubmit = async () => {
        if (totalValue <= 0) {
            Alert.alert('Erreur', 'La valeur du contrat est invalide (0)');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                contractType,
                datePurchased,
                contractValue: totalValue,
                paymentCurrency: currency,
                exchangeRate: exchangeRateNum,
                details: { ...details },
                notes,
                accountId: accountId || undefined
            };

            if (isEditMode && contractId) {
                await supplierContractsAPI.update(contractId, payload);
                Alert.alert('Succès', 'Contrat mis à jour');
            } else {
                await supplierContractsAPI.create(supplierId!, payload);
                Alert.alert('Succès', 'Contrat créé');
            }
            // Refresh data context if needed, but since we use API direct fetch in list, just go back
            router.back();
        } catch (error: any) {
            console.error('Save failed:', error);
            Alert.alert('Erreur', error.response?.data?.error || "Échec de l'enregistrement");
        } finally {
            setLoading(false);
        }
    };

    const updateDetail = (key: string, value: string) => {
        setDetails(prev => ({ ...prev, [key]: value }));
    };

    const renderDynamicFields = () => {
        switch (contractType) {
            case 'Rooms':
                return (
                    <View className="space-y-4">
                        <Input label="Hôtel" value={details.hotelName} onChangeText={v => updateDetail('hotelName', v)} placeholder="Nom de l'hôtel" />
                        <View className="flex-row gap-4">
                            <Input label="Ville" containerClassName="flex-1" value={details.cityIn} onChangeText={v => updateDetail('cityIn', v)} />
                            <Input label="Quantité (Chambres)" containerClassName="flex-1" keyboardType="numeric" value={details.quantity?.toString()} onChangeText={v => updateDetail('quantity', v)} />
                        </View>
                        <Input label="Prix par personne (en devise)" keyboardType="numeric" value={details.pricePerPersonDzd?.toString()} onChangeText={v => updateDetail('pricePerPersonDzd', v)} />
                        <View className="flex-row gap-4">
                            <Input label="Date Arrivée" containerClassName="flex-1" placeholder="YYYY-MM-DD" value={details.dateIn} onChangeText={v => updateDetail('dateIn', v)} />
                            <Input label="Date Départ" containerClassName="flex-1" placeholder="YYYY-MM-DD" value={details.dateOut} onChangeText={v => updateDetail('dateOut', v)} />
                        </View>
                    </View>
                );
            case 'Visa':
                return (
                    <View className="space-y-4">
                        <Input label="Pays" value={details.country} onChangeText={v => updateDetail('country', v)} placeholder="Ex: Arabie Saoudite" />
                        <View className="flex-row gap-4">
                            <Input label="Type Visa" containerClassName="flex-1" value={details.visaType} onChangeText={v => updateDetail('visaType', v)} placeholder="Omra, Tourisme..." />
                            <Input label="Quantité" containerClassName="flex-1" keyboardType="numeric" value={details.quantity?.toString()} onChangeText={v => updateDetail('quantity', v)} />
                        </View>
                        <Input label="Prix par Visa" keyboardType="numeric" value={details.pricePerVisa?.toString()} onChangeText={v => updateDetail('pricePerVisa', v)} />
                        <Input label="Délai (jours)" keyboardType="numeric" value={details.processingDays?.toString()} onChangeText={v => updateDetail('processingDays', v)} />
                    </View>
                );
            case 'Transportation':
                return (
                    <View className="space-y-4">
                        <Input label="Type Véhicule" value={details.vehicleType} onChangeText={v => updateDetail('vehicleType', v)} placeholder="Bus, Van..." />
                        <Input label="Itinéraire" value={details.route} onChangeText={v => updateDetail('route', v)} placeholder="Makkah -> Madinah" />
                        <View className="flex-row gap-4">
                            <Input label="Quantité" containerClassName="flex-1" keyboardType="numeric" value={details.quantity?.toString()} onChangeText={v => updateDetail('quantity', v)} />
                            <Input label="Prix Unitaire" containerClassName="flex-1" keyboardType="numeric" value={details.pricePerUnit?.toString()} onChangeText={v => updateDetail('pricePerUnit', v)} />
                        </View>
                        <View className="flex-row gap-4">
                            <Input label="Date Début" containerClassName="flex-1" placeholder="YYYY-MM-DD" value={details.dateFrom} onChangeText={v => updateDetail('dateFrom', v)} />
                            <Input label="Date Fin" containerClassName="flex-1" placeholder="YYYY-MM-DD" value={details.dateTo} onChangeText={v => updateDetail('dateTo', v)} />
                        </View>
                    </View>
                );
            // Add other cases as needed (Flight, Food) - simplified for brevity if not strictly requested but good to have rudimentary support
            default:
                return (
                    <View>
                        <ThemedText>Champs génériques</ThemedText>
                        <Input label="Quantité" keyboardType="numeric" value={details.quantity?.toString()} onChangeText={v => updateDetail('quantity', v)} />
                        <Input label="Description" value={details.description} onChangeText={v => updateDetail('description', v)} />
                    </View>
                );
        }
    };

    if (initialLoading) return <View className="flex-1 bg-white items-center justify-center"><ThemedText>Chargement...</ThemedText></View>;

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <View className="px-4 pt-4 pb-4 border-b border-gray-100 flex-row justify-between items-center bg-white shadow-sm z-10">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={() => router.back()}>
                        <ArrowLeft size={24} color="#374151" />
                    </TouchableOpacity>
                    <ThemedText variant="h3">{isEditMode ? 'Modifier' : 'Nouveau'} Contrat</ThemedText>
                </View>
                <TouchableOpacity onPress={handleSubmit} disabled={loading}>
                    <ThemedText className={`font-semibold text-lg ${loading ? 'text-gray-400' : 'text-purple-600'}`}>
                        {loading ? '...' : 'Sauvegarder'}
                    </ThemedText>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4">
                {/* Contract Type Selector */}
                <View className="mb-6">
                    <ThemedText className="text-sm font-medium text-gray-700 mb-2">Type de Contrat</ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                        {['Rooms', 'Visa', 'Transportation', 'Flight', 'Food'].map((type) => (
                            <TouchableOpacity
                                key={type}
                                onPress={() => { if (!isEditMode) { setContractType(type as ContractType); setDetails({}); } }}
                                className={`px-4 py-2 rounded-full border ${contractType === type ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200'
                                    } ${isEditMode ? 'opacity-50' : ''}`}
                                disabled={isEditMode}
                            >
                                <ThemedText className={`text-sm font-medium ${contractType === type ? 'text-purple-700' : 'text-gray-600'}`}>
                                    {type}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Date Purchased */}
                <View className="mb-4">
                    <Input
                        label="Date d'achat"
                        value={datePurchased}
                        onChangeText={setDatePurchased}
                        placeholder="YYYY-MM-DD"
                        startIcon={<CalendarIcon size={18} color="#9CA3AF" />}
                    />
                </View>

                {/* Dynamic Fields */}
                <View className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100">
                    <ThemedText className="font-bold text-gray-900 mb-4">Détails</ThemedText>
                    {renderDynamicFields()}
                </View>

                {/* Financials */}
                <View className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-100">
                    <ThemedText className="font-bold text-blue-900 mb-4">Financier</ThemedText>
                    <View className="flex-row gap-4 mb-4">
                        <View className="flex-1">
                            <ThemedText className="text-xs text-blue-700 mb-1">Devise</ThemedText>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                {['DZD', 'EUR', 'USD', 'SAR'].map((curr) => (
                                    <TouchableOpacity
                                        key={curr}
                                        onPress={() => setCurrency(curr as Currency)}
                                        className={`px-3 py-2 mr-2 rounded-lg border ${currency === curr ? 'bg-white border-blue-300' : 'border-transparent'}`}
                                    >
                                        <ThemedText className={`text-xs font-bold ${currency === curr ? 'text-blue-700' : 'text-blue-400'}`}>{curr}</ThemedText>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                        <View className="flex-1">
                            <Input
                                label="Taux de change"
                                value={exchangeRate}
                                onChangeText={setExchangeRate}
                                keyboardType="numeric"
                                containerClassName="bg-white border-blue-200"
                            />
                        </View>
                    </View>

                    <View className="flex-row justify-between items-center border-t border-blue-200 pt-3">
                        <ThemedText className="text-blue-700">Total estimé:</ThemedText>
                        <View className="items-end">
                            <ThemedText className="text-lg font-bold text-blue-900">
                                {totalValue.toLocaleString()} {currency}
                            </ThemedText>
                            {currency !== 'DZD' && (
                                <ThemedText className="text-sm text-blue-600">
                                    ≈ {totalValueDZD.toLocaleString()} DZD
                                </ThemedText>
                            )}
                        </View>
                    </View>
                </View>

                {/* Notes */}
                <Input
                    label="Notes"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                    containerClassName="h-24 mb-8"
                />

                <Button title={isEditMode ? "Mettre à jour" : "Créer le contrat"} onPress={handleSubmit} size="lg" className="mb-10" loading={loading} />
            </ScrollView>
        </View>
    );
}
