import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import type { Discount } from '../../types';

interface DiscountFormProps {
    onClose: () => void;
    initialData?: Discount;
}

const DiscountForm = ({ onClose, initialData }: DiscountFormProps) => {
    const { addDiscount, updateDiscount } = useData();

    const [formData, setFormData] = useState<Partial<Discount>>({
        title: '',
        type: 'Percentage',
        value: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        active: true
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (initialData) {
            updateDiscount({ ...initialData, ...formData } as Discount);
        } else {
            const newDiscount: Discount = {
                id: Math.random().toString(36).substr(2, 9),
                title: formData.title!,
                type: formData.type as 'Percentage' | 'Amount',
                value: Number(formData.value),
                reference: formData.reference || `REF-${Math.floor(Math.random() * 1000)}`,
                applicableTo: formData.applicableTo as any || 'Omra',
                startDate: formData.startDate!,
                endDate: formData.endDate!,
                active: formData.active!
            };
            addDiscount(newDiscount);
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre de la réduction</label>
                <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="Ex: Soldes d'été"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                        <option value="Percentage">Pourcentage (%)</option>
                        <option value="Amount">Montant Fixe (DZD)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valeur</label>
                    <input
                        type="number"
                        required
                        min="0"
                        step={formData.type === 'Percentage' ? '1' : '100'}
                        max={formData.type === 'Percentage' ? '100' : undefined}
                        value={formData.value}
                        onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Référence</label>
                    <input
                        type="text"
                        required
                        value={formData.reference || ''}
                        onChange={e => setFormData({ ...formData, reference: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="Ex: REF-001"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Applicable à</label>
                    <select
                        value={formData.applicableTo || 'Omra'}
                        onChange={e => setFormData({ ...formData, applicableTo: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                        <option value="Omra">Omra</option>
                        <option value="Billetterie">Billetterie</option>
                        <option value="Réservation d'hôtel">Réservation d'hôtel</option>
                        <option value="Voyage Organisé">Voyage Organisé</option>
                        <option value="Traitement dossier de visa">Traitement dossier de visa</option>
                        <option value="Assurance de voyage">Assurance de voyage</option>
                        <option value="Rendez-vous visa">Rendez-vous visa</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                    <input
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                    <input
                        type="date"
                        required
                        value={formData.endDate}
                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                    Réduction active
                </label>
            </div>

            <div className="flex justify-end gap-3 pt-4">
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
                    {initialData ? 'Modifier' : 'Ajouter'}
                </button>
            </div>
        </form >
    );
};

export default DiscountForm;
