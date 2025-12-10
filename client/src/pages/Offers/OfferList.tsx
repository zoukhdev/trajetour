import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Plus, Search, Tag, Calendar, MapPin, Trash2, Edit } from 'lucide-react';
import Modal from '../../components/Modal';
import OfferForm from './OfferForm';
import type { Offer } from '../../types';

const OfferList = () => {
    const { offers, deleteOffer } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState<Offer | undefined>(undefined);

    const filteredOffers = offers.filter(offer =>
        offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.destination.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = (id: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) {
            deleteOffer(id);
        }
    };

    const handleEdit = (offer: Offer) => {
        setEditingOffer(offer);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingOffer(undefined);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 font-display">Gestion des Offres</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    <span>Nouvelle Offre</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher une offre..."
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
                                <th className="px-6 py-4">Titre</th>
                                <th className="hidden md:table-cell px-6 py-4">Destination</th>
                                <th className="hidden lg:table-cell px-6 py-4">Type</th>
                                <th className="hidden lg:table-cell px-6 py-4">Dates</th>
                                <th className="px-6 py-4">Prix</th>
                                <th className="hidden xl:table-cell px-6 py-4">Disponibilité</th>
                                <th className="hidden md:table-cell px-6 py-4">Statut</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredOffers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                                <Tag size={24} />
                                            </div>
                                            <p className="font-medium">Aucune offre trouvée</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOffers.map((offer) => (
                                    <tr key={offer.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-gray-900">{offer.title}</td>
                                        <td className="hidden md:table-cell px-6 py-4 text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={14} className="text-gray-400" />
                                                <span>{offer.destination}</span>
                                            </div>
                                        </td>
                                        <td className="hidden lg:table-cell px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                {offer.type}
                                            </span>
                                        </td>
                                        <td className="hidden lg:table-cell px-6 py-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-400" />
                                                <span>{new Date(offer.startDate).toLocaleDateString()} - {new Date(offer.endDate).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm font-bold text-primary">
                                            {offer.price.toLocaleString()} DZD
                                        </td>
                                        <td className="hidden xl:table-cell px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                                {offer.disponibilite} {offer.disponibilite === 1 ? 'place' : 'places'}
                                            </span>
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${offer.status === 'Active'
                                                ? 'bg-green-50 text-green-700 border-green-100'
                                                : offer.status === 'Draft'
                                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
                                                    : 'bg-gray-50 text-gray-700 border-gray-100'
                                                }`}>
                                                {offer.status === 'Active' ? 'Active' : offer.status === 'Draft' ? 'Brouillon' : 'Archivée'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(offer)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(offer.id)}
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
                title={editingOffer ? "Modifier l'Offre" : "Nouvelle Offre"}
            >
                <OfferForm onClose={handleCloseModal} initialData={editingOffer} />
            </Modal>
        </div>
    );
};

export default OfferList;
