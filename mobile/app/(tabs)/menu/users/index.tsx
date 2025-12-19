import { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useData } from '../../../../context/DataContext';
import { useAuth } from '../../../../context/AuthContext';
import { ThemedText } from '../../../../components/ui/ThemedText';
import { Input } from '../../../../components/ui/Input';
import { Plus, Search, User as UserIcon, Trash2, Pencil, Shield } from 'lucide-react-native';

export default function UserListScreen() {
    const router = useRouter();
    const { users, deleteUser } = useData();
    const { user: currentUser } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleDelete = (id: string) => {
        if (id === currentUser?.id) {
            Alert.alert("Erreur", "Vous ne pouvez pas supprimer votre propre compte");
            return;
        }

        Alert.alert(
            "Supprimer",
            "Voulez-vous vraiment supprimer cet utilisateur ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteUser(id);
                        } catch (error) {
                            Alert.alert('Erreur', 'Impossible de supprimer l\'utilisateur');
                        }
                    }
                }
            ]
        );
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-800';
            case 'caisser': return 'bg-green-100 text-green-800';
            default: return 'bg-blue-100 text-blue-800';
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 shadow-sm z-10 flex-row justify-between items-center">
                <View>
                    <ThemedText variant="h2" className="text-gray-900">Utilisateurs</ThemedText>
                    <ThemedText className="text-xs text-gray-500">{users.length} comptes</ThemedText>
                </View>
                <TouchableOpacity
                    onPress={() => router.push('/(tabs)/profile/users/form')}
                    className="bg-blue-600 px-3 py-2 rounded-lg flex-row items-center gap-2 shadow-md"
                >
                    <Plus size={18} color="white" />
                    <ThemedText className="text-white font-bold text-sm">Nouveau</ThemedText>
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View className="px-4 py-3 bg-white border-b border-gray-100">
                <Input
                    placeholder="Nom ou email..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    containerClassName="mb-0"
                    startIcon={<Search size={20} color="#9CA3AF" />}
                />
            </View>

            <ScrollView className="flex-1 p-4">
                {filteredUsers.map((user) => (
                    <View key={user.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3 flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3 flex-1">
                            <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center overflow-hidden border border-gray-200">
                                {user.avatar ? (
                                    <Image source={{ uri: user.avatar }} className="w-full h-full" />
                                ) : (
                                    <UserIcon size={20} color="#9CA3AF" />
                                )}
                            </View>
                            <View className="flex-1">
                                <ThemedText className="font-bold text-gray-900">{user.username}</ThemedText>
                                <ThemedText className="text-xs text-gray-500">{user.email}</ThemedText>
                                <View className={`self-start mt-1 px-2 py-0.5 rounded-full ${getRoleColor(user.role)}`}>
                                    <ThemedText className="text-[10px] font-bold uppercase">{user.role}</ThemedText>
                                </View>
                            </View>
                        </View>

                        <View className="flex-row gap-2">
                            <TouchableOpacity
                                onPress={() => router.push({ pathname: '/(tabs)/profile/users/form', params: { id: user.id } })}
                                className="bg-gray-50 p-2 rounded-lg border border-gray-200"
                            >
                                <Pencil size={18} color="#4B5563" />
                            </TouchableOpacity>
                            {user.id !== currentUser?.id && (
                                <TouchableOpacity
                                    onPress={() => handleDelete(user.id)}
                                    className="bg-red-50 p-2 rounded-lg border border-red-100"
                                >
                                    <Trash2 size={18} color="#EF4444" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}
