import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Plus, Search, Tag, Calendar, Edit, Trash2, Percent, DollarSign } from 'lucide-react';
import Modal from '../../components/Modal';
import DiscountForm from './DiscountForm';
import type { Discount } from '../../types';

const DiscountList = () => {
    const { discounts, deleteDiscount } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState<Discount | undefined>(undefined);

    const filteredDiscounts = discounts.filter(discount =>
        discount.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = (id: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette réduction ?')) {
            deleteDiscount(id);
        }
    };

    const handleEdit = (discount: Discount) => {
        setEditingDiscount(discount);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingDiscount(undefined);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 font-display">Réductions & Promotions</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    <span>Nouvelle Réduction</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher une réduction..."
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
                                <th className="hidden md:table-cell px-6 py-4">Référence</th>
                                <th className="px-6 py-4">Titre</th>
                                <th className="hidden md:table-cell px-6 py-4">Applicable à</th>
                                <th className="px-6 py-4">Type / Valeur</th>
                                <th className="hidden md:table-cell px-6 py-4">Période</th>
                                <th className="px-6 py-4">Statut</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredDiscounts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                                <Tag size={24} />
                                            </div>
                                            <p className="font-medium">Aucune réduction trouvée</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredDiscounts.map((discount) => (
                                    <tr key={discount.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="hidden md:table-cell px-6 py-4 font-mono text-sm text-gray-600">
                                            {discount.reference}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                                                    <Tag size={20} />
                                                </div>
                                                <span className="font-medium text-gray-900">{discount.title}</span>
                                            </div>
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-600">
                                            {discount.applicableTo}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 font-mono text-sm font-semibold text-gray-700">
                                                {discount.type === 'Percentage' ? <Percent size={16} /> : <DollarSign size={16} />}
                                                <span>
                                                    {discount.value}
                                                    {discount.type === 'Percentage' ? '%' : ' DZD'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-gray-400" />
                                                <span>
                                                    {new Date(discount.startDate).toLocaleDateString()} - {new Date(discount.endDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${discount.active
                                                ? 'bg-green-50 text-green-700 border-green-100'
                                                : 'bg-gray-50 text-gray-600 border-gray-100'
                                                }`}>
                                                {discount.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(discount)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(discount.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
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
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingDiscount ? "Modifier Réduction" : "Nouvelle Réduction"}
            >
                <DiscountForm onClose={handleCloseModal} initialData={editingDiscount} />
            </Modal>
        </div>
    );
};

export default DiscountList;
