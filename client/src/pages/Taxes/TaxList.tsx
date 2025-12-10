import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Plus, Search, FileText, Edit, Trash2, Percent, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import Modal from '../../components/Modal';
import TaxForm from './TaxForm';
import type { Tax } from '../../types';

const TaxList = () => {
    const { taxes, deleteTax } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTax, setEditingTax] = useState<Tax | undefined>(undefined);

    const filteredTaxes = taxes.filter(tax =>
        tax.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tax.reference.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = (id: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette taxe ?')) {
            deleteTax(id);
        }
    };

    const handleEdit = (tax: Tax) => {
        setEditingTax(tax);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTax(undefined);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 font-display">Taxes & Frais</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    <span>Nouvelle Taxe</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher une taxe..."
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
                                <th className="px-6 py-4">Désignation</th>
                                <th className="hidden md:table-cell px-6 py-4">Applicable à</th>
                                <th className="px-6 py-4">Valeur</th>
                                <th className="px-6 py-4">Statut</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTaxes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                                <FileText size={24} />
                                            </div>
                                            <p className="font-medium">Aucune taxe trouvée</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTaxes.map((tax) => (
                                    <tr key={tax.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="hidden md:table-cell px-6 py-4 font-mono text-sm text-gray-600">
                                            {tax.reference}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                                    <FileText size={16} />
                                                </div>
                                                <span className="font-medium text-gray-900">{tax.name}</span>
                                            </div>
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-600">
                                            {tax.applicableTo}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 font-mono text-sm font-semibold text-gray-700">
                                                {tax.type === 'Percentage' ? <Percent size={16} /> : <DollarSign size={16} />}
                                                <span>
                                                    {tax.value}
                                                    {tax.type === 'Percentage' ? '%' : ' DZD'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {tax.active ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                                    <CheckCircle size={12} />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">
                                                    <XCircle size={12} />
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(tax)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(tax.id)}
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
                title={editingTax ? "Modifier Taxe" : "Nouvelle Taxe"}
            >
                <TaxForm onClose={handleCloseModal} initialData={editingTax} />
            </Modal>
        </div>
    );
};

export default TaxList;
