import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext'; // Added
import { Search, Plus, Trash2, Edit2 } from 'lucide-react';
import Modal from '../../components/Modal';
import UserForm from './UserForm';
import type { User } from '../../types';

const UserList = () => {
    const { users, deleteUser } = useData();
    const { user: currentUser } = useAuth(); // Added
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingUser, setViewingUser] = useState<User | undefined>(undefined);
    const [editingUser, setEditingUser] = useState<User | undefined>(undefined);

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
        

    const handleView = (user: User) => {
        setViewingUser(user);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            deleteUser(id);
        }
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingUser(undefined);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800">
                    {currentUser?.agencyId ? "Gestion du Staff" : "Gestion des Utilisateurs"}
                </h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    <span>Nouvel Utilisateur</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher un utilisateur..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                            <tr>
                                <th className="hidden md:table-cell px-6 py-4">ID</th>
                                <th className="px-6 py-4">Utilisateur</th>
                                <th className="px-6 py-4">Rôle</th>
                                <th className="hidden md:table-cell px-6 py-4">Permissions</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50/80 transition-colors">
                                    <td className="hidden md:table-cell px-6 py-4 font-mono text-sm text-gray-600">
                                        #{user.code || user.id.substring(0, 8)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={user.avatar}
                                                alt={user.username}
                                                className="w-10 h-10 rounded-full bg-gray-200 object-cover border border-gray-100"
                                            />
                                            <div>
                                                <p className="font-semibold text-gray-900">{user.username}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${user.role === 'admin'
                                            ? 'bg-purple-50 text-purple-700 border-purple-100'
                                            : user.role === 'caisser'
                                                ? 'bg-green-50 text-green-700 border-green-100'
                                                : 'bg-blue-50 text-blue-700 border-blue-100'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="hidden md:table-cell px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {user.permissions.slice(0, 3).map(perm => (
                                                <span key={perm} className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded border border-gray-200">
                                                    {perm.split('_')[1]}
                                                </span>
                                            ))}
                                            {user.permissions.length > 3 && (
                                                <span className="px-2 py-1 bg-gray-50 text-gray-500 text-xs rounded border border-gray-200">
                                                    +{user.permissions.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleView(user)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Voir les détails"
                                            >
                                                <Search size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Modifier"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            {user.role !== 'admin' && (
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleClose}
                title={editingUser ? "Modifier Utilisateur" : "Nouvel Utilisateur"}
            >
                <UserForm onClose={handleClose} initialData={editingUser} />
            </Modal>

            {/* View User Details Modal */}
            <Modal
                isOpen={!!viewingUser}
                onClose={() => setViewingUser(undefined)}
                title="Détails de l'utilisateur"
            >
                {viewingUser && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <img
                                src={viewingUser.avatar}
                                alt={viewingUser.username}
                                className="w-20 h-20 rounded-full bg-gray-200 object-cover border-2 border-white shadow-md"
                            />
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{viewingUser.username}</h3>
                                <p className="text-gray-500">{viewingUser.email}</p>
                                <span className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${viewingUser.role === 'admin'
                                    ? 'bg-purple-50 text-purple-700 border-purple-100'
                                    : viewingUser.role === 'caisser'
                                        ? 'bg-green-50 text-green-700 border-green-100'
                                        : 'bg-blue-50 text-blue-700 border-blue-100'
                                    }`}>
                                    {viewingUser.role}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="block text-xs font-medium text-gray-500 uppercase mb-1">ID Utilisateur</span>
                                <span className="font-mono text-sm font-semibold text-gray-900">{viewingUser.code || viewingUser.id}</span>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="block text-xs font-medium text-gray-500 uppercase mb-1">Mot de passe</span>
                                <span className="font-mono text-sm font-semibold text-gray-900">••••••••</span>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Permissions accordées</h4>
                            <div className="flex flex-wrap gap-2">
                                {viewingUser.permissions.map(perm => (
                                    <span key={perm} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg border border-gray-200">
                                        {perm}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={() => setViewingUser(undefined)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default UserList;
