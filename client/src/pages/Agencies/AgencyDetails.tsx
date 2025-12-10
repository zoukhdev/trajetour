import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Briefcase, Phone, Mail, MapPin, Edit, ArrowLeft, TrendingUp, CreditCard, DollarSign } from 'lucide-react';
import { useState } from 'react';
import Modal from '../../components/Modal';
import AgencyForm from './AgencyForm';

const AgencyDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { agencies, orders } = useData();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const agency = agencies.find(a => a.id === id);
    const agencyOrders = orders.filter(o => o.agencyId === id);

    if (!agency) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <p className="text-gray-500 text-lg mb-4">Agence introuvable</p>
                <button
                    onClick={() => navigate('/agencies')}
                    className="text-primary hover:underline"
                >
                    Retour à la liste
                </button>
            </div>
        );
    }

    // Calculations
    const totalOrders = agencyOrders.length;
    const totalRevenue = agencyOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalPaid = agencyOrders.reduce((sum, order) =>
        sum + order.payments.reduce((pSum, p) => pSum + p.amountDZD, 0), 0
    );
    const remainingBalance = totalRevenue - totalPaid;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/agencies')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    {agency.logo ? (
                        <img
                            src={agency.logo}
                            alt={agency.name}
                            className="w-16 h-16 rounded-lg object-cover border border-gray-100"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                            <Briefcase size={32} />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            {agency.name}
                            <span className={`text-sm font-normal px-2.5 py-0.5 rounded-full border ${agency.type === 'Agence' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                                }`}>
                                {agency.type}
                            </span>
                            {agency.subscription && (
                                <span className="text-sm font-normal px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                                    {agency.subscription}
                                </span>
                            )}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-1">
                            {agency.phone && (
                                <div className="flex items-center gap-1">
                                    <Phone size={14} />
                                    <span>{agency.phone}</span>
                                </div>
                            )}
                            {agency.email && (
                                <div className="flex items-center gap-1">
                                    <Mail size={14} />
                                    <span>{agency.email}</span>
                                </div>
                            )}
                            {agency.address && (
                                <div className="flex items-center gap-1">
                                    <MapPin size={14} />
                                    <span>{agency.address}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Edit size={18} />
                        <span>Modifier</span>
                    </button>
                    <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        <CreditCard size={18} />
                        <span>Nouveau Versment</span>
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Briefcase size={20} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500">Total Commandes</p>
                    <h3 className="text-2xl font-bold text-gray-900">{totalOrders}</h3>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500">Chiffre d'Affaires</p>
                    <h3 className="text-2xl font-bold text-gray-900">{totalRevenue.toLocaleString()} DZD</h3>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                            <CreditCard size={20} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500">Total Payé</p>
                    <h3 className="text-2xl font-bold text-gray-900">{totalPaid.toLocaleString()} DZD</h3>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500">Reste à Payer</p>
                    <h3 className="text-2xl font-bold text-red-600">{remainingBalance.toLocaleString()} DZD</h3>
                </div>
            </div>

            {/* Additional Info Grid */}
            {(agency.invoicePrefix || agency.invoiceFooter) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurations Facture</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {agency.invoicePrefix && (
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Préfixe</label>
                                <p className="font-mono bg-gray-50 px-3 py-2 rounded-lg">{agency.invoicePrefix}</p>
                            </div>
                        )}
                        {agency.invoiceFooter && (
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Pied de page</label>
                                <p className="text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">{agency.invoiceFooter}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Orders Summary Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="font-semibold text-gray-800">Historique des Commandes</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                            <tr>
                                <th className="px-6 py-4">Réf</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4">Payé</th>
                                <th className="px-6 py-4">Reste</th>
                                <th className="px-6 py-4">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {agencyOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Aucune commande trouvée pour cette agence.
                                    </td>
                                </tr>
                            ) : (
                                agencyOrders.map((order) => {
                                    const orderPaid = order.payments.reduce((acc, p) => acc + p.amountDZD, 0);
                                    const orderRemaining = order.totalAmount - orderPaid;
                                    return (
                                        <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-6 py-4 font-mono text-sm text-gray-600">
                                                #{order.id.slice(0, 8)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {order.totalAmount.toLocaleString()} DZD
                                            </td>
                                            <td className="px-6 py-4 text-green-600">
                                                {orderPaid.toLocaleString()} DZD
                                            </td>
                                            <td className="px-6 py-4 text-red-600 font-medium">
                                                {orderRemaining.toLocaleString()} DZD
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
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Modifier Agence"
            >
                <AgencyForm onClose={() => setIsEditModalOpen(false)} initialData={agency} />
            </Modal>
        </div>
    );
};

export default AgencyDetails;
