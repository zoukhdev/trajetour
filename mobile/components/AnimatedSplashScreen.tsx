import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';

// Global counter removed - no longer needed for production

interface AnimatedSplashScreenProps {
    onComplete: () => void;
}

export default function AnimatedSplashScreen({ onComplete }: AnimatedSplashScreenProps) {
    const videoRef = useRef<Video>(null);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const hasCompletedRef = useRef(false);

    useEffect(() => {
        // Set navigation bar to transparent for true edge-to-edge
        if (Platform.OS === 'android') {
            NavigationBar.setVisibilityAsync('hidden');
            NavigationBar.setBackgroundColorAsync('#00000000'); // Transparent
        }

        return () => {
            // Restore navigation bar when leaving splash
            if (Platform.OS === 'android') {
                NavigationBar.setVisibilityAsync('visible');
            }
        };
    }, []);

    useEffect(() => {
        // Auto-play video when ready
        if (isVideoReady && videoRef.current) {
            videoRef.current.playAsync();
        }
    }, [isVideoReady]);

    useEffect(() => {
        // Force complete after 5 seconds max
        const timeout = setTimeout(() => {
            if (!hasCompletedRef.current) {
                hasCompletedRef.current = true;
                onComplete();
            }
        }, 5000);

        return () => clearTimeout(timeout);
    }, []);

    const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (status.isLoaded && status.didJustFinish) {
            if (!hasCompletedRef.current) {
                hasCompletedRef.current = true;
                onComplete();
            }
        }
    };

    const handleVideoLoad = () => {
        setIsVideoReady(true);
    };

    const handleVideoError = (error: string) => {
        console.error('Video splash screen error:', error);
        if (!hasCompletedRef.current) {
            hasCompletedRef.current = true;
            onComplete();
        }
    };

    return (
        <View style={styles.container}>
            {/* Fully transparent status bar */}
            <StatusBar style="light" translucent backgroundColor="transparent" hidden={false} />

            <Video
                ref={videoRef}
                source={require('../assets/splash.mp4')}
                style={styles.video}
                resizeMode={ResizeMode.COVER}
                shouldPlay={false}
                isLooping={false}
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                onLoad={handleVideoLoad}
                onError={handleVideoError}
            />
        </View>
    );
}

// Get full screen dimensions
const { width, height } = Dimensions.get('screen'); // Use 'screen' not 'window' for true full screen

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: width,
        height: height,
        backgroundColor: '#ffffff',
    },
    video: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: width,
        height: height,
    },
});
