import { useState } from 'react';
import { useExchangeRates } from '../context/ExchangeRateContext';
import { DollarSign, TrendingUp, Calendar, Edit2, Trash2, AlertTriangle } from 'lucide-react';

const ExchangeRateManager = () => {
    const {
        rateHistory,
        currentRates,
        saveExchangeRate,
        getRateForDate,
        deleteRate
    } = useExchangeRates();

    const [sarRate, setSarRate] = useState(currentRates?.SAR.toString() || '36.5');
    const [eurRate, setEurRate] = useState(currentRates?.EUR.toString() || '245');
    const [usdRate, setUsdRate] = useState(currentRates?.USD.toString() || '220');
    const [rateDate, setRateDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchDate, setSearchDate] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const handleSaveRate = (e: React.FormEvent) => {
        e.preventDefault();

        const sar = parseFloat(sarRate);
        const eur = parseFloat(eurRate);
        const usd = parseFloat(usdRate);

        if (isNaN(sar) || isNaN(eur) || isNaN(usd)) {
            alert('Please enter valid numeric rates');
            return;
        }

        if (sar <= 0 || eur <= 0 || usd <= 0) {
            alert('Rates must be greater than 0');
            return;
        }

        // Check if updating existing rate
        const existingRate = getRateForDate(rateDate, 'SAR');
        if (existingRate && !confirm(`A rate already exists for ${rateDate}. Do you want to update it?`)) {
            return;
        }

        saveExchangeRate(sar, eur, usd, rateDate);
        alert(`Exchange rates saved successfully for ${rateDate}!`);

        // Reset to today's date
        setRateDate(new Date().toISOString().split('T')[0]);
    };

    const handleEdit = (id: string) => {
        const rate = rateHistory.find(r => r.id === id);
        if (rate) {
            setSarRate(rate.sarToDzd.toString());
            setEurRate(rate.eurToDzd.toString());
            setUsdRate((rate.usdToDzd || 220).toString());
            setRateDate(rate.date);
            setEditingId(id);
        }
    };

    const handleDelete = (id: string, date: string) => {
        if (confirm(`⚠️ Warning: Deleting the rate for ${date} may affect historical transaction calculations. Are you sure?`)) {
            deleteRate(id);
        }
    };

    const filteredRates = searchDate
        ? rateHistory.filter(r => r.date.includes(searchDate))
        : rateHistory;

    return (
        <div className="space-y-6">
            {/* Current Rates Display */}
            <div className="bg-gradient-to-r from-blue-500 to-primary p-6 rounded-xl text-white">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={24} />
                    <h2 className="text-xl font-bold">Current Exchange Rates</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                        <div className="text-sm opacity-90">SAR → DZD</div>
                        <div className="text-3xl font-bold">{currentRates?.SAR.toFixed(2) || '0.00'}</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                        <div className="text-sm opacity-90">EUR → DZD</div>
                        <div className="text-3xl font-bold">{currentRates?.EUR.toFixed(2) || '0.00'}</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                        <div className="text-sm opacity-90">USD → DZD</div>
                        <div className="text-3xl font-bold">{currentRates?.USD.toFixed(2) || '0.00'}</div>
                    </div>
                </div>
            </div>

            {/* Rate Input Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <DollarSign size={20} className="text-primary" />
                    <h3 className="text-lg font-semibold text-gray-900">
                        {editingId ? 'Update' : 'Set'} Daily Exchange Rate
                    </h3>
                </div>

                <form onSubmit={handleSaveRate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Date */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Calendar size={16} className="inline mr-1" />
                                Date
                            </label>
                            <input
                                type="date"
                                value={rateDate}
                                onChange={(e) => setRateDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                required
                            />
                        </div>

                        {/* SAR Rate */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                SAR → DZD
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={sarRate}
                                onChange={(e) => setSarRate(e.target.value)}
                                placeholder="36.50"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                required
                            />
                        </div>

                        {/* EUR Rate */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                EUR → DZD
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={eurRate}
                                onChange={(e) => setEurRate(e.target.value)}
                                placeholder="245.00"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                required
                            />
                        </div>

                        {/* USD Rate */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                USD → DZD
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={usdRate}
                                onChange={(e) => setUsdRate(e.target.value)}
                                placeholder="220.00"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            {editingId ? 'Update Rate' : 'Save Rate'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingId(null);
                                    setRateDate(new Date().toISOString().split('T')[0]);
                                    setSarRate(currentRates?.SAR.toString() || '36.5');
                                    setEurRate(currentRates?.EUR.toString() || '245');
                                    setUsdRate(currentRates?.USD.toString() || '220');
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                    </div>

                    {editingId && (
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                            <AlertTriangle size={16} />
                            <span>Warning: Editing historical rates may affect past transaction calculations.</span>
                        </div>
                    )}
                </form>
            </div>

            {/* Rate History Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Rate History</h3>
                    <input
                        type="text"
                        placeholder="Search by date (YYYY-MM-DD)..."
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        className="w-full md:w-64 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                            <tr>
                                <th className="px-6 py-4 text-left">Date</th>
                                <th className="px-6 py-4 text-right">SAR → DZD</th>
                                <th className="px-6 py-4 text-right">EUR → DZD</th>
                                <th className="px-6 py-4 text-right">USD → DZD</th>
                                <th className="px-6 py-4 text-left">Created By</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredRates.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No exchange rates found
                                    </td>
                                </tr>
                            ) : (
                                [...filteredRates].reverse().map((rate) => (
                                    <tr key={rate.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {new Date(rate.date).toLocaleDateString('fr-DZ', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 text-right font-mono">
                                            {rate.sarToDzd.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 text-right font-mono">
                                            {rate.eurToDzd.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 text-right font-mono">
                                            {(rate.usdToDzd || 220).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {rate.createdBy}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(rate.id)}
                                                    className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit rate"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                {rateHistory.length > 1 && (
                                                    <button
                                                        onClick={() => handleDelete(rate.id, rate.date)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete rate"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ExchangeRateManager;
