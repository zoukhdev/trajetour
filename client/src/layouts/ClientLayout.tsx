import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import ClientSidebar from './ClientSidebar';
import { useData } from '../context/DataContext';
import PullToRefresh from '../components/PullToRefresh';
import OfflineIndicator from '../components/OfflineIndicator';
import { cn } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';

const ClientLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { refreshData } = useData();
    const { t } = useLanguage();

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900/20 w-full overflow-x-hidden flex-col">
            <OfflineIndicator />
            <div className="flex flex-1 w-full overflow-hidden">
                <ClientSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <main className="flex-1 transition-all duration-300 overflow-x-hidden">
                    {/* Mobile Header */}
                    <div
                        className="md:hidden bg-white dark:bg-[#1a2634] border-b border-gray-100 dark:border-gray-700 flex items-center justify-between sticky top-0 z-30 shadow-sm"
                        style={{
                            paddingTop: 'max(env(safe-area-inset-top), 4.5rem)',
                            paddingLeft: 'max(env(safe-area-inset-left), 1rem)',
                            paddingRight: 'max(env(safe-area-inset-right), 1rem)',
                            paddingBottom: '1rem'
                        }}
                    >
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 font-display text-lg">Trajetour</div>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                        >
                            <Menu size={24} />
                        </button>
                    </div>

                    <PullToRefresh onRefresh={refreshData}>
                        <div
                            className="p-4 md:p-8 w-full max-w-7xl mx-auto overflow-x-hidden"
                            style={{
                                paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)'
                            }}
                        >
                            <Outlet />
                        </div>
                    </PullToRefresh>
                </main>
            </div>
        </div>
    );
};

export default ClientLayout;
