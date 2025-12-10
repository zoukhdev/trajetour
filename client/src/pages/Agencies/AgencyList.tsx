import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Search, Plus, Briefcase, User } from 'lucide-react';
import Modal from '../../components/Modal';
import AgencyForm from './AgencyForm';

const AgencyList = () => {
    const { agencies } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const filteredAgencies = agencies.filter(agency =>
        agency.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Agences & Rabbateurs</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    <span>Nouveau</span>
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
                                <th className="px-6 py-4">Nom</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Crédit de Départ</th>
                                <th className="px-6 py-4">Crédit Actuel</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredAgencies.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                                <Briefcase size={24} />
                                            </div>
                                            <p className="font-medium">Aucune agence trouvée</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAgencies.map((agency) => (
                                    <tr key={agency.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                                                    {agency.type === 'Agence' ? <Briefcase size={20} /> : <User size={20} />}
                                                </div>
                                                <span className="font-semibold text-gray-900">{agency.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${agency.type === 'Agence'
                                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                : 'bg-orange-50 text-orange-700 border-orange-100'
                                                }`}>
                                                {agency.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 font-mono text-sm">
                                            {agency.creditStart.toLocaleString()} DZD
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm font-bold text-gray-900">
                                            {agency.currentCredit.toLocaleString()} DZD
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <a
                                                href={`/agencies/${agency.id}`}
                                                className="text-gray-400 hover:text-blue-600 transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-lg hover:bg-blue-50 flex items-center justify-center">
                                                    <Search size={18} />
                                                </div>
                                            </a>
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
                title="Nouvelle Agence / Rabbateur"
            >
                <AgencyForm onClose={() => setIsModalOpen(false)} />
            </Modal>
        </div>
    );
};

export default AgencyList;
