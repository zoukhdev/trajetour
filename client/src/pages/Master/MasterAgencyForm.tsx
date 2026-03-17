import { useState } from 'react';
import { masterAPI } from '../../services/api';
import { ShieldCheck, Loader2, AlertCircle, HelpCircle } from 'lucide-react';

interface Props {
    onSuccess: () => void;
    onCancel: () => void;
}

const MasterAgencyForm = ({ onSuccess, onCancel }: Props) => {
    const [formData, setFormData] = useState({
        name: '',
        subdomain: '',
        dbUrl: '',
        ownerEmail: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await masterAPI.registerAgency({
                ...formData,
                subdomain: formData.subdomain.toLowerCase().trim()
            });
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to register agency');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start gap-3">
                    <AlertCircle className="text-red-500 shrink-0" size={20} />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        Agency Business Name
                        <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all outline-none"
                        placeholder="e.g. Al Bayan Travel"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        Subdomain
                        <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            required
                            pattern="^[a-z0-0-]+$"
                            value={formData.subdomain}
                            onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase() })}
                            className="w-full pl-4 pr-24 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all outline-none"
                            placeholder="agency1"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none">
                            .trajetour.com
                        </div>
                    </div>
                </div>

                <div className="col-span-full space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        Dedicated Database URL (Neon)
                        <span className="text-red-500">*</span>
                        <div className="group relative">
                            <HelpCircle size={14} className="text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                Enter the specific Neon connection string for this agency.
                            </div>
                        </div>
                    </label>
                    <input
                        type="url"
                        required
                        value={formData.dbUrl}
                        onChange={(e) => setFormData({ ...formData, dbUrl: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all outline-none font-mono text-xs"
                        placeholder="postgresql://user:password@endpoint.neon.tech/dbname"
                    />
                </div>

                <div className="col-span-full space-y-2">
                    <label className="text-sm font-bold text-gray-700">Owner Email Address</label>
                    <input
                        type="email"
                        value={formData.ownerEmail}
                        onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all outline-none"
                        placeholder="agency@example.com"
                    />
                </div>
            </div>

            <div className="flex gap-4 pt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                    <span>{loading ? 'Registering...' : 'Complete Registration'}</span>
                </button>
            </div>
        </form>
    );
};

export default MasterAgencyForm;
