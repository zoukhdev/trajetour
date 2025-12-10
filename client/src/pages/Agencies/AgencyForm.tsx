import { useState } from 'react';
import { useData } from '../../context/DataContext';
import type { Agency } from '../../types';

interface AgencyFormProps {
    onClose: () => void;
    initialData?: Agency;
}

const AgencyForm = ({ onClose, initialData }: AgencyFormProps) => {
    const { addAgency } = useData();
    const [formData, setFormData] = useState<Partial<Agency>>(
        initialData || {
            type: 'Agence',
            name: '',
            creditStart: 0,
            currentCredit: 0
        }
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const agencyData: Agency = {
            id: initialData?.id || Math.random().toString(36).substr(2, 9),
            name: formData.name!,
            type: formData.type as 'Agence' | 'Rabbateur',
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            logo: formData.logo,
            invoicePrefix: formData.invoicePrefix,
            invoiceFooter: formData.invoiceFooter,
            subscription: formData.subscription as any,
            creditStart: Number(formData.creditStart),
            currentCredit: Number(formData.creditStart) // Initial credit is current credit at start
        };

        // Note: Update logic for agencies is not explicitly in DataContext yet, but addAgency works for new ones.
        // For simplicity in this phase, we'll just add. Real app would need updateAgency.
        addAgency(agencyData);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="type"
                                value="Agence"
                                checked={formData.type === 'Agence'}
                                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                className="text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-gray-700">Agence</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="type"
                                value="Rabbateur"
                                checked={formData.type === 'Rabbateur'}
                                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                className="text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-gray-700">Rabbateur</span>
                        </label>
                    </div>
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="Nom de l'agence ou du rabbateur"
                    />
                </div>

                <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input
                        type="tel"
                        value={formData.phone || ''}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="Ex: 0550..."
                    />
                </div>

                <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        value={formData.email || ''}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="email@example.com"
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <input
                        type="text"
                        value={formData.address || ''}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="Adresse complète"
                    />
                </div>

                <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                    <div className="flex items-center gap-2">
                        {formData.logo && (
                            <img src={formData.logo} alt="Logo" className="w-8 h-8 rounded object-cover" />
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        setFormData(prev => ({ ...prev, logo: reader.result as string }));
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>
                </div>

                <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Préfixe Facture</label>
                    <input
                        type="text"
                        value={formData.invoicePrefix || ''}
                        onChange={e => setFormData({ ...formData, invoicePrefix: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="Ex: INV-"
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pied de page Facture</label>
                    <textarea
                        value={formData.invoiceFooter || ''}
                        onChange={e => setFormData({ ...formData, invoiceFooter: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="Texte à afficher en bas des factures..."
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Abonnement</label>
                    <select
                        value={formData.subscription || 'Standard'}
                        onChange={e => setFormData({ ...formData, subscription: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                        <option value="Standard">Standard</option>
                        <option value="Premium">Premium</option>
                        <option value="Gold">Gold</option>
                    </select>
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Crédit de Départ (DZD)</label>
                    <input
                        type="number"
                        required
                        value={formData.creditStart}
                        onChange={e => setFormData({ ...formData, creditStart: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Créer
                </button>
            </div>
        </form>
    );
};

export default AgencyForm;
