import React from 'react';

interface FlightFieldsProps {
    details: {
        airline?: string;
        ticketQuantity?: number;
        pricePerTicket?: number;
        departure?: {
            airport: string;
            date: string;
        };
        arrival?: {
            airport: string;
            date: string;
        };
        flightNumber?: string;
        class?: 'Economy' | 'Business' | 'First';
    };
    onChange: (details: any) => void;
}

export const FlightFields: React.FC<FlightFieldsProps> = ({ details, onChange }) => {
    const handleChange = (field: string, value: any) => {
        onChange({ ...details, [field]: value });
    };

    const handleNestedChange = (parent: string, field: string, value: any) => {
        onChange({
            ...details,
            [parent]: {
                ...(details[parent as keyof typeof details] as any),
                [field]: value
            }
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compagnie aérienne *
                </label>
                <input
                    type="text"
                    value={details.airline || ''}
                    onChange={(e) => handleChange('airline', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Air Algérie..."
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de billets *
                </label>
                <input
                    type="number"
                    min="1"
                    value={details.ticketQuantity || ''}
                    onChange={(e) => handleChange('ticketQuantity', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix par billet *
                </label>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={details.pricePerTicket || ''}
                    onChange={(e) => handleChange('pricePerTicket', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aéroport de départ *
                </label>
                <input
                    type="text"
                    value={details.departure?.airport || ''}
                    onChange={(e) => handleNestedChange('departure', 'airport', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="ALG"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date/Heure de départ *
                </label>
                <input
                    type="datetime-local"
                    value={details.departure?.date || ''}
                    onChange={(e) => handleNestedChange('departure', 'date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aéroport d'arrivée *
                </label>
                <input
                    type="text"
                    value={details.arrival?.airport || ''}
                    onChange={(e) => handleNestedChange('arrival', 'airport', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="JED"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date/Heure d'arrivée *
                </label>
                <input
                    type="datetime-local"
                    value={details.arrival?.date || ''}
                    onChange={(e) => handleNestedChange('arrival', 'date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de vol
                </label>
                <input
                    type="text"
                    value={details.flightNumber || ''}
                    onChange={(e) => handleChange('flightNumber', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="AH1234"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Classe
                </label>
                <select
                    value={details.class || ''}
                    onChange={(e) => handleChange('class', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                    <option value="">Sélectionnez...</option>
                    <option value="Economy">Economy</option>
                    <option value="Business">Business</option>
                    <option value="First">First</option>
                </select>
            </div>
        </div>
    );
};
