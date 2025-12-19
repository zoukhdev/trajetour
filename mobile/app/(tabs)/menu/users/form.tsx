import { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useData } from '../../../../context/DataContext';
import { ThemedText } from '../../../../components/ui/ThemedText';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';
import { ArrowLeft, User as UserIcon, Mail, Lock } from 'lucide-react-native';
import { User, Permission } from '../../../../types';

const AVAILABLE_PERMISSIONS: { key: Permission, label: string }[] = [
    { key: 'manage_users', label: 'Gérer les utilisateurs' },
    { key: 'manage_financials', label: 'Gérer les finances' },
    { key: 'manage_business', label: 'Gérer le business (Commandes...)' },
    { key: 'view_reports', label: 'Voir les rapports' },
];

export default function UserFormScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { users, addUser, updateUser } = useData();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<User>>({
        username: '',
        email: '',
        role: 'agent',
        permissions: [],
        password: '' // Only used for creation or explicit update
    });

    useEffect(() => {
        if (isEditMode && id) {
            const user = users.find(u => u.id === id);
            if (user) {
                setFormData({
                    ...user,
                    password: '' // Don't fill password
                });
            }
        }
    }, [id, isEditMode, users]);

    const updateField = (key: keyof User | 'password', value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const togglePermission = (perm: Permission) => {
        setFormData(prev => {
            const perms = prev.permissions || [];
            if (perms.includes(perm)) {
                return { ...prev, permissions: perms.filter(p => p !== perm) };
            } else {
                return { ...prev, permissions: [...perms, perm] };
            }
        });
    };

    const handleSubmit = async () => {
        if (!formData.username || !formData.email || (!isEditMode && !formData.password)) {
            Alert.alert('Erreur', 'Veuillez remplir les champs obligatoires');
            return;
        }

        setLoading(true);
        try {
            if (isEditMode && id) {
                // If password is empty, remove it from update
                const updateData = { ...formData };
                if (!updateData.password) delete updateData.password;

                await updateUser({ id, ...updateData } as User);
                Alert.alert('Succès', 'Utilisateur mis à jour');
            } else {
                const newUser: User = {
                    id: Math.random().toString(36).substr(2, 9), // Should be backend generated
                    ...formData as User
                };
                await addUser(newUser);
                Alert.alert('Succès', 'Utilisateur créé');
            }
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert('Erreur', 'Impossible d\'enregistrer l\'utilisateur');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            {/* Header */}
            <View className="px-4 pb-4 border-b border-gray-100 flex-row justify-between items-center bg-white shadow-sm z-10 pt-2">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={() => router.back()}>
                        <ArrowLeft size={24} color="#374151" />
                    </TouchableOpacity>
                    <ThemedText variant="h3">{isEditMode ? 'Modifier' : 'Nouveau'} Utilisateur</ThemedText>
                </View>
                <TouchableOpacity onPress={handleSubmit} disabled={loading}>
                    <ThemedText className={`font-semibold text-lg ${loading ? 'text-gray-400' : 'text-blue-600'}`}>
                        {loading ? '...' : 'Sauvegarder'}
                    </ThemedText>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4" contentContainerClassName="pb-24">
                <View className="space-y-4 mb-6">
                    <Input
                        label="Nom d'utilisateur"
                        value={formData.username}
                        onChangeText={v => updateField('username', v)}
                        startIcon={<UserIcon size={18} color="#9CA3AF" />}
                    />
                    <Input
                        label="Email"
                        value={formData.email}
                        onChangeText={v => updateField('email', v)}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        startIcon={<Mail size={18} color="#9CA3AF" />}
                    />
                    <Input
                        label={isEditMode ? "Nouveau mot de passe (laisser vide pour conserver)" : "Mot de passe"}
                        value={formData.password}
                        onChangeText={v => updateField('password', v)}
                        secureTextEntry
                        startIcon={<Lock size={18} color="#9CA3AF" />}
                    />
                </View>

                {/* Role Selector */}
                <View className="mb-6">
                    <ThemedText className="font-bold text-gray-900 mb-2">Rôle</ThemedText>
                    <View className="flex-row gap-2">
                        {['admin', 'agent', 'caisser'].map(role => (
                            <TouchableOpacity
                                key={role}
                                onPress={() => updateField('role', role)}
                                className={`flex-1 px-3 py-2 rounded-lg border items-center capitalize ${formData.role === role ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'
                                    }`}
                            >
                                <ThemedText className={`font-medium ${formData.role === role ? 'text-blue-800' : 'text-gray-600'}`}>{role}</ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Permissions */}
                <View className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
                    <ThemedText className="font-bold text-gray-900 mb-4">Permissions</ThemedText>
                    {AVAILABLE_PERMISSIONS.map((perm) => (
                        <View key={perm.key} className="flex-row items-center justify-between mb-4 last:mb-0">
                            <ThemedText className="text-gray-700">{perm.label}</ThemedText>
                            <Switch
                                value={formData.permissions?.includes(perm.key) || formData.role === 'admin'}
                                onValueChange={() => togglePermission(perm.key)}
                                disabled={formData.role === 'admin'} // Admin has all permissions
                                trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
                            />
                        </View>
                    ))}
                    {formData.role === 'admin' && (
                        <ThemedText className="text-xs text-gray-400 mt-2">* Les admins ont toutes les permissions par défaut.</ThemedText>
                    )}
                </View>

                <Button title={isEditMode ? "Mettre à jour" : "Créer"} onPress={handleSubmit} size="lg" loading={loading} />
            </ScrollView>
        </SafeAreaView>
    );
}
