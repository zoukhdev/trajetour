import { User, Edit2, Trash2, Phone, Mail, Calendar } from 'lucide-react';
import type { Passenger } from '../types';

interface PassengerListProps {
    passengers: Passenger[];
    onEdit: (passenger: Passenger) => void;
    onDelete: (passengerId: string) => void;
}

const PassengerList = ({ passengers, onEdit, onDelete }: PassengerListProps) => {
    // Helper to safely format dates
    const formatDate = (dateString?: string) => {
        if (!dateString) return null;
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return null;
            return date.toLocaleDateString('fr-FR');
        } catch (e) {
            return null;
        }
    };

    if (!passengers || passengers.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <User size={48} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Aucun passager ajouté</p>
                <p className="text-xs mt-1">Cliquez sur "Ajouter un passager" pour commencer</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {(passengers || []).map((passenger, index) => {
                if (!passenger) return null;
                return (
                    <div
                        key={passenger.id || Math.random()}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:border-primary/30 hover:shadow-sm transition-all"
                    >
                        <div className="flex items-start gap-4">
                            {/* Passenger Photo or Avatar */}
                            <div className="flex-shrink-0">
                                {passenger.photo ? (
                                    <img
                                        src={passenger.photo}
                                        alt={`${passenger.firstName || ''} ${passenger.lastName || ''}`}
                                        className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                                        <User size={24} className="text-gray-400" />
                                    </div>
                                )}
                            </div>

                            {/* Passenger Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 text-lg">
                                            <span className="inline-flex items-center gap-2">
                                                <span className="text-xs font-medium px-2 py-0.5 bg-primary/10 text-primary rounded">
                                                    #{index + 1}
                                                </span>
                                                {passenger.firstName || '-'} {passenger.lastName || '-'}
                                            </span>
                                        </h4>
                                        {passenger.gender && (
                                            <span className="text-sm text-gray-500">{passenger.gender}</span>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onEdit(passenger)}
                                            className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Modifier"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm(`Supprimer ${passenger.firstName} ${passenger.lastName}?`)) {
                                                    onDelete(passenger.id);
                                                }
                                            }}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Supprimer"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Passenger Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                                    {passenger.birthDate && formatDate(passenger.birthDate) && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Calendar size={14} className="text-gray-400" />
                                            <span>
                                                {formatDate(passenger.birthDate)}
                                            </span>
                                        </div>
                                    )}

                                    {passenger.phoneNumber && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Phone size={14} className="text-gray-400" />
                                            <span>{passenger.phoneNumber}</span>
                                        </div>
                                    )}

                                    {passenger.email && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Mail size={14} className="text-gray-400" />
                                            <span className="truncate">{passenger.email}</span>
                                        </div>
                                    )}

                                    {passenger.passportNumber && (
                                        <div className="text-gray-600">
                                            <span className="text-gray-400 text-xs">Passeport:</span>{' '}
                                            <span className="font-mono">{passenger.passportNumber}</span>
                                        </div>
                                    )}

                                    {passenger.passportExpiry && formatDate(passenger.passportExpiry) && (
                                        <div className="text-gray-600">
                                            <span className="text-gray-400 text-xs">Expiration:</span>{' '}
                                            <span>
                                                {formatDate(passenger.passportExpiry)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Summary */}
            <div className="flex items-center justify-between pt-2 px-2 text-sm text-gray-500">
                <span>
                    Total: <strong className="text-gray-900">{(passengers || []).length}</strong> passager{(passengers || []).length > 1 ? 's' : ''}
                </span>
            </div>
        </div>
    );
};

export default PassengerList;
