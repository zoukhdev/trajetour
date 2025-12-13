import React from 'react';

interface FoodFieldsProps {
    details: {
        mealType?: 'Breakfast' | 'Lunch' | 'Dinner' | 'Catering' | 'All Inclusive';
        quantity?: number;
        pricePerMeal?: number;
        dateFrom?: string;
        dateTo?: string;
        location?: string;
        dietaryNotes?: string;
    };
    onChange: (details: any) => void;
}

export const FoodFields: React.FC<FoodFieldsProps> = ({ details, onChange }) => {
    const handleChange = (field: string, value: any) => {
        onChange({ ...details, [field]: value });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de repas *
                </label>
                <select
                    value={details.mealType || ''}
                    onChange={(e) => handleChange('mealType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                >
                    <option value="">Sélectionnez...</option>
                    <option value="Breakfast">Petit-déjeuner</option>
                    <option value="Lunch">Déjeuner</option>
                    <option value="Dinner">Dîner</option>
                    <option value="Catering">Catering</option>
                    <option value="All Inclusive">Tout inclus</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de repas *
                </label>
                <input
                    type="number"
                    min="1"
                    value={details.quantity || ''}
                    onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix par repas *
                </label>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={details.pricePerMeal || ''}
                    onChange={(e) => handleChange('pricePerMeal', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lieu *
                </label>
                <input
                    type="text"
                    value={details.location || ''}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Hotel, Restaurant..."
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début *
                </label>
                <input
                    type="date"
                    value={details.dateFrom || ''}
                    onChange={(e) => handleChange('dateFrom', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin *
                </label>
                <input
                    type="date"
                    value={details.dateTo || ''}
                    onChange={(e) => handleChange('dateTo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                />
            </div>

            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes diététiques
                </label>
                <textarea
                    value={details.dietaryNotes || ''}
                    onChange={(e) => handleChange('dietaryNotes', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={2}
                    placeholder="Halal, Végétarien, Sans gluten..."
                />
            </div>
        </div>
    );
};
