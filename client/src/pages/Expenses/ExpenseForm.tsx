import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import type { Expense, Currency, ExpenseCategory } from '../../types';

interface ExpenseFormProps {
    onClose: () => void;
}

const ExpenseForm = ({ onClose }: ExpenseFormProps) => {
    const { addExpense, bankAccounts } = useData();
    const { user } = useAuth();

    const [designation, setDesignation] = useState('');
    const [category, setCategory] = useState<ExpenseCategory>('Autre');
    const [amount, setAmount] = useState<number>(0);
    const [currency, setCurrency] = useState<Currency>('DZD');
    const [exchangeRate, setExchangeRate] = useState<number>(1);
    const [accountId, setAccountId] = useState<string>('');

    // Auto-set default exchange rates (mock)
    useEffect(() => {
        switch (currency) {
            case 'EUR': setExchangeRate(245); break;
            case 'USD': setExchangeRate(220); break;
            case 'SAR': setExchangeRate(55); break;
            default: setExchangeRate(1);
        }
    }, [currency]);

    const amountDZD = amount * exchangeRate;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newExpense: Expense = {
            id: Math.random().toString(36).substr(2, 9),
            designation,
            category,
            amount,
            currency,
            exchangeRate,
            amountDZD,
            date: new Date().toISOString(),
            createdBy: user?.username || 'Unknown',
            accountId: accountId || undefined // Add linking
        };

        addExpense(newExpense);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* ... designation ... */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Désignation</label>
                <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="Ex: Loyer, Salaire..."
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* ... category & currency ... */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                        <option value="Bureau">Bureau</option>
                        <option value="Salaire">Salaire</option>
                        <option value="Transport">Transport</option>
                        <option value="Autre">Autre</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                    <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as Currency)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                        <option value="DZD">DZD (Dinar)</option>
                        <option value="EUR">EUR (Euro)</option>
                        <option value="USD">USD (Dollar)</option>
                        <option value="SAR">SAR (Riyal)</option>
                    </select>
                </div>
            </div>

            {/* ... amount & rate ... */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
                    <input
                        type="number"
                        required
                        min="0"
                        value={amount || ''}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                </div>

                {currency !== 'DZD' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Taux de Change</label>
                        <input
                            type="number"
                            required
                            min="0"
                            value={exchangeRate}
                            onChange={(e) => setExchangeRate(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                    </div>
                )}
            </div>

            {/* Account Selector */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Compte de Débit</label>
                <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                    <option value="">-- Aucun (Non comptabilisé) --</option>
                    {bankAccounts.map(account => (
                        <option key={account.id} value={account.id}>
                            {account.name} ({account.currency})
                        </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Sélectionnez un compte pour déduire le montant automatiquement.</p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                <span className="text-sm text-gray-600">Montant en DZD:</span>
                <span className="font-bold text-gray-900">{amountDZD.toLocaleString()} DZD</span>
            </div>

            <div className="flex justify-end gap-3 mt-6">
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
                    Enregistrer
                </button>
            </div>
        </form>
    );
};

export default ExpenseForm;
