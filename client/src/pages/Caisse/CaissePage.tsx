import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Search, Wallet, Filter, Download, Plus, Minus, Settings, Trash2, Edit2 } from 'lucide-react';
import Modal from '../../components/Modal';
import TransactionForm from './TransactionForm';
import BankAccountForm from './BankAccountForm';
import type { BankAccount } from '../../types';

const CaissePage = () => {
    const { transactions, bankAccounts, deleteBankAccount } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // Modal state
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [transactionType, setTransactionType] = useState<'IN' | 'OUT'>('IN');

    // Account Modal State
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<BankAccount | undefined>(undefined);

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'ALL' || t.type === filterType;

        let matchesDate = true;
        if (dateRange.start) {
            matchesDate = matchesDate && new Date(t.date) >= new Date(dateRange.start);
        }
        if (dateRange.end) {
            matchesDate = matchesDate && new Date(t.date) <= new Date(dateRange.end);
        }

        return matchesSearch && matchesType && matchesDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const openTransactionModal = (type: 'IN' | 'OUT') => {
        setTransactionType(type);
        setIsTransactionModalOpen(true);
    };

    const handleEditAccount = (account: BankAccount) => {
        setEditingAccount(account);
        setIsAccountModalOpen(true);
    };

    const handleDeleteAccount = (id: string, name: string) => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer le compte \"${name}\" ?`)) {
            deleteBankAccount(id);
        }
    };

    const handleAddAccount = () => {
        setEditingAccount(undefined);
        setIsAccountModalOpen(true);
    };

    const handleExport = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800 font-display">Caisse & Trésorerie</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleAddAccount}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Settings size={20} />
                        <span>Nouveau Compte</span>
                    </button>
                    <button
                        onClick={() => openTransactionModal('IN')}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Plus size={20} />
                        <span>Entrée</span>
                    </button>
                    <button
                        onClick={() => openTransactionModal('OUT')}
                        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <Minus size={20} />
                        <span>Sortie</span>
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Download size={20} />
                        <span>Exporter</span>
                    </button>
                </div>
            </div>

            {/* Account Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {bankAccounts.map((account) => (
                    <div key={account.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between group relative overflow-hidden">
                        {/* Action Buttons (visible on hover) */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleEditAccount(account)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button
                                onClick={() => handleDeleteAccount(account.id, account.name)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-full"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="flex items-center gap-4 mb-4">
                            <div className={`p-3 rounded-lg ${account.currency === 'DZD' ? 'bg-green-50 text-green-600' :
                                account.currency === 'EUR' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                <Wallet size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">{account.name}</p>
                                <div className="flex items-baseline gap-1">
                                    <p className="text-2xl font-bold text-gray-900">
                                        {account.balance.toLocaleString()}
                                    </p>
                                    <span className="text-sm font-semibold text-gray-500">{account.currency}</span>
                                </div>
                            </div>
                        </div>
                        {account.accountNumber && (
                            <div className="text-xs text-gray-400 font-mono mt-2 bg-gray-50 p-2 rounded">
                                {account.accountNumber}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* NET Total Summary */}
            <div className="bg-gradient-to-br from-primary to-blue-700 p-6 rounded-xl shadow-lg text-white">
                <h3 className="text-lg font-semibold mb-4 opacity-90">Total NET (Toutes Devises)</h3>

                {/* Currency Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* DZD Accounts */}
                    {bankAccounts.filter(a => a.currency === 'DZD').length > 0 && (
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                            <p className="text-sm opacity-75 mb-1">🇩🇿 Comptes DZD</p>
                            <p className="text-2xl font-bold">
                                {bankAccounts
                                    .filter(a => a.currency === 'DZD')
                                    .reduce((sum, a) => sum + a.balance, 0)
                                    .toLocaleString()} DZD
                            </p>
                            <p className="text-xs opacity-60 mt-1">
                                {bankAccounts.filter(a => a.currency === 'DZD').length} compte(s)
                            </p>
                        </div>
                    )}

                    {/* SAR Accounts */}
                    {bankAccounts.filter(a => a.currency === 'SAR').length > 0 && (
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                            <p className="text-sm opacity-75 mb-1">🇸🇦 Comptes SAR</p>
                            <p className="text-xl font-bold">
                                {bankAccounts
                                    .filter(a => a.currency === 'SAR')
                                    .reduce((sum, a) => sum + a.balance, 0)
                                    .toLocaleString()} SAR
                            </p>
                            <p className="text-xs opacity-60">
                                ≈ {bankAccounts
                                    .filter(a => a.currency === 'SAR')
                                    .reduce((sum, a) => sum + (a.balanceDZD || 0), 0)
                                    .toLocaleString()} DZD
                            </p>
                        </div>
                    )}

                    {/* EUR Accounts */}
                    {bankAccounts.filter(a => a.currency === 'EUR').length > 0 && (
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                            <p className="text-sm opacity-75 mb-1">🇪🇺 Comptes EUR</p>
                            <p className="text-xl font-bold">
                                {bankAccounts
                                    .filter(a => a.currency === 'EUR')
                                    .reduce((sum, a) => sum + a.balance, 0)
                                    .toLocaleString()} EUR
                            </p>
                            <p className="text-xs opacity-60">
                                ≈ {bankAccounts
                                    .filter(a => a.currency === 'EUR')
                                    .reduce((sum, a) => sum + (a.balanceDZD || 0), 0)
                                    .toLocaleString()} DZD
                            </p>
                        </div>
                    )}
                </div>

                {/* Grand Total */}
                <div className="border-t border-white/20 pt-4">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">TOTAL NET (DZD)</span>
                        <span className="text-3xl font-bold">
                            {bankAccounts
                                .reduce((sum, account) => {
                                    if (account.currency === 'DZD') {
                                        return sum + account.balance;
                                    } else {
                                        return sum + (account.balanceDZD || 0);
                                    }
                                }, 0)
                                .toLocaleString()} DZD
                        </span>
                    </div>
                    <p className="text-xs opacity-60 mt-2 text-right">
                        Mis à jour en temps réel avec les taux de change
                    </p>
                </div>
            </div>


            {/* Filters & Actions */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                    >
                        <option value="ALL">Tout</option>
                        <option value="IN">Entrées</option>
                        <option value="OUT">Sorties</option>
                    </select>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <span className="text-sm text-gray-500 whitespace-nowrap">Période:</span>
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 text-sm">
                            <tr>
                                <th className="px-6 py-3 font-medium">Détail</th>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Description</th>
                                <th className="px-6 py-3 font-medium">Source</th>
                                <th className="px-6 py-3 font-medium">Type</th>
                                <th className="px-6 py-3 font-medium text-right">Montant</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                                <Filter size={24} />
                                            </div>
                                            <p className="font-medium">Aucune transaction trouvée</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                            #{t.id.substr(0, 8)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-sm">
                                            {new Date(t.date).toLocaleDateString()} {new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {t.description}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {t.source}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.type === 'IN'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {t.type === 'IN' ? 'Entrée' : 'Sortie'}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 font-mono text-sm font-medium text-right ${t.type === 'IN' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            <div className="flex flex-col items-end">
                                                <span>
                                                    {t.type === 'IN' ? '+' : '-'}{t.amount.toLocaleString()} {t.currency}
                                                </span>
                                                {t.currency !== 'DZD' && (
                                                    <span className="text-xs text-gray-500 font-normal">
                                                        ≈ {t.amountDZD?.toLocaleString()} DZD
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isTransactionModalOpen}
                onClose={() => setIsTransactionModalOpen(false)}
                title={transactionType === 'IN' ? "Alimentation Caisse" : "Retrait Caisse"}
            >
                <TransactionForm onClose={() => setIsTransactionModalOpen(false)} type={transactionType} />
            </Modal>

            <Modal
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                title={editingAccount ? "Modifier Compte" : "Nouveau Compte"}
            >
                <BankAccountForm
                    onClose={() => setIsAccountModalOpen(false)}
                    initialData={editingAccount}
                />
            </Modal>
        </div>
    );
};

export default CaissePage;
