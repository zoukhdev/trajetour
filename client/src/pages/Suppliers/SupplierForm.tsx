import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import type { Supplier } from '../../types';

interface SupplierFormProps {
    supplier?: Supplier;
    onSubmit: (supplier: Supplier) => void;
    onClose: () => void;
}

const SupplierForm = ({ supplier, onSubmit, onClose }: SupplierFormProps) => {
    const { t, language } = useLanguage();
    const isRTL = language === 'ar';

    const [formData, setFormData] = useState<Partial<Supplier>>({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        serviceType: 'Hotel'
    });

    useEffect(() => {
        if (supplier) {
            setFormData(supplier);
        }
    }, [supplier]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            id: supplier?.id || Math.random().toString(36).substr(2, 9),
            ...formData
        } as Supplier);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">{t('common.name')}</label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        dir={isRTL ? 'rtl' : 'ltr'}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Service Type</label>
                    <select
                        value={formData.serviceType}
                        onChange={e => setFormData({ ...formData, serviceType: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white"
                        dir={isRTL ? 'rtl' : 'ltr'}
                    >
                        <option value="Hotel">Hotel</option>
                        <option value="Transport">Transport</option>
                        <option value="Visa">Visa</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Contact Person</label>
                    <input
                        type="text"
                        value={formData.contactPerson}
                        onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        dir={isRTL ? 'rtl' : 'ltr'}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <input
                        type="tel"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        dir="ltr"
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        dir="ltr"
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Address</label>
                    <textarea
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none h-24"
                        dir={isRTL ? 'rtl' : 'ltr'}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                    {t('common.cancel')}
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    {t('common.save')}
                </button>
            </div>
        </form>
    );
};

export default SupplierForm;
