import { useState, useEffect } from 'react';
import { View, ScrollView, Modal, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useExchangeRates } from '../../../context/ExchangeRateContext';
import { ThemedText } from '../../../components/ui/ThemedText';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { DatePicker } from '../../../components/ui/DatePicker';
import PassengerForm from '../../../components/PassengerForm';
import { Plus, Trash2, Users, DollarSign, Calendar, Info } from 'lucide-react-native';
import type { Order, OrderItem, Passenger } from '../../../types';

export default function OrderFormScreen() {
    const router = useRouter();
    const { clients, agencies, offers, addOrder, updateOffer, rooms } = useData();
    const { user } = useAuth();
    const { t } = useLanguage();
    const { getLatestRate, getRateForDate } = useExchangeRates();

    const [clientId, setClientId] = useState('');
    const [selectedOfferId, setSelectedOfferId] = useState('');
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    // Items
    const [items, setItems] = useState<OrderItem[]>([
        { id: '1', description: '', quantity: 1, unitPrice: 0, amount: 0 }
    ]);

    // Passengers
    const [passengers, setPassengers] = useState<Passenger[]>([]);
    const [showPassengerForm, setShowPassengerForm] = useState(false);
    const [editingPassenger, setEditingPassenger] = useState<Passenger | undefined>(undefined);

    // Currency
    const [orderCurrency, setOrderCurrency] = useState<'DZD' | 'SAR' | 'EUR'>('DZD');
    const [exchangeRate, setExchangeRate] = useState<number>(1);

    // Commission
    const [commissionType, setCommissionType] = useState<'none' | 'tax' | 'reduction'>('none');
    const [commissionAmount, setCommissionAmount] = useState<string>('0');

    // Calculations
    const totalItemsAmount = items.reduce((sum, item) => sum + item.amount, 0);
    const totalPassengersAmount = passengers.reduce((sum, p) => sum + (p.finalPrice || 0), 0);
    const subtotal = totalItemsAmount + (orderCurrency === 'DZD' ? totalPassengersAmount : totalPassengersAmount / exchangeRate);

    const subtotalDZD = orderCurrency === 'DZD' ? subtotal : subtotal * exchangeRate;

    const commAmountNum = parseFloat(commissionAmount) || 0;
    const commissionDZD = commissionType === 'tax'
        ? commAmountNum
        : commissionType === 'reduction'
            ? -commAmountNum
            : 0;

    const grandTotalDZD = subtotalDZD + commissionDZD;

    // Effects
    useEffect(() => {
        if (orderCurrency !== 'DZD') {
            const rate = getRateForDate(orderDate, orderCurrency);
            if (rate) {
                setExchangeRate(rate);
            } else {
                const latestRate = getLatestRate(orderCurrency);
                setExchangeRate(latestRate);
            }
        } else {
            setExchangeRate(1);
        }
    }, [orderCurrency, orderDate]);

    // Handlers
    const handleAddItem = () => {
        setItems([
            ...items,
            { id: Math.random().toString(36).substring(2, 9), description: '', quantity: 1, unitPrice: 0, amount: 0 }
        ]);
    };

    const handleRemoveItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const handleItemChange = (id: string, field: keyof OrderItem, value: string | number) => {
        setItems(items.map(item => {
            if (item.id !== id) return item;

            const updates: Partial<OrderItem> = { [field]: value };

            if (field === 'quantity') {
                const qty = Number(value);
                updates.amount = qty * item.unitPrice;
            } else if (field === 'unitPrice') {
                const price = Number(value);
                updates.amount = item.quantity * price;
            }

            if (orderCurrency !== 'DZD' && updates.amount !== undefined) {
                updates.amountDZD = updates.amount * exchangeRate;
            }

            return { ...item, ...updates };
        }));
    };

    const handlePassengerSave = (passenger: Passenger) => {
        if (editingPassenger) {
            setPassengers(passengers.map(p => p.id === passenger.id ? passenger : p));
        } else {
            setPassengers([...passengers, passenger]);
        }
        setShowPassengerForm(false);
        setEditingPassenger(undefined);
    };

    const handleSubmit = async () => {
        if (!clientId) {
            Alert.alert(t('common.error'), t('common.required_fields'));
            return;
        }

        if (passengers.length === 0) {
            Alert.alert(t('common.error'), t('orders.no_passengers'));
            return;
        }

        // Check availability if an offer is selected
        const selectedOffer = selectedOfferId ? offers.find(o => o.id === selectedOfferId) : null;
        if (selectedOffer) {
            const availableSeats = selectedOffer.disponibilite || 0;
            if (availableSeats < passengers.length) {
                Alert.alert(t('common.attention'), `${t('orders.insufficient_seats')} ${availableSeats}`);
                return;
            }
        }

        const newOrder: Order = {
            id: Math.random().toString(36).substring(2, 9),
            clientId,
            passengers,
            hotels: [],
            commissionPerPassengerDZD: commissionType !== 'none' && passengers.length > 0
                ? commissionDZD / passengers.length
                : undefined,
            totalCommissionDZD: commissionType !== 'none' ? commissionDZD : undefined,
            orderCurrency,
            items,
            totalAmount: subtotal,
            totalAmountDZD: grandTotalDZD,
            exchangeRateUsed: orderCurrency !== 'DZD' ? exchangeRate : undefined,
            remainingBalanceDZD: grandTotalDZD,
            payments: [],
            status: 'Non payé',
            createdAt: new Date(orderDate).toISOString(),
            createdBy: user?.username || 'Mobile User',
            notes
        };

        try {
            await addOrder(newOrder);

            if (selectedOffer && selectedOffer.disponibilite !== undefined) {
                const updatedOffer = {
                    ...selectedOffer,
                    disponibilite: selectedOffer.disponibilite - passengers.length
                };
                await updateOffer(updatedOffer);
            }

            router.back();
        } catch (error: any) {
            console.error('Error creating order:', error);
            Alert.alert(t('common.error'), t('common.save_error'));
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 flex-row justify-between items-center">
                <ThemedText variant="h3">{t('orders.new_order')}</ThemedText>
                <TouchableOpacity onPress={() => router.back()}>
                    <ThemedText className="text-blue-600">{t('common.close')}</ThemedText>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4">
                {/* Client Selection (Simple List for MVP, should be Searchable) */}
                <View className="mb-6">
                    <ThemedText className="text-sm font-medium text-gray-700 mb-2">{t('clients.title')} *</ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                        {clients.map(client => (
                            <TouchableOpacity
                                key={client.id}
                                onPress={() => setClientId(client.id)}
                                className={`px-4 py-2 rounded-full border ${clientId === client.id
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'bg-white border-gray-200'
                                    }`}
                            >
                                <ThemedText className={clientId === client.id ? 'text-white' : 'text-gray-700'}>
                                    {client.fullName}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Offer Selection */}
                <View className="mb-6">
                    <ThemedText className="text-sm font-medium text-gray-700 mb-2">{t('offers.title')}</ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                        <TouchableOpacity
                            onPress={() => setSelectedOfferId('')}
                            className={`px-4 py-2 rounded-xl border ${!selectedOfferId
                                ? 'bg-blue-600 border-blue-600'
                                : 'bg-white border-gray-200'
                                }`}
                        >
                            <ThemedText className={!selectedOfferId ? 'text-white' : 'text-gray-700'}>
                                Aucun
                            </ThemedText>
                        </TouchableOpacity>
                        {offers.map(offer => (
                            <TouchableOpacity
                                key={offer.id}
                                onPress={() => setSelectedOfferId(offer.id)}
                                className={`px-4 py-2 rounded-xl border ${selectedOfferId === offer.id
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'bg-white border-gray-200'
                                    }`}
                            >
                                <ThemedText className={selectedOfferId === offer.id ? 'text-white' : 'text-gray-700'}>
                                    {offer.title}
                                </ThemedText>
                                <ThemedText className={`text-xs ${selectedOfferId === offer.id ? 'text-blue-200' : 'text-gray-500'}`}>
                                    {offer.destination}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Date & Currency */}
                <View className="flex-row gap-4 mb-6">
                    <View className="flex-1">
                        <DatePicker
                            label={t('orders.date')}
                            value={orderDate}
                            onChange={setOrderDate}
                            placeholder="Sélectionner une date"
                        />
                    </View>
                    <View className="flex-1">
                        <ThemedText className="text-sm font-medium text-gray-700 mb-2">{t('orders.currency')}</ThemedText>
                        <View className="flex-row gap-2">
                            {['DZD', 'EUR', 'SAR'].map(curr => (
                                <TouchableOpacity
                                    key={curr}
                                    onPress={() => setOrderCurrency(curr as any)}
                                    className={`flex-1 py-3 items-center rounded-lg border ${orderCurrency === curr
                                        ? 'bg-blue-50 border-blue-200'
                                        : 'bg-white border-gray-200'
                                        }`}
                                >
                                    <ThemedText className={`font-bold ${orderCurrency === curr ? 'text-blue-700' : 'text-gray-500'}`}>
                                        {curr}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Passengers Section */}
                <View className="mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <View className="flex-row justify-between items-center mb-4">
                        <ThemedText className="font-semibold text-gray-900 flex-row items-center">
                            {t('orders.passengers')} ({passengers.length})
                        </ThemedText>
                        <Button
                            onPress={() => {
                                setEditingPassenger(undefined);
                                setShowPassengerForm(true);
                            }}
                            size="sm"
                            title={t('common.add')}
                        />
                    </View>

                    {passengers.map((p, index) => (
                        <TouchableOpacity
                            key={p.id || index}
                            onPress={() => {
                                setEditingPassenger(p);
                                setShowPassengerForm(true);
                            }}
                            className="bg-gray-50 p-3 rounded-lg mb-2 flex-row justify-between items-center"
                        >
                            <View>
                                <ThemedText className="font-medium text-gray-800">{p.firstName} {p.lastName}</ThemedText>
                                <View className="flex-row gap-2">
                                    <ThemedText className="text-xs text-gray-500">{p.passportNumber}</ThemedText>
                                    {p.finalPrice ? (
                                        <ThemedText className="text-xs text-blue-600 font-bold">
                                            • {p.finalPrice.toLocaleString()} DZD
                                        </ThemedText>
                                    ) : null}
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => setPassengers(passengers.filter(pass => pass.id !== p.id))}>
                                <Trash2 size={18} color="#EF4444" />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))}

                    {passengers.length === 0 && (
                        <ThemedText className="text-center text-gray-400 py-4 italic">{t('orders.no_passengers')}</ThemedText>
                    )}
                </View>

                {/* Services/Items Section */}
                <View className="mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <View className="flex-row justify-between items-center mb-4">
                        <ThemedText className="font-semibold text-gray-900">{t('orders.services')}</ThemedText>
                        <Button
                            onPress={handleAddItem}
                            size="sm"
                            variant="outline"
                            title={t('common.add')}
                        />
                    </View>

                    {items.map((item, index) => (
                        <View key={item.id} className="mb-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                            <Input
                                placeholder={t('common.description')}
                                value={item.description}
                                onChangeText={(text) => handleItemChange(item.id, 'description', text)}
                                containerClassName="mb-2"
                            />
                            <View className="flex-row gap-2">
                                <View className="w-20">
                                    <Input
                                        placeholder={t('orders.quantity')}
                                        value={String(item.quantity)}
                                        keyboardType="numeric"
                                        onChangeText={(text) => handleItemChange(item.id, 'quantity', text)}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Input
                                        placeholder={t('orders.unit_price')}
                                        value={String(item.unitPrice)}
                                        keyboardType="numeric"
                                        onChangeText={(text) => handleItemChange(item.id, 'unitPrice', text)}
                                    />
                                </View>
                                {items.length > 1 && (
                                    <TouchableOpacity
                                        onPress={() => handleRemoveItem(item.id)}
                                        className="justify-center px-2"
                                    >
                                        <Trash2 size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <ThemedText className="text-right text-gray-500 text-sm mt-1">
                                {t('common.total')}: {item.amount.toLocaleString()} {orderCurrency}
                            </ThemedText>
                        </View>
                    ))}
                </View>

                {/* Tax & Deduction Section */}
                <View className="mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <ThemedText className="font-semibold text-gray-900 mb-4">Taxe & Déduction</ThemedText>
                    <View className="flex-row gap-2 mb-4">
                        {[
                            { id: 'none', label: 'Aucun', color: 'gray' },
                            { id: 'tax', label: 'Taxe (+)', color: 'red' },
                            { id: 'reduction', label: 'Déduction (-)', color: 'green' }
                        ].map(type => (
                            <TouchableOpacity
                                key={type.id}
                                onPress={() => setCommissionType(type.id as any)}
                                className={`flex-1 py-2 items-center rounded-lg border ${commissionType === type.id
                                    ? 'bg-blue-50 border-blue-200'
                                    : 'bg-white border-gray-200'
                                    }`}
                            >
                                <ThemedText className={`text-sm font-medium ${commissionType === type.id ? 'text-blue-700' : 'text-gray-600'}`}>
                                    {type.label}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {commissionType !== 'none' && (
                        <View>
                            <View className="flex-row items-center gap-2 mb-1">
                                <ThemedText className="text-sm font-medium text-gray-700">
                                    {commissionType === 'tax' ? 'Montant de la taxe (+)' : 'Montant de la déduction (-)'}
                                </ThemedText>
                            </View>
                            <Input
                                placeholder="0.00"
                                value={commissionAmount}
                                onChangeText={setCommissionAmount}
                                keyboardType="numeric"
                                startIcon={<ThemedText className="font-bold text-gray-400">{commissionType === 'tax' ? '+' : '-'}</ThemedText>}
                            />
                        </View>
                    )}
                </View>

                {/* Footer Totals */}
                <View className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-20">
                    <View className="flex-row justify-between mb-2">
                        <ThemedText className="text-gray-500">{t('orders.subtotal')}</ThemedText>
                        <ThemedText className="font-medium text-lg">{subtotal.toLocaleString()} {orderCurrency}</ThemedText>
                    </View>

                    {commissionType !== 'none' && (
                        <View className="flex-row justify-between mb-2">
                            <ThemedText className={commissionType === 'tax' ? 'text-red-500' : 'text-green-500'}>
                                {commissionType === 'tax' ? 'Taxe (+)' : 'Déduction (-)'}
                            </ThemedText>
                            <ThemedText className={`font-medium ${commissionType === 'tax' ? 'text-red-600' : 'text-green-600'}`}>
                                {commissionType === 'tax' ? '+' : '-'}{commAmountNum.toLocaleString()} DZD
                            </ThemedText>
                        </View>
                    )}

                    {orderCurrency !== 'DZD' && (
                        <View className="flex-row justify-between mb-2">
                            <ThemedText className="text-gray-400 text-xs">{t('orders.exchange_rate')}</ThemedText>
                            <ThemedText className="text-gray-400 text-xs">1 {orderCurrency} = {exchangeRate} DZD</ThemedText>
                        </View>
                    )}

                    <View className="flex-row justify-between pt-4 border-t border-gray-100">
                        <ThemedText className="font-bold text-xl text-gray-900">{t('orders.total')}</ThemedText>
                        <ThemedText className="font-bold text-xl text-blue-600">{grandTotalDZD.toLocaleString()} DZD</ThemedText>
                    </View>

                    <Button
                        title={t('orders.create')}
                        onPress={handleSubmit}
                        className="mt-6"
                        size="lg"
                    />
                </View>
            </ScrollView>

            <Modal
                visible={showPassengerForm}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View className="flex-1 pt-12 bg-white">
                    <View className="px-4 pb-4 border-b border-gray-100 flex-row justify-between items-center">
                        <ThemedText variant="h3">{editingPassenger ? t('passengers.edit') : t('passengers.new')}</ThemedText>
                        <TouchableOpacity onPress={() => setShowPassengerForm(false)}>
                            <ThemedText className="text-blue-600">{t('common.close')}</ThemedText>
                        </TouchableOpacity>
                    </View>
                    <PassengerForm
                        passenger={editingPassenger}
                        onSave={handlePassengerSave}
                        onCancel={() => setShowPassengerForm(false)}
                        rooms={rooms}
                        offerId={selectedOfferId}
                    />
                </View>
            </Modal>
        </View>
    );
}
