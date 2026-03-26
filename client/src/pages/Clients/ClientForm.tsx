import { useState } from 'react';
import { useData } from '../../context/DataContext';
import type { Client } from '../../types';

interface ClientFormProps {
    onClose: () => void;
    initialData?: Client;
}

const ClientForm = ({ onClose, initialData }: ClientFormProps) => {
    const { addClient, updateClient } = useData();
    const [formData, setFormData] = useState<Partial<Client>>(
        initialData || {
            type: 'Individual',
            fullName: '',
            mobileNumber: '',
            passportNumber: '',
            passportExpiry: ''
        }
    );
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const clientData: Client = {
            id: initialData?.id || Math.random().toString(36).substr(2, 9),
            fullName: formData.fullName!,
            mobileNumber: formData.mobileNumber!,
            type: formData.type as 'Individual' | 'Entreprise',
            // Send undefined if empty string to be cleaner
            passportNumber: formData.passportNumber || undefined,
            passportExpiry: formData.passportExpiry || undefined
        };

        try {
            if (initialData) {
                await updateClient(clientData);
            } else {
                await addClient(clientData);
            }
            onClose();
        } catch (err: any) {
            console.error('Failed to save client:', err);
            // Show detailed validation error if available
            const errorMessage = err.response?.data?.error
                ? `${err.response.data.error}: ${JSON.stringify(err.response.data.details)}`
                : err.message || 'Impossible de sauvegarder le client.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type de Client</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="type"
                                value="Individual"
                                checked={formData.type === 'Individual'}
                                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                className="text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-gray-700">Individuel</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="type"
                                value="Entreprise"
                                checked={formData.type === 'Entreprise'}
                                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                className="text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-gray-700">Entreprise</span>
                        </label>
                    </div>
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom Complet</label>
                    <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="Ex: Mohamed Amine"
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de Mobile</label>
                    <input
                        type="tel"
                        required
                        value={formData.mobileNumber}
                        onChange={e => setFormData({ ...formData, mobileNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="Ex: 0550 12 34 56"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">N° Passeport</label>
                    <input
                        type="text"
                        value={formData.passportNumber}
                        onChange={e => setFormData({ ...formData, passportNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="Optionnel"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiration</label>
                    <input
                        type="date"
                        value={formData.passportExpiry}
                        onChange={e => setFormData({ ...formData, passportExpiry: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="text-sm">{error}</p>
                </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Enregistrement...
                        </>
                    ) : (
                        initialData ? 'Mettre à jour' : 'Créer Client'
                    )}
                </button>
            </div>
        </form>
    );
};

export default ClientForm;
