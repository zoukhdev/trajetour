import { useState, useEffect } from 'react';
import type { BankAccount } from '../../types';
import { useData } from '../../context/DataContext';

interface BankAccountFormProps {
    onClose: () => void;
    initialData?: BankAccount;
}

const BankAccountForm = ({ onClose, initialData }: BankAccountFormProps) => {
    const { addBankAccount, updateBankAccount } = useData();

    const [formData, setFormData] = useState<Partial<BankAccount>>({
        name: '',
        type: 'Caisse',
        currency: 'DZD',
        accountNumber: '',
        icon: 'Wallet',
        balance: 0,
        isDefault: false
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const accountData: BankAccount = {
            id: initialData?.id || Math.random().toString(36).substr(2, 9),
            name: formData.name!,
            type: formData.type as 'Caisse' | 'Bank',
            currency: formData.currency as 'DZD' | 'EUR' | 'USD',
            accountNumber: formData.accountNumber,
            icon: formData.icon,
            balance: formData.balance || 0,
            isDefault: formData.isDefault
        };

        if (initialData) {
            updateBankAccount(accountData);
        } else {
            addBankAccount(accountData);
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Compte</label>
                <input
                    type="text"
                    name="name"
                    required
                    placeholder="Ex: Caisse Principale, CPA..."
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                        <option value="Caisse">Caisse (Physique)</option>
                        <option value="Bank">Banque (Virtuel)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                    <select
                        name="currency"
                        value={formData.currency}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                        <option value="DZD">DZD</option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                    </select>
                </div>
            </div>

            {formData.type === 'Bank' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de Compte (RIP/RIB)</label>
                    <input
                        type="text"
                        name="accountNumber"
                        placeholder="Ex: 004..."
                        value={formData.accountNumber}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Solde Initial</label>
                <input
                    type="number"
                    name="balance"
                    min="0"
                    value={formData.balance}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Attention : La modification du solde ici n'ajoute pas de transaction. Utilisez "Alimentation" pour les mouvements.
                </p>
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {initialData ? 'Enregistrer' : 'Créer le Compte'}
                </button>
            </div>
        </form>
    );
};

export default BankAccountForm;
