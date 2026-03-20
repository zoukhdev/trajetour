import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import AgencySidebar from './AgencySidebar';
import { useData } from '../context/DataContext';
import PullToRefresh from '../components/PullToRefresh';
import OfflineIndicator from '../components/OfflineIndicator';
import { SubscriptionProvider } from '../context/SubscriptionContext';
import PendingApprovalGate from '../components/PendingApprovalGate';

const AgencyLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { refreshData } = useData();

    return (
        <SubscriptionProvider>
            <PendingApprovalGate>
                <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20 w-full overflow-x-hidden flex-col">
                    <OfflineIndicator />
                    <div className="flex flex-1 w-full overflow-hidden">
                        <AgencySidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                        <main className="flex-1 md:ml-64 transition-all duration-300 w-full overflow-x-hidden">
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
                                <div className="font-bold text-blue-600 dark:text-blue-400 font-display text-lg">Partner Portal</div>
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
            </PendingApprovalGate>
        </SubscriptionProvider>
    );
};

export default AgencyLayout;
