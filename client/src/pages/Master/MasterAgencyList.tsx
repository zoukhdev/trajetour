import { useState, useEffect } from 'react';
import { masterAPI } from '../../services/api';
import { Plus, Globe, Database as DatabaseIcon, Mail, ShieldCheck, XCircle } from 'lucide-react';
import Modal from '../../components/Modal';
import MasterAgencyForm from './MasterAgencyForm';

interface MasterAgency {
    id: string;
    name: string;
    subdomain: string;
    db_url: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
    owner_email: string;
    created_at: string;
}

const MasterAgencyList = () => {
    const [agencies, setAgencies] = useState<MasterAgency[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchAgencies = async () => {
        try {
            setLoading(true);
            const data = await masterAPI.getAgencies();
            setAgencies(data);
        } catch (error) {
            console.error('Failed to fetch platform agencies:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgencies();
    }, []);

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Platform Agencies</h1>
                    <p className="text-gray-500 mt-1">Manage all agencies and their dedicated databases across the platform.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                >
                    <Plus size={20} />
                    <span>Add New Agency</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse h-48"></div>
                    ))
                ) : agencies.length === 0 ? (
                    <div className="col-span-full py-20 bg-white rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500">
                        <Globe size={48} className="text-gray-300 mb-4" />
                        <p className="text-xl font-medium">No agencies registered yet</p>
                        <p className="text-sm">Click the button above to register the first agency.</p>
                    </div>
                ) : (
                    agencies.map((agency) => (
                        <div key={agency.id} className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                            {/* Background decoration */}
                            <div className="absolute -right-4 -top-4 text-gray-50 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                                <Globe size={120} />
                            </div>

                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Globe size={24} />
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 ${
                                    agency.status === 'ACTIVE' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                    {agency.status === 'ACTIVE' ? <ShieldCheck size={14} /> : <XCircle size={14} />}
                                    {agency.status}
                                </span>
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase truncate">{agency.name}</h3>
                                <p className="text-blue-600 font-medium text-sm mt-0.5">{agency.subdomain}.trajetour.com</p>
                            </div>

                            <div className="mt-6 space-y-3 relative z-10">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <DatabaseIcon size={16} className="text-gray-400" />
                                    <span className="truncate flex-1 font-mono text-[10px] bg-gray-50 p-1 rounded">
                                        Neon DB Connected
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Mail size={16} className="text-gray-400" />
                                    <span className="truncate">{agency.owner_email || 'No email provided'}</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                                <span>Created</span>
                                <span>{new Date(agency.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Register New Platform Agency"
            >
                <MasterAgencyForm onSuccess={() => {
                    setIsModalOpen(false);
                    fetchAgencies();
                }} onCancel={() => setIsModalOpen(false)} />
            </Modal>
        </div>
    );
};

export default MasterAgencyList;
