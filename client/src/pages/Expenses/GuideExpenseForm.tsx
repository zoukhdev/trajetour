import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import type { GuideExpense } from '../../types';

interface GuideExpenseFormProps {
    onClose: () => void;
    initialData?: GuideExpense;
}

const GuideExpenseForm = ({ onClose, initialData }: GuideExpenseFormProps) => {
    const { addGuideExpense, updateGuideExpense } = useData();

    const [formData, setFormData] = useState<Partial<GuideExpense>>({
        guideName: '',
        tripName: '',
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        category: 'Autre',
        status: 'En attente'
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (initialData) {
            updateGuideExpense({ ...initialData, ...formData } as GuideExpense);
        } else {
            const newExpense: GuideExpense = {
                id: Math.random().toString(36).substr(2, 9),
                ...formData as Omit<GuideExpense, 'id'>
            };
            addGuideExpense(newExpense);
        }
        onClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'amount' ? Number(value) : value
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Guide</label>
                <input
                    type="text"
                    name="guideName"
                    required
                    value={formData.guideName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="Ex: Mohamed Ahmed"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Voyage / Excursion</label>
                <input
                    type="text"
                    name="tripName"
                    required
                    value={formData.tripName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="Ex: Omra Janvier 2024"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                        <option value="Transport">Transport</option>
                        <option value="Hébergement">Hébergement</option>
                        <option value="Repas">Repas</option>
                        <option value="Autre">Autre</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                        type="date"
                        name="date"
                        required
                        value={formData.date}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant (DZD)</label>
                    <input
                        type="number"
                        name="amount"
                        required
                        min="0"
                        value={formData.amount}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                        <option value="Payé">Payé</option>
                        <option value="En attente">En attente</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="Détails supplémentaires..."
                />
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
        </form>
    );
};

export default GuideExpenseForm;
