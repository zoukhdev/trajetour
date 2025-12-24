import React, { useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface RoomsFieldsProps {
    details: {
        rooms?: Array<{
            roomType: string;
            age: number;
            price: number;
        }>;
        dateIn?: string;
        dateOut?: string;
        cityIn?: string;
        hotelName?: string;
        mealsIncluded?: boolean;
        totalDays?: number;
    };
    onChange: (details: any) => void;
}

export const RoomsFields: React.FC<RoomsFieldsProps> = ({ details, onChange }) => {
    const handleChange = (field: string, value: any) => {
        onChange({ ...details, [field]: value });
    };

    // Calculate total days whenever dates change
    useEffect(() => {
        if (details.dateIn && details.dateOut) {
            const start = new Date(details.dateIn);
            const end = new Date(details.dateOut);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays !== details.totalDays) {
                onChange({ ...details, totalDays: diffDays });
            }
        }
    }, [details.dateIn, details.dateOut, details.totalDays, onChange, details]);

    const handleAddRoom = () => {
        const currentRooms = details.rooms || [];
        onChange({
            ...details,
            rooms: [...currentRooms, { roomType: 'Double', age: 0, price: 0 }]
        });
    };

    const handleRoomChange = (index: number, field: string, value: any) => {
        const currentRooms = [...(details.rooms || [])];
        currentRooms[index] = { ...currentRooms[index], [field]: value };
        onChange({ ...details, rooms: currentRooms });
    };

    const handleRemoveRoom = (index: number) => {
        const currentRooms = details.rooms || [];
        onChange({
            ...details,
            rooms: currentRooms.filter((_, i) => i !== index)
        });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="flex gap-2 items-center">
                        <input
                            type="date"
                            value={details.dateOut || ''}
                            onChange={(e) => handleChange('dateOut', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                        />
                        {details.totalDays !== undefined && (
                            <span className="text-sm font-medium text-blue-600 whitespace-nowrap px-2">
                                {details.totalDays} Jours
                            </span>
                        )}
                    </div>
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

            <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                        Configuration des chambres ({details.rooms?.length || 0})
                    </label>
                    <button
                        type="button"
                        onClick={handleAddRoom}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        <Plus size={16} />
                        Ajouter une chambre
                    </button>
                </div>

                <div className="space-y-3">
                    {(!details.rooms || details.rooms.length === 0) && (
                        <div className="text-center py-4 bg-gray-50 rounded-lg text-gray-500 text-sm">
                            Aucune chambre configurée. Cliquez sur "Ajouter une chambre".
                        </div>
                    )}

                    {details.rooms?.map((room, index) => (
                        <div key={index} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="flex-1 w-full md:w-auto">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Type de chambre</label>
                                <input
                                    type="text"
                                    value={room.roomType}
                                    onChange={(e) => handleRoomChange(index, 'roomType', e.target.value)}
                                    placeholder="Ex: Double, Suite..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                            </div>
                            <div className="w-full md:w-24">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Age</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={room.age}
                                    onChange={(e) => handleRoomChange(index, 'age', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                            </div>
                            <div className="w-full md:w-32">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Prix (DZD)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={room.price}
                                    onChange={(e) => handleRoomChange(index, 'price', parseFloat(e.target.value) || 0)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-bold text-gray-900"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveRoom(index)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-full mt-0 md:mt-5"
                                title="Supprimer"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
