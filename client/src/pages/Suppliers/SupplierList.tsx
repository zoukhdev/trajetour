import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Search, Plus, Edit2, Trash2, Phone, Mail, MapPin, Building2, Package } from 'lucide-react';
import Modal from '../../components/Modal';
import { useLanguage } from '../../context/LanguageContext';
import SupplierForm from './SupplierForm';
import type { Supplier } from '../../types';

const SupplierList = () => {
    const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useData();
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = (supplier: Supplier) => {
        if (editingSupplier) {
            updateSupplier(supplier);
        } else {
            addSupplier(supplier);
        }
        setIsFormOpen(false);
        setEditingSupplier(undefined);
    };

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setIsFormOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm(t('common.delete_confirm'))) {
            deleteSupplier(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-display">{t('common.suppliers')}</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your service providers</p>
                </div>
                <button
                    onClick={() => {
                        setEditingSupplier(undefined);
                        setIsFormOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus size={20} />
                    <span className="font-bold">{t('common.add')}</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
                <input
                    type="text"
                    placeholder={t('common.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 bg-white border border-gray-100 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm`}
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
            </div>

            {/* Suppliers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSuppliers.map((supplier) => (
                    <div
                        key={supplier.id}
                        onClick={() => navigate(`/suppliers/${supplier.id}/contracts`)}
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group cursor-pointer"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Building2 size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{supplier.name}</h3>
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                        {supplier.serviceType}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(supplier);
                                    }}
                                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(supplier.id);
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                                    <span className="font-bold text-gray-500 text-xs">CP</span>
                                </div>
                                <span className="truncate">{supplier.contactPerson}</span>
                            </div>

                            {supplier.phone && (
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                                        <Phone size={14} />
                                    </div>
                                    <span dir="ltr">{supplier.phone}</span>
                                </div>
                            )}

                            {supplier.email && (
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                                        <Mail size={14} />
                                    </div>
                                    <span className="truncate">{supplier.email}</span>
                                </div>
                            )}

                            {supplier.address && (
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                                        <MapPin size={14} />
                                    </div>
                                    <span className="truncate">{supplier.address}</span>
                                </div>
                            )}
                        </div>

                        {/* View Contracts Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/suppliers/${supplier.id}/contracts`);
                            }}
                            className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                        >
                            <Package size={16} />
                            <span>Voir les contrats</span>
                        </button>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingSupplier(undefined);
                }}
                title={editingSupplier
                    ? `${t('common.edit')} ${t('common.suppliers')}`
                    : `${t('common.add')} ${t('common.suppliers')}`
                }
            >
                <SupplierForm
                    supplier={editingSupplier}
                    onSubmit={handleSubmit}
                    onClose={() => {
                        setIsFormOpen(false);
                        setEditingSupplier(undefined);
                    }}
                />
            </Modal>
        </div>
    );
};

export default SupplierList;
