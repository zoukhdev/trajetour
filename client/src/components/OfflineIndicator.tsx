import { useOffline } from '../context/OfflineContext';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const OfflineIndicator = () => {
    const { isOnline, queue, syncing } = useOffline();
    const { language } = useLanguage(); // Assuming you have this based on file list

    if (isOnline && queue.length === 0) return null;

    const isRTL = language === 'ar';

    return (
        <div
            className={`
                w-full py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium z-50 transition-colors duration-300
                ${!isOnline ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}
            `}
        >
            {!isOnline ? (
                <>
                    <WifiOff size={18} />
                    <span>
                        {isRTL
                            ? 'أنت غير متصل بالإنترنت. سيتم حفظ التغييرات ومزامنتها لاحقاً.'
                            : 'You are offline. Changes will be saved and synced later.'}
                    </span>
                    {queue.length > 0 && (
                        <span className="bg-red-600 px-2 py-0.5 rounded text-xs ml-2">
                            {queue.length} {isRTL ? 'معلق' : 'Pending'}
                        </span>
                    )}
                </>
            ) : (
                <>
                    <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                    <span>
                        {isRTL
                            ? `جاري مزامنة ${queue.length} طلبات...`
                            : `Syncing ${queue.length} requests...`}
                    </span>
                </>
            )}
        </div>
    );
};

export default OfflineIndicator;
