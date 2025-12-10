import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import OrderForm from './OrderForm';
import { useLanguage } from '../../context/LanguageContext';

const NewOrderPage = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/orders')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 font-display">{t('orders.new_order')}</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <OrderForm onClose={() => navigate('/orders')} />
            </div>
        </div>
    );
};

export default NewOrderPage;
