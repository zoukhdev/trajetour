import { useState } from 'react';
import { useData } from '../../context/DataContext';
import type { Transaction } from '../../types';

interface TransactionFormProps {
    onClose: () => void;
    type: 'IN' | 'OUT';
}

const TransactionForm = ({ onClose, type }: TransactionFormProps) => {
    const { addTransaction, bankAccounts, updateBankAccount } = useData();
    const [formData, setFormData] = useState({
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        accountId: bankAccounts.find(a => a.isDefault)?.id || bankAccounts[0]?.id || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newTransaction: Transaction = {
            id: Math.random().toString(36).substr(2, 9),
            type: type,
            amount: Number(formData.amount),
            amountDZD: Number(formData.amount),
            currency: 'DZD',
            source: type === 'IN' ? 'Order' : 'Expense',
            referenceId: 'MANUAL',
            description: formData.description,
            date: formData.date,
            accountId: formData.accountId
        };

        // Update the selected account balance
        const selectedAccount = bankAccounts.find(acc => acc.id === formData.accountId);
        if (selectedAccount) {
            const newBalance = type === 'IN'
                ? selectedAccount.balance + Number(formData.amount)
                : selectedAccount.balance - Number(formData.amount);

            updateBankAccount({
                ...selectedAccount,
                balance: newBalance
            });
        }

        addTransaction(newTransaction);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {type === 'IN' ? "Motif de l'entrée" : "Motif de la sortie"}
                </label>
                <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder={type === 'IN' ? "Ex: Virement reçu..." : "Ex: Achat fournitures..."}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compte {type === 'IN' ? 'créditeur' : 'débiteur'}
                </label>
                <select
                    required
                    value={formData.accountId}
                    onChange={e => setFormData({ ...formData, accountId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                >
                    <option value="">Sélectionner un compte</option>
                    {bankAccounts.map(account => (
                        <option key={account.id} value={account.id}>
                            {account.name} ({account.balance.toLocaleString()} {account.currency})
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (DZD)</label>
                <input
                    type="number"
                    required
                    min="1"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
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
                    className={`px-4 py-2 text-white rounded-lg transition-colors ${type === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                        }`}
                >
                    {type === 'IN' ? 'Ajouter Entrée' : 'Ajouter Sortie'}
                </button>
            </div>
        </form>
    );
};

export default TransactionForm;
