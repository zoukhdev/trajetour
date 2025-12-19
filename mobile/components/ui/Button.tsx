import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { ThemedText } from './ThemedText';
import { cn } from '../../utils/cn'; // Assuming utils/cn exists or we use clsx/tailwind-merge directly

interface ButtonProps {
    onPress: () => void;
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    loading?: boolean;
    disabled?: boolean;
    className?: string;
    icon?: React.ReactNode;
}

export function Button({
    onPress,
    title,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    loading = false,
    disabled = false,
    className,
    icon
}: ButtonProps) {

    const showLoading = isLoading || loading;
    const baseStyles = "flex-row items-center justify-center rounded-xl active:opacity-80";

    const variants = {
        primary: "bg-blue-600",
        secondary: "bg-gray-100",
        outline: "bg-transparent border border-gray-300",
        ghost: "bg-transparent",
        danger: "bg-red-500",
    };

    const textVariants = {
        primary: "text-white font-[Outfit_600SemiBold]",
        secondary: "text-gray-900 font-[Outfit_600SemiBold]",
        outline: "text-gray-700 font-[Outfit_500Medium]",
        ghost: "text-blue-600 font-[Outfit_500Medium]",
        danger: "text-white font-[Outfit_600SemiBold]",
    };

    const sizes = {
        sm: "px-3 py-2",
        md: "px-4 py-3",
        lg: "px-6 py-4",
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || showLoading}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50' : ''} ${className || ''}`}
        >
            {showLoading ? (
                <ActivityIndicator color={variant === 'outline' || variant === 'secondary' ? '#000' : '#FFF'} />
            ) : (
                <>
                    {icon && <>{icon}</>}
                    <Text className={`${textVariants[variant]} ${icon ? 'ml-2' : ''} text-center`}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}
