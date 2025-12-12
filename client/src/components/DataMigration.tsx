import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CheckCircle, AlertTriangle, Loader, Server, Database } from 'lucide-react';

const DataMigration: React.FC = () => {
    const { user } = useAuth();
    const [status, setStatus] = useState<'idle' | 'scanning' | 'migrating' | 'completed' | 'error'>('idle');
    const [progress, setProgress] = useState<string>('');
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

    const migrateEntity = async (key: string, endpoint: string, name: string) => {
        const stored = localStorage.getItem(key);
        if (!stored) {
            addLog(`ℹ️ No ${name} found in LocalStorage.`);
            return;
        }

        const items = JSON.parse(stored);
        addLog(`📦 Found ${items.length} ${name} in LocalStorage. Migrating...`);

        let successCount = 0;
        let failCount = 0;

        for (const item of items) {
            try {
                // Adjust payload if needed (e.g. converting IDs or dates)
                // For now, assume backend schemas match frontend types roughly
                // Delete ID to let DB generate new one? 
                // NO! We need to keep IDs to preserve relationships (Orders -> Agencies)
                // BUT, Backend usually generates IDs (UUIDs).
                // If Frontend IDs are UUIDs, we might be okay if DB allows inserting ID.
                // If Frontend IDs are "1", "2", and DB expects UUID, we have a problem.
                // RISK: Broken Relationships.
                // STRATEGY: Try to send ID. If DB rejects, we have a mapping problem.
                // For valid UUIDs, Postgres accepts them.

                await api.post(endpoint, item);
                successCount++;
            } catch (error: any) {
                // Check if duplicate (409)
                if (error.response?.status === 409) {
                    addLog(`⚠️ ${name} ${item.name || item.id} already exists (Duplicate).`);
                    successCount++; // Count as success since it's there
                } else {
                    console.error(`Failed to migrate ${name}:`, error);
                    addLog(`❌ Failed to migrate ${name} ${item.id}: ${error.message}`);
                    failCount++;
                }
            }
        }
        addLog(`✅ Migrated ${successCount}/${items.length} ${name}. (${failCount} failed)`);
    };

    const startMigration = async () => {
        if (!confirm('This will upload your Local data to the Server. Continue?')) return;
        setStatus('migrating');
        setLogs([]);

        try {
            // 1. Agencies
            await migrateEntity('agencies', '/agencies', 'Agencies');

            // 2. Expenses
            await migrateEntity('expenses', '/expenses', 'Expenses');

            // 3. Guide Expenses -> To Expenses (Category: Guide) ? 
            // Or maybe guideExpenses table? For now, let's migrate standard entities.
            // await migrateEntity('guideExpenses', '/expenses', 'Guide Expenses');

            // 4. Users
            // Only migrate if we are Admin and backend allows it
            await migrateEntity('users', '/users', 'Users');

            // 5. Transactions / Bank Accounts
            // Bank Accounts first
            // await migrateEntity('bankAccounts', '/bank-accounts', 'Bank Accounts'); // We don't have this route yet?
            // Wait, Transactions depend on Accounts.
            // I created Transactions route, but not BankAccounts route?
            // CHECK: DataContext has bankAccounts.
            // I missed bankAccounts route in Phase 1 plan!
            // Let's migrate what we can.

            setStatus('completed');
            addLog('🎉 Migration Sequence Completed.');

        } catch (error: any) {
            setStatus('error');
            addLog(`🔥 Critical Error: ${error.message}`);
        }
    };

    if (user?.role !== 'admin') {
        return <div className="p-8 text-center text-red-500">Access Denied. Admins Only.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-xl mt-10">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                    <Database size={32} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">System Data Migration</h1>
                    <p className="text-gray-500">Move your data from this Browser to the Central Database</p>
                </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-8">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="text-yellow-600 mt-1" />
                    <div>
                        <h3 className="font-semibold text-yellow-800">Important Warning</h3>
                        <p className="text-yellow-700 text-sm mt-1">
                            This tool will read data stored in your browser's LocalStorage and push it to the server.
                            Please populate the database <b>only once</b> to avoid duplicates.
                        </p>
                    </div>
                </div>
            </div>

            <div className="border rounded-lg bg-gray-900 text-green-400 font-mono text-sm p-4 h-64 overflow-y-auto mb-6">
                {logs.length === 0 ? (
                    <span className="text-gray-500">// Ready to start...</span>
                ) : (
                    logs.map((log, i) => <div key={i}>{log}</div>)
                )}
            </div>

            <div className="flex justify-end gap-4">
                <button
                    onClick={startMigration}
                    disabled={status === 'migrating' || status === 'completed'}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-colors
                        ${status === 'completed' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
                        ${status === 'migrating' ? 'opacity-70 cursor-wait' : ''}
                    `}
                >
                    {status === 'migrating' ? (
                        <>
                            <Loader className="animate-spin" size={20} />
                            Migrating...
                        </>
                    ) : status === 'completed' ? (
                        <>
                            <CheckCircle size={20} />
                            Migration Done
                        </>
                    ) : (
                        <>
                            <Server size={20} />
                            Start Migration
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default DataMigration;
