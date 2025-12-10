import { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import type { User, UserRole, Permission } from '../../types';
import { Shield, Check } from 'lucide-react';

interface UserFormProps {
    onClose: () => void;
    initialData?: User;
}

const ALL_PERMISSIONS: { id: Permission; label: string }[] = [
    { id: 'manage_users', label: 'Gérer les Utilisateurs' },
    { id: 'manage_business', label: 'Gérer Clients/Agences/Commandes' },
    { id: 'manage_financials', label: 'Gérer Finances (Caisse/Charges)' },
    { id: 'view_reports', label: 'Voir les Rapports' },
];

const UserForm = ({ onClose, initialData }: UserFormProps) => {
    const { addUser, updateUser } = useData();

    const [formData, setFormData] = useState<Partial<User>>(
        initialData || {
            username: '',
            email: '',
            password: '',
            role: 'staff',
            permissions: []
        }
    );

    // Auto-select permissions based on role change
    useEffect(() => {
        if (!initialData) { // Only auto-set for new users or manual role change
            if (formData.role === 'admin') {
                setFormData(prev => ({ ...prev, permissions: ALL_PERMISSIONS.map(p => p.id) }));
            } else if (formData.role === 'caisser') {
                setFormData(prev => ({ ...prev, permissions: ['manage_financials'] }));
            } else if (formData.role === 'staff') {
                setFormData(prev => ({ ...prev, permissions: ['manage_business'] }));
            }
        }
    }, [formData.role]);

    const togglePermission = (permission: Permission) => {
        setFormData(prev => {
            const current = prev.permissions || [];
            if (current.includes(permission)) {
                return { ...prev, permissions: current.filter(p => p !== permission) };
            } else {
                return { ...prev, permissions: [...current, permission] };
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const userData: User = {
            id: initialData?.id || Math.floor(1000 + Math.random() * 9000).toString(),
            username: formData.username!,
            email: formData.email!,
            password: formData.password!, // In real app, hash this
            role: formData.role as UserRole,
            permissions: formData.permissions || [],
            avatar: initialData?.avatar || `https://ui-avatars.com/api/?name=${formData.username}&background=random`
        };

        if (initialData) {
            updateUser(userData);
        } else {
            addUser(userData);
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                    <div className="flex gap-4">
                        {['admin', 'staff', 'caisser'].map((role) => (
                            <label key={role} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="role"
                                    value={role}
                                    checked={formData.role === role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                                    className="text-primary focus:ring-primary"
                                />
                                <span className="text-sm text-gray-700 capitalize">{role}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur</label>
                    <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                    <input
                        type="text" // Visible for admin to set/reset
                        required
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-mono"
                        placeholder="Définir un mot de passe"
                    />
                </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Shield size={16} className="text-primary" />
                    Permissions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ALL_PERMISSIONS.map((perm) => (
                        <div
                            key={perm.id}
                            onClick={() => togglePermission(perm.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${formData.permissions?.includes(perm.id)
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <span className="text-sm font-medium">{perm.label}</span>
                            {formData.permissions?.includes(perm.id) && <Check size={16} />}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {initialData ? 'Mettre à jour' : 'Créer Utilisateur'}
                </button>
            </div>
        </form>
    );
};

export default UserForm;
