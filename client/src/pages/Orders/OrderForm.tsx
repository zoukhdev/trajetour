import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useExchangeRates } from '../../context/ExchangeRateContext';
import { Plus, Trash2, Users, DollarSign, TrendingUp } from 'lucide-react';
import PassengerForm from '../../components/PassengerForm';
import PassengerList from '../../components/PassengerList';
import Modal from '../../components/Modal';
import type { Order, OrderItem, Passenger } from '../../types';

interface OrderFormProps {
    onClose: () => void;
}

const OrderForm = ({ onClose }: OrderFormProps) => {
    const { clients, agencies, offers, addOrder, updateOffer } = useData();
    const { user } = useAuth();
    const { getLatestRate, getRateForDate } = useExchangeRates();

    const [clientId, setClientId] = useState('');
    const [agencyId, setAgencyId] = useState('');
    const [selectedOfferId, setSelectedOfferId] = useState('');
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<OrderItem[]>([
        { id: '1', description: '', quantity: 1, unitPrice: 0, amount: 0 }
    ]);

    // Passengers (multi-passenger support)
    const [passengers, setPassengers] = useState<Passenger[]>([]);
    const [showPassengerForm, setShowPassengerForm] = useState(false);
    const [editingPassenger, setEditingPassenger] = useState<Passenger | undefined>(undefined);

    // Multi-currency support
    const [orderCurrency, setOrderCurrency] = useState<'DZD' | 'SAR' | 'EUR'>('DZD');
    const [exchangeRate, setExchangeRate] = useState<number>(1);

    // Commission system (manual Tax or Reduction)
    const [commissionType, setCommissionType] = useState<'none' | 'tax' | 'reduction'>('none');
    const [commissionAmount, setCommissionAmount] = useState<number>(0);

    const selectedOffer = offers.find(offer => offer.id === selectedOfferId);
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    const totalAmountDZD = orderCurrency === 'DZD' ? totalAmount : totalAmount * exchangeRate;

    // Calculate commission in DZD (positive for tax, negative for reduction)
    const commissionDZD = commissionType === 'tax'
        ? commissionAmount
        : commissionType === 'reduction'
            ? -commissionAmount
            : 0;

    // Grand total with commission
    const grandTotalDZD = totalAmountDZD + commissionDZD;

    // Update exchange rate when currency or date changes
    useEffect(() => {
        if (orderCurrency !== 'DZD') {
            const rate = getRateForDate(orderDate, orderCurrency);
            if (rate) {
                setExchangeRate(rate);
            } else {
                // Fallback to latest rate if no rate for specific date
                const latestRate = getLatestRate(orderCurrency);
                setExchangeRate(latestRate);
            }
        } else {
            setExchangeRate(1);
        }
    }, [orderCurrency, orderDate, getRateForDate, getLatestRate]);

    const handleAddItem = () => {
        setItems([
            ...items,
            { id: Math.random().toString(36).substr(2, 9), description: '', quantity: 1, unitPrice: 0, amount: 0 }
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

            // Calculate DZD equivalent for foreign currency
            if (orderCurrency !== 'DZD' && updates.amount !== undefined) {
                updates.amountDZD = updates.amount * exchangeRate;
            }

            return { ...item, ...updates };
        }));
    };

    const handleOfferChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const offerId = e.target.value;
        setSelectedOfferId(offerId);
        setSelectedRoomId(''); // Reset room selection when offer changes

        // Clear existing items when offer changes
        setItems([{ id: '1', description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
    };

    const handleRoomChange = (roomId: string) => {
        setSelectedRoomId(roomId);

        if (selectedOffer && roomId) {
            const selectedRoom = selectedOffer.roomPricing?.find(room => room.id === roomId);
            if (selectedRoom) {
                // Auto-populate the first order item with offer and room details
                const newItem: OrderItem = {
                    id: '1',
                    description: `${selectedOffer.title} - ${selectedRoom.description}`,
                    quantity: 1,
                    unitPrice: selectedRoom.price,
                    amount: selectedRoom.price
                };
                setItems([newItem]);
            }
        }
    };

    const handleAddPassenger = () => {
        setEditingPassenger(undefined);
        setShowPassengerForm(true);
    };

    const handleEditPassenger = (passenger: Passenger) => {
        setEditingPassenger(passenger);
        setShowPassengerForm(true);
    };

    const handleSavePassenger = (passenger: Passenger) => {
        if (editingPassenger) {
            // Update existing passenger
            setPassengers(passengers.map(p => p.id === passenger.id ? passenger : p));
        } else {
            // Add new passenger
            setPassengers([...passengers, passenger]);
        }
        setShowPassengerForm(false);
        setEditingPassenger(undefined);
    };

    const handleDeletePassenger = (passengerId: string) => {
        setPassengers(passengers.filter(p => p.id !== passengerId));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId || !selectedOfferId) {
            alert('Veuillez sélectionner un client et une offre');
            return;
        }

        if (passengers.length === 0) {
            alert('Veuillez ajouter au moins un passager');
            return;
        }

        // Check offer availability
        const selectedOffer = offers.find(o => o.id === selectedOfferId);
        if (selectedOffer) {
            const availableSeats = selectedOffer.disponibilite || 0;
            if (availableSeats < passengers.length) {
                alert(`Disponibilité insuffisante! Il reste seulement ${availableSeats} place(s) disponible(s), mais vous avez ${passengers.length} passager(s).`);
                return;
            }
        }

        const newOrder: Order = {
            id: Math.random().toString(36).substr(2, 9),
            clientId,
            agencyId: agencyId || undefined,
            passengers,
            hotels: [],

            // Commission fields (per passenger or manual)
            commissionPerPassengerDZD: commissionType !== 'none' && passengers.length > 0
                ? commissionDZD / passengers.length
                : undefined,
            totalCommissionDZD: commissionType !== 'none' ? commissionDZD : undefined,

            orderCurrency,
            items,
            totalAmount,
            totalAmountDZD: grandTotalDZD, // Include commission
            exchangeRateUsed: orderCurrency !== 'DZD' ? exchangeRate : undefined,

            // FIFO: Initialize remaining balance = total amount
            remainingBalanceDZD: grandTotalDZD,

            payments: [],
            status: 'Non payé',
            createdAt: new Date(orderDate).toISOString(),
            createdBy: user?.username || 'Unknown',
            notes
        };

        // Add order
        addOrder(newOrder);

        // Deduct availability from offer
        if (selectedOffer && selectedOffer.disponibilite !== undefined) {
            const updatedOffer = {
                ...selectedOffer,
                disponibilite: selectedOffer.disponibilite - passengers.length
            };
            updateOffer(updatedOffer);
        }

        onClose();
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                        <select
                            required
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        >
                            <option value="">Sélectionner un client</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>{client.fullName}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Agence / Rabbateur (Optionnel)</label>
                        <select
                            value={agencyId}
                            onChange={(e) => setAgencyId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        >
                            <option value="">Aucune</option>
                            {agencies.map(agency => (
                                <option key={agency.id} value={agency.id}>{agency.name} ({agency.type})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date de la commande</label>
                        <input
                            type="date"
                            required
                            value={orderDate}
                            onChange={(e) => setOrderDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                    </div>

                    {/* Currency Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <DollarSign size={14} className="inline mr-1" />
                            Devise de la commande
                        </label>
                        <select
                            value={orderCurrency}
                            onChange={(e) => setOrderCurrency(e.target.value as 'DZD' | 'SAR' | 'EUR')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        >
                            <option value="DZD">🇩🇿 DZD (Dinar Algérien)</option>
                            <option value="SAR">🇸🇦 SAR (Riyal Saoudien)</option>
                            <option value="EUR">🇪🇺 EUR (Euro)</option>
                        </select>
                    </div>
                </div>

                {/* Exchange Rate Display */}
                {orderCurrency !== 'DZD' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <TrendingUp size={20} className="text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-gray-600">Taux de change utilis\u00e9</p>
                                <p className="text-lg font-bold text-gray-900">
                                    1 {orderCurrency} = {exchangeRate.toFixed(2)} DZD
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Date: {orderDate ? new Date(orderDate).toLocaleDateString('fr-FR') : '-'}
                                </p>
                            </div>
                            {totalAmount > 0 && (
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Montant en DZD</p>
                                    <p className="text-lg font-bold text-blue-600">
                                        {totalAmountDZD.toLocaleString()} DZD
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Offre *</label>
                        <select
                            required
                            value={selectedOfferId}
                            onChange={handleOfferChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        >
                            <option value="">Sélectionner une offre</option>
                            {offers.map(offer => (
                                <option key={offer.id} value={offer.id}>
                                    {offer.title} - {offer.destination}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Room Configuration Selection */}
                {selectedOffer && selectedOffer.roomPricing && selectedOffer.roomPricing.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3">Sélectionner une configuration de chambre</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {selectedOffer.roomPricing.map(room => (
                                <label
                                    key={room.id}
                                    className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${selectedRoomId === room.id
                                        ? 'border-primary bg-primary/5 shadow-sm'
                                        : 'border-gray-200 bg-white hover:border-primary/50 hover:bg-gray-50'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="room"
                                        value={room.id}
                                        checked={selectedRoomId === room.id}
                                        onChange={() => handleRoomChange(room.id)}
                                        className="w-4 h-4 text-primary focus:ring-primary"
                                    />
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900 text-sm">{room.description}</div>
                                        <div className="text-primary font-semibold text-sm">{room.price.toLocaleString()} DZD</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Passengers Section */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Users size={20} className="text-primary" />
                            Passagers
                            {passengers.length > 0 && (
                                <span className="text-sm font-normal text-gray-500">({passengers.length})</span>
                            )}
                        </h3>
                        <button
                            type="button"
                            onClick={handleAddPassenger}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                            <Plus size={16} />
                            Ajouter un passager
                        </button>
                    </div>

                    <PassengerList
                        passengers={passengers}
                        onEdit={handleEditPassenger}
                        onDelete={handleDeletePassenger}
                    />
                </div>

                {/* Commission / Tax / Reduction Section */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Commission / Taxe / Réduction</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Commission Type Selector */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type
                            </label>
                            <select
                                value={commissionType}
                                onChange={(e) => {
                                    setCommissionType(e.target.value as 'none' | 'tax' | 'reduction');
                                    if (e.target.value === 'none') {
                                        setCommissionAmount(0);
                                    }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            >
                                <option value="none">Aucun</option>
                                <option value="tax">Taxe (Supplément)</option>
                                <option value="reduction">Réduction (Rabais)</option>
                            </select>
                        </div>

                        {/* Tax Field - Only shown when 'tax' is selected */}
                        {commissionType === 'tax' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Montant de la taxe (DZD)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={commissionAmount}
                                    onChange={(e) => setCommissionAmount(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-green-300 bg-green-50 rounded-lg focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                    placeholder="0.00"
                                />
                                <p className="text-xs text-green-600 mt-1">
                                    + {commissionAmount.toLocaleString()} DZD au total
                                </p>
                            </div>
                        )}

                        {/* Reduction Field - Only shown when 'reduction' is selected */}
                        {commissionType === 'reduction' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Montant de la réduction (DZD)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={commissionAmount}
                                    onChange={(e) => setCommissionAmount(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-red-300 bg-red-50 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                                    placeholder="0.00"
                                />
                                <p className="text-xs text-red-600 mt-1">
                                    - {commissionAmount.toLocaleString()} DZD du total
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Commission Summary */}
                    {commissionType !== 'none' && commissionAmount > 0 && (
                        <div className={`mt-4 p-3 rounded-lg border ${commissionType === 'tax'
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                            }`}>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">
                                    {commissionType === 'tax' ? 'Taxe appliquée' : 'Réduction appliquée'}:
                                </span>
                                <span className={`text-lg font-bold ${commissionType === 'tax' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {commissionType === 'tax' ? '+' : '-'} {commissionAmount.toLocaleString()} DZD
                                </span>
                            </div>
                            {passengers.length > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                    Par passager: {(commissionDZD / passengers.length).toFixed(2)} DZD
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-700">Articles / Services</h3>
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="text-sm text-primary hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                            <Plus size={16} />
                            Ajouter
                        </button>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        {items.map((item) => (
                            <div key={item.id} className="flex gap-3 items-start flex-wrap md:flex-nowrap">
                                <div className="flex-1 min-w-[200px]">
                                    <input
                                        type="text"
                                        required
                                        placeholder="Description (ex: Omra Decembre)"
                                        value={item.description}
                                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                                    />
                                </div>
                                <div className="w-20">
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        placeholder="Qté"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-center"
                                    />
                                </div>
                                <div className="w-32">
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        placeholder="Prix Unit."
                                        value={item.unitPrice || ''}
                                        onChange={(e) => handleItemChange(item.id, 'unitPrice', Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-right"
                                    />
                                </div>
                                <div className="w-32 pt-2 text-right font-medium text-gray-700 text-sm">
                                    {item.amount.toLocaleString()} DZD
                                </div>
                                {items.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Totals Breakdown */}
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                        {/* Subtotal */}
                        <div className="flex justify-end items-center gap-4">
                            <span className="text-gray-600 font-medium">Sous-total:</span>
                            <div className="text-right">
                                <div className="text-lg font-semibold text-gray-700">
                                    {totalAmount.toLocaleString()} {orderCurrency}
                                </div>
                                {orderCurrency !== 'DZD' && (
                                    <div className="text-xs text-gray-500">
                                        ≈ {totalAmountDZD.toLocaleString()} DZD
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Commission/Tax/Reduction */}
                        {commissionType !== 'none' && commissionAmount > 0 && (
                            <div className="flex justify-end items-center gap-4">
                                <span className="text-gray-600 font-medium">
                                    {commissionType === 'tax' ? 'Taxe:' : 'Réduction:'}
                                </span>
                                <div className={`text-lg font-semibold ${commissionType === 'tax' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {commissionType === 'tax' ? '+' : '-'} {commissionAmount.toLocaleString()} DZD
                                </div>
                            </div>
                        )}

                        {/* Grand Total */}
                        <div className="flex justify-end items-center gap-4 pt-2 border-t border-gray-200">
                            <span className="text-gray-900 font-bold">Total Final:</span>
                            <div className="text-2xl font-bold text-primary">
                                {grandTotalDZD.toLocaleString()} DZD
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Remarques</label>
                    <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="Notes supplémentaires..."
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Créer Commande
                    </button>
                </div>
            </form>

            {/* Passenger Form Modal - Moved outside form to prevent nesting */}
            {showPassengerForm && (
                <Modal
                    isOpen={showPassengerForm}
                    onClose={() => {
                        setShowPassengerForm(false);
                        setEditingPassenger(undefined);
                    }}
                    title={editingPassenger ? 'Modifier le passager' : 'Ajouter un passager'}
                >
                    <PassengerForm
                        passenger={editingPassenger}
                        onSave={handleSavePassenger}
                        onCancel={() => {
                            setShowPassengerForm(false);
                            setEditingPassenger(undefined);
                        }}
                    />
                </Modal>
            )}
        </>
    );
};

export default OrderForm;
