import { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, FileCheck, Upload, Phone } from 'lucide-react';
import { getAgencyPath } from '../../lib/tenant';

interface DocumentReminder {
    id: string;
    reference: string;
    clientName: string;
    clientMobile: string;
    passengerCount: number;
    missingDocuments: string[];
    daysUntilDeparture: number | null;
    departureDate: string | null;
}

const DocumentReminders = () => {
    const [reminders, setReminders] = useState<DocumentReminder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDocumentReminders();
    }, []);

    const fetchDocumentReminders = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/orders/missing-documents', {
                credentials: 'include'
            });
            const data = await response.json();
            setReminders(data.orders || []);
        } catch (error) {
            console.error('Error fetching document reminders:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDocumentLabel = (doc: string) => {
        const labels: Record<string, string> = {
            passport: 'Passeport',
            photo: 'Photo d\'identité',
            vaccine: 'Certificat de vaccination'
        };
        return labels[doc] || doc;
    };

    const getUrgencyColor = (days: number | null) => {
        if (days === null) return 'bg-gray-100 text-gray-600';
        if (days <= 7) return 'bg-red-100 text-red-700 border-red-500';
        if (days <= 15) return 'bg-orange-100 text-orange-700 border-orange-500';
        if (days <= 30) return 'bg-yellow-100 text-yellow-700 border-yellow-500';
        return 'bg-blue-100 text-blue-700 border-blue-500';
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Date non définie';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="flex-1 bg-background-light dark:bg-background-dark p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-2">
                        <FileCheck size={28} className="text-orange-600" />
                        Rappels de Documents
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Clients avec des documents manquants
                    </p>
                </div>

                {/* Stats */}
                {!loading && reminders.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{reminders.length}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Commandes concernées</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                                    <Calendar className="text-orange-600 dark:text-orange-400" size={24} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {reminders.filter(r => r.daysUntilDeparture && r.daysUntilDeparture <= 15).length}
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Départs urgents (&lt;15j)</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                    <FileCheck className="text-blue-600 dark:text-blue-400" size={24} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {reminders.reduce((sum, r) => sum + r.missingDocuments.length, 0)}
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Documents manquants</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 animate-pulse">
                                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                            </div>
                        ))}
                    </div>
                ) : reminders.length === 0 ? (
                    /* Empty State */
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center">
                        <FileCheck size={48} className="mx-auto text-green-500 mb-4" />
                        <p className="text-lg font-medium text-slate-900 dark:text-white">Tous les documents sont à jour!</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                            Aucun client n'a de documents manquants pour le moment
                        </p>
                    </div>
                ) : (
                    /* Document Reminders Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reminders.map((item) => {
                            const urgencyColor = getUrgencyColor(item.daysUntilDeparture);
                            const isUrgent = item.daysUntilDeparture !== null && item.daysUntilDeparture <= 7;

                            return (
                                <div
                                    key={item.id}
                                    className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border-2 ${isUrgent
                                        ? 'border-red-500 dark:border-red-700'
                                        : 'border-slate-200 dark:border-slate-800'
                                        } p-6 transition-all hover:shadow-md`}
                                >
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                                                {item.clientName}
                                            </h3>
                                            <span className="text-xs text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                                #{item.reference}
                                            </span>
                                        </div>
                                        {item.daysUntilDeparture !== null && (
                                            <div className={`text-center px-3 py-2 rounded-lg text-xs font-bold ${urgencyColor} border-2`}>
                                                <div className="text-xl font-black">{item.daysUntilDeparture}</div>
                                                <div>jour{item.daysUntilDeparture > 1 ? 's' : ''}</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Contact Info */}
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm mb-4">
                                        <Phone size={14} />
                                        <span>{item.clientMobile || 'N/A'}</span>
                                    </div>

                                    {/* Departure Date */}
                                    {item.departureDate && (
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm mb-4">
                                            <Calendar size={14} />
                                            <span>Départ: {formatDate(item.departureDate)}</span>
                                        </div>
                                    )}

                                    {/* Passengers Count */}
                                    <div className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                                        {item.passengerCount} passager{item.passengerCount > 1 ? 's' : ''}
                                    </div>

                                    {/* Missing Documents */}
                                    <div className="mb-6">
                                        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Documents manquants</p>
                                        <div className="flex flex-wrap gap-2">
                                            {item.missingDocuments.map((doc, i) => (
                                                <span
                                                    key={i}
                                                    className="px-2 py-1 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-md flex items-center gap-1"
                                                >
                                                    <AlertTriangle size={14} />
                                                    {getDocumentLabel(doc)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <button
                                        onClick={() => window.location.href = getAgencyPath(`/bookings/${item.id}`)}
                                        className="w-full h-10 bg-primary hover:bg-blue-600 text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
                                    >
                                        <Upload size={16} />
                                        Gérer les documents
                                    </button>

                                    {isUrgent && (
                                        <p className="text-xs text-red-600 dark:text-red-400 text-center mt-2 font-bold">
                                            ⚠️ URGENT - Départ imminent!
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentReminders;
