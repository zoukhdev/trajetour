import { useState } from 'react';
import { View, Image, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '../components/ui/ThemedText';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        setIsLoading(true);
        try {
            const success = await login(email, password);
            if (success) {
                // Navigate to dashboard
                router.replace('/(tabs)'); // Assuming we will create tabs layout
            } else {
                Alert.alert('Erreur', 'Email ou mot de passe incorrect');
            }
        } catch (error) {
            Alert.alert('Erreur', 'Une erreur est survenue');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            <ScrollView contentContainerClassName="flex-grow justify-center px-6">
                <View className="items-center mb-10">
                    {/* Logo Placeholder */}
                    <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4">
                        <ThemedText variant="h1" className="text-blue-600">WR</ThemedText>
                    </View>
                    <ThemedText variant="h1" className="text-center mb-2">Bon retour !</ThemedText>
                    <ThemedText className="text-center text-gray-500">Connectez-vous pour continuer</ThemedText>
                </View>

                <View className="space-y-4 w-full max-w-sm mx-auto">
                    <Input
                        label="Email"
                        placeholder="votre@email.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <Input
                        label="Mot de passe"
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <Button
                        title="Se connecter"
                        onPress={handleLogin}
                        isLoading={isLoading}
                        className="mt-4"
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
