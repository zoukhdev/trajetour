import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Search, Plus, CreditCard, Calendar } from 'lucide-react';
import Modal from '../../components/Modal';
import ExpenseForm from './ExpenseForm';

const ExpenseList = () => {
    const { expenses } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const filteredExpenses = expenses.filter(expense =>
        expense.designation.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Charges & Dépenses</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    <span>Nouvelle Charge</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                            <tr>
                                <th className="px-6 py-4">Désignation</th>
                                <th className="hidden md:table-cell px-6 py-4">Catégorie</th>
                                <th className="hidden lg:table-cell px-6 py-4">Date</th>
                                <th className="hidden sm:table-cell px-6 py-4">Montant (Origine)</th>
                                <th className="px-6 py-4">Montant (DZD)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                                <CreditCard size={24} />
                                            </div>
                                            <p className="font-medium">Aucune dépense trouvée</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredExpenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                                                    <CreditCard size={20} />
                                                </div>
                                                <span className="font-semibold text-gray-900">{expense.designation}</span>
                                            </div>
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="hidden lg:table-cell px-6 py-4 text-gray-600 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-400" />
                                                <span>{new Date(expense.date).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="hidden sm:table-cell px-6 py-4 font-mono text-sm text-gray-600">
                                            {expense.amount.toLocaleString()} {expense.currency}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm font-bold text-gray-900">
                                            {expense.amountDZD.toLocaleString()} DZD
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Nouvelle Dépense"
            >
                <ExpenseForm onClose={() => setIsModalOpen(false)} />
            </Modal>
        </div>
    );
};

export default ExpenseList;
