import React from 'react';

interface RoomsFieldsProps {
    details: {
        quantity?: number;
        pricePerPersonDzd?: number;
        dateIn?: string;
        dateOut?: string;
        cityIn?: string;
        hotelName?: string;
        roomType?: 'Single' | 'Double' | 'Triple' | 'Quad';
        mealsIncluded?: boolean;
    };
    onChange: (details: any) => void;
}

export const RoomsFields: React.FC<RoomsFieldsProps> = ({ details, onChange }) => {
    const handleChange = (field: string, value: any) => {
        onChange({ ...details, [field]: value });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de chambres *
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
                    Prix par personne (DZD) *
                </label>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={details.pricePerPersonDzd || ''}
                    onChange={(e) => handleChange('pricePerPersonDzd', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville *
                </label>
                <input
                    type="text"
                    value={details.cityIn || ''}
                    onChange={(e) => handleChange('cityIn', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Mecca, Medina..."
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'hôtel *
                </label>
                <input
                    type="text"
                    value={details.hotelName || ''}
                    onChange={(e) => handleChange('hotelName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Al-Safwa Hotel"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date d'arrivée *
                </label>
                <input
                    type="date"
                    value={details.dateIn || ''}
                    onChange={(e) => handleChange('dateIn', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de départ *
                </label>
                <input
                    type="date"
                    value={details.dateOut || ''}
                    onChange={(e) => handleChange('dateOut', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de chambre
                </label>
                <select
                    value={details.roomType || ''}
                    onChange={(e) => handleChange('roomType', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                    <option value="">Sélectionnez...</option>
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Triple">Triple</option>
                    <option value="Quad">Quad</option>
                </select>
            </div>

            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="mealsIncluded"
                    checked={details.mealsIncluded || false}
                    onChange={(e) => handleChange('mealsIncluded', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="mealsIncluded" className="ml-2 text-sm font-medium text-gray-700">
                    Repas inclus
                </label>
            </div>
        </div>
    );
};
