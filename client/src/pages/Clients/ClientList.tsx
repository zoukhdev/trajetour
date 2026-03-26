import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Search, Plus, User, Building2, FileText } from 'lucide-react';
import Modal from '../../components/Modal';
import ClientForm from './ClientForm';
import type { Client } from '../../types';

const ClientList = () => {
    const { clients } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);

    const filteredClients = (clients || []).filter(client => {
        if (!client) return false;
        return (client?.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (client?.mobileNumber || '').includes(searchTerm);
    });

    const handleEdit = (client: Client) => {
        setEditingClient(client);
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingClient(undefined);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Réservations</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    <span>Nouvelle Réservation</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher par nom ou téléphone..."
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
                                <th className="hidden md:table-cell px-6 py-4">Type</th>
                                <th className="hidden sm:table-cell px-6 py-4">Téléphone</th>
                                <th className="hidden lg:table-cell px-6 py-4">Passeport</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                                <User size={24} />
                                            </div>
                                            <p className="font-medium">Aucun client trouvé</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredClients.map((client) => (
                                    <tr key={client.id || Math.random()} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${client.type === 'Entreprise' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                                                    }`}>
                                                    {client.type === 'Entreprise' ? <Building2 size={20} /> : <User size={20} />}
                                                </div>
                                                <div>
                                                    <span className="block font-semibold text-gray-900">{client.fullName || 'Sans Nom'}</span>
                                                    <span className="text-xs text-gray-500">ID: {(client.id || '').substr(0, 6)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden md:table-cell px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${client.type === 'Entreprise'
                                                ? 'bg-purple-50 text-purple-700 border-purple-100'
                                                : 'bg-blue-50 text-blue-700 border-blue-100'
                                                }`}>
                                                {client.type || 'Indéfini'}
                                            </span>
                                        </td>
                                        <td className="hidden sm:table-cell px-6 py-4 text-gray-600 font-mono text-sm">
                                            {client.mobileNumber}
                                        </td>
                                        <td className="hidden lg:table-cell px-6 py-4 text-gray-600 text-sm">
                                            {client.passportNumber ? (
                                                <div className="flex items-center gap-2">
                                                    <FileText size={14} className="text-gray-400" />
                                                    <span className="font-medium text-gray-700">{client.passportNumber}</span>
                                                    {client.passportExpiry && (
                                                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                                            {client.passportExpiry}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic text-xs">Non renseigné</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleEdit(client)}
                                                className="text-gray-400 hover:text-primary font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                Modifier
                                            </button>
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
                onClose={handleClose}
                title={editingClient ? "Modifier Réservation" : "Nouvelle Réservation"}
            >
                <ClientForm onClose={handleClose} initialData={editingClient} />
            </Modal>
        </div>
    );
};

export default ClientList;
