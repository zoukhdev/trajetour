import { useState, useRef } from 'react';
import Modal from './Modal';
import { ordersAPI } from '../services/api';

interface ReceiptUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    orderId: string;
    totalAmount: number;
    remainingAmount: number;
}

const ReceiptUploadModal = ({ isOpen, onClose, onSuccess, orderId, totalAmount, remainingAmount }: ReceiptUploadModalProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [amount, setAmount] = useState<number>(remainingAmount);
    const [method, setMethod] = useState<'CCP' | 'Baridimob' | 'Cash'>('CCP');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError("Veuillez sélectionner une image du reçu.");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const formData = new FormData();
            formData.append('receipt', file);
            formData.append('amount', amount.toString());
            formData.append('method', method);

            await ordersAPI.uploadReceipt(orderId, formData);

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || "Erreur lors de l'envoi du reçu. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ajouter une preuve de paiement">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-2">Instructions de paiement :</p>
                    <ul className="text-sm text-blue-700 dark:text-blue-400 list-disc list-inside space-y-1">
                        <li><strong>CCP:</strong> 12345678 KEY 99 (Trajetour)</li>
                        <li><strong>Baridimob:</strong> 00799999000000000000</li>
                    </ul>
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Montant Payé (DZD)
                    </label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                        max={remainingAmount + 100} // slight tolerance?
                    />
                    <p className="text-xs text-gray-500 mt-1">Montant restant dû: {remainingAmount.toLocaleString()} DZD</p>
                </div>

                {/* Method */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Méthode
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {['CCP', 'Baridimob', 'Cash'].map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setMethod(m as any)}
                                className={`py-2 px-3 rounded-lg text-sm font-bold border transition ${method === m
                                        ? 'bg-primary text-white border-primary'
                                        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary'
                                    }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                {/* File Upload */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        Photo du Reçu
                    </label>
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${file ? 'border-primary bg-blue-50 dark:bg-blue-900/10' : 'border-gray-300 dark:border-gray-700 hover:border-primary hover:bg-gray-50 dark:hover:bg-slate-800'
                            }`}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*,.pdf"
                        />
                        {file ? (
                            <div className="flex items-center justify-center gap-2 text-primary font-medium">
                                <span className="material-symbols-outlined">image</span>
                                {file.name}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <span className="material-symbols-outlined text-4xl text-gray-400">cloud_upload</span>
                                <p className="text-sm text-gray-500">Cliquez pour sélectionner une image</p>
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium">
                        {error}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-3 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-3 text-sm font-bold text-white bg-primary hover:bg-blue-600 rounded-xl transition shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-lg">send</span>
                                Envoyer
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ReceiptUploadModal;
