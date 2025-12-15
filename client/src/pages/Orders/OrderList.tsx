import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Search, Plus, ShoppingCart, Calendar, Printer, Eye } from 'lucide-react';
import Modal from '../../components/Modal';
import OrderForm from './OrderForm';
import { generateInvoice } from '../../services/pdfGenerator';
import type { Order } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { Link } from 'react-router-dom';

const OrderList = () => {
    const { orders, clients, agencies } = useData();
    const { t, language } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);

    // Helper to get client name
    const getClientName = (clientId: string) => {
        return clients.find(c => c.id === clientId)?.fullName || 'Client Inconnu';
    };

    const handlePrint = async (order: Order) => {
        const client = clients.find(c => c.id === order.clientId);
        const agency = order.agencyId ? agencies.find(a => a.id === order.agencyId) : undefined;

        if (client) {
            setIsGeneratingPdf(order.id);
            try {
                await generateInvoice(order, client, agency, language);
            } catch (error) {
                console.error("Error generating PDF:", error);
                alert("Erreur lors de la génération du PDF");
            } finally {
                setIsGeneratingPdf(null);
            }
        }
    };

    const filteredOrders = orders.filter(order => {
        const clientName = getClientName(order.clientId).toLowerCase();
        return clientName.includes(searchTerm.toLowerCase());
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 font-display">{t('orders.title')}</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    <span>{t('orders.new_order')}</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher par client..."
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
                                <th className="px-6 py-4">Client</th>
                                <th className="hidden md:table-cell px-6 py-4">Date</th>
                                <th className="px-6 py-4">Montant Total</th>
                                <th className="hidden lg:table-cell px-6 py-4">Payé</th>
                                <th className="hidden lg:table-cell px-6 py-4">Reste</th>
                                <th className="px-6 py-4">État</th>
                                <th className="hidden xl:table-cell px-6 py-4">Créé par</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                                <ShoppingCart size={24} />
                                            </div>
                                            <p className="font-medium">Aucune commande trouvée</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => {
                                    const paidAmount = (order.payments || []).reduce((sum, p) => sum + (p.amountDZD || 0), 0);
                                    const total = order.totalAmountDZD || order.totalAmount || 0;
                                    const remainingAmount = total - paidAmount;

                                    return (
                                        <tr key={order.id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                                        <ShoppingCart size={20} />
                                                    </div>
                                                    <div>
                                                        <span className="block font-semibold text-gray-900">{getClientName(order.clientId)}</span>
                                                        <span className="text-xs text-gray-500">CMD-{order.reference || (order.id || '').substring(0, 6).toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hidden md:table-cell px-6 py-4 text-gray-600 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-gray-400" />
                                                    <span>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-sm font-bold text-gray-900">
                                                {(total || 0).toLocaleString()} DZD
                                            </td>
                                            <td className="hidden lg:table-cell px-6 py-4 font-mono text-sm text-green-600 font-medium">
                                                {(paidAmount || 0).toLocaleString()} DZD
                                            </td>
                                            <td className="hidden lg:table-cell px-6 py-4 font-mono text-sm text-red-600 font-medium">
                                                {remainingAmount > 0 ? `${remainingAmount.toLocaleString()} DZD` : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${order.status === 'Payé'
                                                    ? 'bg-green-50 text-green-700 border-green-100'
                                                    : order.status === 'Partiel'
                                                        ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
                                                        : 'bg-red-50 text-red-700 border-red-100'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="hidden xl:table-cell px-6 py-4 text-gray-600 text-sm">
                                                <span className="inline-flex items-center">
                                                    {order.createdBy || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handlePrint(order)}
                                                        disabled={isGeneratingPdf === order.id}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Imprimer Facture"
                                                    >
                                                        {isGeneratingPdf === order.id ? (
                                                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                        ) : (
                                                            <Printer size={18} />
                                                        )}
                                                    </button>
                                                    <Link
                                                        to={`/orders/${order.id}`}
                                                        className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                                                    >
                                                        <Eye size={18} />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={t('orders.new_order')}
            >
                <OrderForm onClose={() => setIsModalOpen(false)} />
            </Modal>
        </div>
    );
};

export default OrderList;
