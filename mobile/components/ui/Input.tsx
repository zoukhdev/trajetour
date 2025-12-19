import { TextInput, View, type TextInputProps } from 'react-native';
import { ThemedText } from './ThemedText';
import { cn } from '../../utils/cn';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerClassName?: string;
    startIcon?: React.ReactNode;
}

export function Input({ label, error, containerClassName, className, startIcon, ...props }: InputProps) {
    return (
        <View className={cn("w-full mb-4", containerClassName)}>
            {label && (
                <ThemedText className="mb-2 text-sm font-[Inter_500Medium] text-gray-700">
                    {label}
                </ThemedText>
            )}
            <View className="relative">
                {startIcon && (
                    <View className="absolute left-4 top-3.5 z-10">
                        {startIcon}
                    </View>
                )}
                <TextInput
                    className={cn(
                        "w-full py-3 bg-gray-50 border border-gray-200 rounded-xl font-[Inter_400Regular] text-gray-900",
                        startIcon ? "pl-12 pr-4" : "px-4",
                        "focus:border-blue-500 focus:bg-white",
                        error && "border-red-500 bg-red-50",
                        className
                    )}
                    placeholderTextColor="#9CA3AF"
                    {...props}
                />
            </View>
            {error && (
                <ThemedText className="mt-1 text-xs text-red-500">
                    {error}
                </ThemedText>
            )}
        </View>
    );
}
