import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, Plus, Pencil, Trash2, ArrowLeft, ChevronDown, ChevronUp, Hotel, FileText, Bus, Plane, Utensils } from 'lucide-react';
import type { SupplierContract, ContractType } from '../../types';
import { supplierContractsAPI, suppliersAPI } from '../../services/api';
import { ContractForm } from '../../components/ContractForm';

const contractIcons: Record<ContractType, React.ReactNode> = {
    'Rooms': <Hotel className="w-5 h-5" />,
    'Visa': <FileText className="w-5 h-5" />,
    'Transportation': <Bus className="w-5 h-5" />,
    'Flight': <Plane className="w-5 h-5" />,
    'Food': <Utensils className="w-5 h-5" />
};

export default function SupplierContracts() {
    const { id: supplierId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [contracts, setContracts] = useState<SupplierContract[]>([]);
    const [supplierName, setSupplierName] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedContract, setSelectedContract] = useState<SupplierContract | undefined>();
    const [filterType, setFilterType] = useState<ContractType | ''>('');
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [supplierId, filterType]);

    const loadData = async () => {
        if (!supplierId) return;

        try {
            setLoading(true);

            // Load supplier info
            const suppliers = await suppliersAPI.getAll();
            const supplier = suppliers.find((s: any) => s.id === supplierId);
            if (supplier) {
                setSupplierName(supplier.name);
            }

            // Load contracts
            const contractsData = await supplierContractsAPI.getBySupplier(
                supplierId,
                filterType || undefined
            );
            setContracts(contractsData);
        } catch (error) {
            console.error('Failed to load contracts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (contractId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce contrat?')) return;

        try {
            await supplierContractsAPI.delete(contractId);
            loadData();
        } catch (error) {
            alert('Échec de la suppression du contrat');
        }
    };

    const handleEdit = (contract: SupplierContract) => {
        setSelectedContract(contract);
        setShowForm(true);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setSelectedContract(undefined);
        loadData();
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setSelectedContract(undefined);
    };

    const renderDetails = (contract: SupplierContract) => {
        const details = contract.details as any;

        switch (contract.contractType) {
            case 'Rooms':
                return (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div><span className="font-medium">Quantité:</span> {details.quantity} chambres</div>
                        <div><span className="font-medium">Prix/personne:</span> {details.pricePerPersonDzd} DA</div>
                        <div><span className="font-medium">Ville:</span> {details.cityIn}</div>
                        <div><span className="font-medium">Hôtel:</span> {details.hotelName}</div>
                        <div><span className="font-medium">Arrivée:</span> {details.dateIn}</div>
                        <div><span className="font-medium">Départ:</span> {details.dateOut}</div>
                        {details.roomType && <div><span className="font-medium">Type:</span> {details.roomType}</div>}
                        {details.mealsIncluded !== undefined && (
                            <div><span className="font-medium">Repas:</span> {details.mealsIncluded ? 'Inclus' : 'Non inclus'}</div>
                        )}
                    </div>
                );
            case 'Visa':
                return (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div><span className="font-medium">Quantité:</span> {details.quantity} visas</div>
                        <div><span className="font-medium">Prix/visa:</span> {details.pricePerVisa}</div>
                        <div><span className="font-medium">Type:</span> {details.visaType}</div>
                        <div><span className="font-medium">Pays:</span> {details.country}</div>
                        {details.processingDays && (
                            <div><span className="font-medium">Délai:</span> {details.processingDays} jours</div>
                        )}
                    </div>
                );
            case 'Transportation':
                return (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div><span className="font-medium">Type:</span> {details.vehicleType}</div>
                        <div><span className="font-medium">Quantité:</span> {details.quantity}</div>
                        <div><span className="font-medium">Prix/unité:</span> {details.pricePerUnit}</div>
                        <div><span className="font-medium">Itinéraire:</span> {details.route}</div>
                        <div><span className="font-medium">Début:</span> {details.dateFrom}</div>
                        <div><span className="font-medium">Fin:</span> {details.dateTo}</div>
                        {details.capacity && <div><span className="font-medium">Capacité:</span> {details.capacity} passagers</div>}
                    </div>
                );
            case 'Flight':
                return (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div><span className="font-medium">Compagnie:</span> {details.airline}</div>
                        <div><span className="font-medium">Billets:</span> {details.ticketQuantity}</div>
                        <div><span className="font-medium">Prix/billet:</span> {details.pricePerTicket}</div>
                        <div><span className="font-medium">Départ:</span> {details.departure?.airport} - {details.departure?.date}</div>
                        <div><span className="font-medium">Arrivée:</span> {details.arrival?.airport} - {details.arrival?.date}</div>
                        {details.flightNumber && <div><span className="font-medium">Vol:</span> {details.flightNumber}</div>}
                        {details.class && <div><span className="font-medium">Classe:</span> {details.class}</div>}
                    </div>
                );
            case 'Food':
                return (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div><span className="font-medium">Type:</span> {details.mealType}</div>
                        <div><span className="font-medium">Quantité:</span> {details.quantity} repas</div>
                        <div><span className="font-medium">Prix/repas:</span> {details.pricePerMeal}</div>
                        <div><span className="font-medium">Lieu:</span> {details.location}</div>
                        <div><span className="font-medium">Début:</span> {details.dateFrom}</div>
                        <div><span className="font-medium">Fin:</span> {details.dateTo}</div>
                        {details.dietaryNotes && (
                            <div className="md:col-span-2"><span className="font-medium">Notes:</span> {details.dietaryNotes}</div>
                        )}
                    </div>
                );
            default:
                return <div>Détails non disponibles</div>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Chargement...</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/suppliers')}
                    className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Retour aux fournisseurs
                </button>

                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Contrats - {supplierName}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {contracts.length} contrat{contracts.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setSelectedContract(undefined);
                            setShowForm(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        <Plus className="w-5 h-5" />
                        Nouveau contrat
                    </button>
                </div>
            </div>

            {/* Filter */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filtrer par type
                </label>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as ContractType | '')}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                >
                    <option value="">Tous les types</option>
                    <option value="Rooms">Chambres/Hôtels</option>
                    <option value="Visa">Visas</option>
                    <option value="Transportation">Transport</option>
                    <option value="Flight">Vols</option>
                    <option value="Food">Restauration</option>
                </select>
            </div>

            {/* Contracts Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {contracts.length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Aucun contrat trouvé</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="mt-4 text-blue-600 hover:text-blue-700"
                        >
                            Créer le premier contrat
                        </button>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valeur</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valeur DZD</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {contracts.map((contract) => (
                                <React.Fragment key={contract.id}>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {contractIcons[contract.contractType]}
                                                <span className="font-medium">{contract.contractType}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {new Date(contract.datePurchased).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {contract.contractValue.toLocaleString('fr-DZ')} {contract.paymentCurrency}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                            {contract.contractValueDzd.toLocaleString('fr-DZ')} DA
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setExpandedRow(expandedRow === contract.id ? null : contract.id)}
                                                    className="text-gray-600 hover:text-gray-900"
                                                    title="Voir détails"
                                                >
                                                    {expandedRow === contract.id ? (
                                                        <ChevronUp className="w-5 h-5" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(contract)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Modifier"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(contract.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedRow === contract.id && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-4 bg-gray-50">
                                                <div className="space-y-3">
                                                    <h4 className="font-semibold text-gray-900">Détails du contrat</h4>
                                                    {renderDetails(contract)}
                                                    {contract.notes && (
                                                        <div className="mt-3 pt-3 border-t">
                                                            <span className="font-medium">Notes:</span> {contract.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Contract Form Modal */}
            {showForm && supplierId && (
                <ContractForm
                    supplierId={supplierId}
                    contract={selectedContract}
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                />
            )}
        </div>
    );
}
