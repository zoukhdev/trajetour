import React from 'react';

interface VisaFieldsProps {
    details: {
        quantity?: number;
        pricePerVisa?: number;
        visaType?: string;
        processingDays?: number;
        country?: string;
    };
    onChange: (details: any) => void;
}

export const VisaFields: React.FC<VisaFieldsProps> = ({ details, onChange }) => {
    const handleChange = (field: string, value: any) => {
        onChange({ ...details, [field]: value });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre  de visas *
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
                    Prix par visa *
                </label>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={details.pricePerVisa || ''}
                    onChange={(e) => handleChange('pricePerVisa', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de visa *
                </label>
                <input
                    type="text"
                    value={details.visaType || ''}
                    onChange={(e) => handleChange('visaType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Tourist, Business, Omra..."
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pays *
                </label>
                <input
                    type="text"
                    value={details.country || ''}
                    onChange={(e) => handleChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Saudi Arabia, UAE..."
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Délai de traitement (jours)
                </label>
                <input
                    type="number"
                    min="1"
                    value={details.processingDays || ''}
                    onChange={(e) => handleChange('processingDays', parseInt(e.target.value) || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Optional"
                />
            </div>
        </div>
    );
};
