import { Text, type TextProps } from 'react-native';
import { useFonts } from 'expo-font';

interface ThemedTextProps extends TextProps {
    className?: string; // For Tailwind
    variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption';
}

export function ThemedText({ children, className = '', variant = 'body', style, ...props }: ThemedTextProps) {
    // Styles mapping to Tailwind classes
    const variantStyles = {
        h1: 'font-[Outfit_700Bold] text-3xl text-gray-900',
        h2: 'font-[Outfit_600SemiBold] text-2xl text-gray-800',
        h3: 'font-[Outfit_500Medium] text-xl text-gray-800',
        body: 'font-[Inter_400Regular] text-base text-gray-600',
        caption: 'font-[Inter_400Regular] text-sm text-gray-500',
    };

    const defaultStyle = variantStyles[variant];

    // Note: className prop is handled by NativeWind via babel plugin, but we combine strings here
    // If you use 'className' prop directly on <Text>, NativeWind processes it. 
    // We need to pass it through.

    return (
        <Text
            className={`${defaultStyle} ${className}`}
            style={style}
            {...props}
        >
            {children}
        </Text>
    );
}
