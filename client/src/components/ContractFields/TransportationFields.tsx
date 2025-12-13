import React from 'react';

interface TransportationFieldsProps {
    details: {
        vehicleType?: 'Bus' | 'Van' | 'Car' | 'Minibus';
        quantity?: number;
        pricePerUnit?: number;
        route?: string;
        dateFrom?: string;
        dateTo?: string;
        capacity?: number;
    };
    onChange: (details: any) => void;
}

export const TransportationFields: React.FC<TransportationFieldsProps> = ({ details, onChange }) => {
    const handleChange = (field: string, value: any) => {
        onChange({ ...details, [field]: value });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de véhicule *
                </label>
                <select
                    value={details.vehicleType || ''}
                    onChange={(e) => handleChange('vehicleType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                >
                    <option value="">Sélectionnez...</option>
                    <option value="Bus">Bus</option>
                    <option value="Van">Van</option>
                    <option value="Car">Car</option>
                    <option value="Minibus">Minibus</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantité *
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
                    Prix par unité *
                </label>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={details.pricePerUnit || ''}
                    onChange={(e) => handleChange('pricePerUnit', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Itinéraire *
                </label>
                <input
                    type="text"
                    value={details.route || ''}
                    onChange={(e) => handleChange('route', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Alger → Mecca"
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

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacité (passagers)
                </label>
                <input
                    type="number"
                    min="1"
                    value={details.capacity || ''}
                    onChange={(e) => handleChange('capacity', parseInt(e.target.value) || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Optional"
                />
            </div>
        </div>
    );
};
