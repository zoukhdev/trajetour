import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

import { useData } from '../context/DataContext';
import PullToRefresh from '../components/PullToRefresh';

import OfflineIndicator from '../components/OfflineIndicator';

const MainLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { refreshData } = useData();

    return (
        <div className="flex min-h-screen bg-gray-50 w-full overflow-x-hidden flex-col">
            <OfflineIndicator />
            <div className="flex flex-1 w-full overflow-hidden">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />


                <main className="flex-1 md:ml-64 transition-all duration-300 w-full overflow-x-hidden">
                    {/* Mobile Header with Safe Area */}
                    <div
                        className="md:hidden bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-30 shadow-sm"
                        style={{
                            paddingTop: 'max(env(safe-area-inset-top), 3.5rem)',
                            paddingLeft: 'max(env(safe-area-inset-left), 1rem)',
                            paddingRight: 'max(env(safe-area-inset-right), 1rem)',
                            paddingBottom: '1rem'
                        }}
                    >
                        <div className="font-bold text-primary font-display text-lg">Wahat Alrajaa</div>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
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

export default MainLayout;

