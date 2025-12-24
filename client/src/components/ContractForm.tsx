import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { ContractType, Currency, SupplierContract } from '../types';
import { RoomsFields } from './ContractFields/RoomsFields';
import { VisaFields } from './ContractFields/VisaFields';
import { TransportationFields } from './ContractFields/TransportationFields';
import { FlightFields } from './ContractFields/FlightFields';
import { FoodFields } from './ContractFields/FoodFields';
import { useExchangeRates } from '../context/ExchangeRateContext';
import { useData } from '../context/DataContext';

interface ContractFormProps {
    supplierId: string;
    contract?: SupplierContract;
    onSuccess: () => void;
    onCancel: () => void;
}

export const ContractForm: React.FC<ContractFormProps> = ({ supplierId, contract, onSuccess, onCancel }) => {
    const { currentRates } = useExchangeRates();
    const { bankAccounts } = useData();

    const [contractType, setContractType] = useState<ContractType>(contract?.contractType || 'Rooms');
    const [currency, setCurrency] = useState<Currency>(contract?.paymentCurrency || 'DZD');
    const [exchangeRate, setExchangeRate] = useState(contract?.exchangeRate || 1.0);
    const [datePurchased, setDatePurchased] = useState(contract?.datePurchased || new Date().toISOString().split('T')[0]);
    const [details, setDetails] = useState<any>(contract?.details || {});
    const [notes, setNotes] = useState(contract?.notes || '');
    const [accountId, setAccountId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Auto-update exchange rate when currency changes
    React.useEffect(() => {
        if (currency === 'DZD') {
            setExchangeRate(1.0);
        } else if (currentRates) {
            const rate = currency === 'EUR' ? currentRates.EUR :
                currency === 'USD' ? currentRates.USD :
                    currentRates.SAR;
            setExchangeRate(rate);
        }
    }, [currency, currentRates]);

    const calculateContractValue = () => {
        switch (contractType) {
            case 'Rooms':
                return details.rooms?.reduce((sum: number, room: any) => sum + (room.price || 0), 0) || 0;
            case 'Visa':
                return (details.quantity || 0) * (details.pricePerVisa || 0);
            case 'Transportation':
                return (details.quantity || 0) * (details.pricePerUnit || 0);
            case 'Flight':
                return (details.ticketQuantity || 0) * (details.pricePerTicket || 0);
            case 'Food':
                return (details.quantity || 0) * (details.pricePerMeal || 0);
            default:
                return 0;
        }
    };

    const contractValue = calculateContractValue();
    const contractValueDzd = contractValue * exchangeRate;

    const renderDynamicFields = () => {
        switch (contractType) {
            case 'Rooms':
                return <RoomsFields details={details} onChange={setDetails} />;
            case 'Visa':
                return <VisaFields details={details} onChange={setDetails} />;
            case 'Transportation':
                return <TransportationFields details={details} onChange={setDetails} />;
            case 'Flight':
                return <FlightFields details={details} onChange={setDetails} />;
            case 'Food':
                return <FoodFields details={details} onChange={setDetails} />;
            default:
                return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const contractData = {
                contractType,
                datePurchased,
                contractValue,
                paymentCurrency: currency,
                exchangeRate,
                details,
                notes,
                accountId: accountId || undefined
            };

            if (contract) {
                // Update existing contract
                await fetch(`/api/supplier-contracts/${contract.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(contractData)
                });
            } else {
                // Create new contract
                await fetch(`/api/suppliers/${supplierId}/contracts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(contractData)
                });
            }

            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to save contract');
        } finally {
            setLoading(false);
        }
    };

    const handleContractTypeChange = (newType: ContractType) => {
        setContractType(newType);
        setDetails({}); // Reset details when changing type
    };

    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                    <h2 className="text-xl font-semibold">
                        {contract ? 'Modifier' : 'Nouveau'} Contrat Fournisseur
                    </h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    {/* Contract Type & Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type de contrat *
                            </label>
                            <select
                                value={contractType}
                                onChange={(e) => handleContractTypeChange(e.target.value as ContractType)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                                disabled={!!contract}
                            >
                                <option value="Rooms">Chambres/Hôtels</option>
                                <option value="Visa">Visas</option>
                                <option value="Transportation">Transport</option>
                                <option value="Flight">Vols</option>
                                <option value="Food">Restauration</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date d'achat *
                            </label>
                            <input
                                type="date"
                                value={datePurchased}
                                onChange={(e) => setDatePurchased(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>
                    </div>

                    {/* Dynamic Fields Based on Contract Type */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Détails du contrats</h3>
                        {renderDynamicFields()}
                    </div>

                    {/* Currency & Exchange Rate */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Devise *
                            </label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value as Currency)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                                required
                            >
                                <option value="DZD">DZD</option>
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                                <option value="SAR">SAR</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Taux de change
                            </label>
                            <input
                                type="number"
                                step="0.0001"
                                value={exchangeRate}
                                onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                                disabled={currency === 'DZD'}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Valeur totale ({currency})
                            </label>
                            <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 font-semibold">
                                {contractValue.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>

                    {/* Total in DZD */}
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">
                                Valeur totale en DZD:
                            </span>
                            <span className="text-2xl font-bold text-blue-600">
                                {contractValueDzd.toLocaleString('fr-DZ', { minimumFractionDigits: 2 })} DA
                            </span>
                        </div>
                    </div>

                    {/* Account Selection for Transaction */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Compte bancaire (pour créer une transaction automatiquement)
                        </label>
                        <select
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="">Aucun (ne pas créer de transaction)</option>
                            {bankAccounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.name} ({account.currency})
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            Si sélectionné, une transaction de sortie sera automatiquement créée
                        </p>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            rows={3}
                            placeholder="Notes additionnelles sur le contrat..."
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            disabled={loading}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            disabled={loading || contractValue === 0}
                        >
                            {loading ? 'Enregistrement...' : contract ? 'Mettre à jour' : 'Créer le contrat'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};
