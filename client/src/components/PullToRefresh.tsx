import React, { useState, useRef } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface PullToRefreshProps {
    onRefresh: () => Promise<any>;
    children: React.ReactNode;
}

const PullToRefresh = ({ onRefresh, children }: PullToRefreshProps) => {
    const [startY, setStartY] = useState(0);
    const [currentY, setCurrentY] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const MIN_PULL_DISTANCE = 80;
    const MAX_PULL_DISTANCE = 160;

    const handleTouchStart = (e: React.TouchEvent) => {
        // Only enable if we are at the top of the scroll
        if (window.scrollY === 0 && !refreshing) {
            setStartY(e.touches[0].clientY);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!startY || refreshing || window.scrollY > 0) return;

        const y = e.touches[0].clientY;
        const diff = y - startY;

        if (diff > 0) {
            // Add resistance
            const dampedDiff = Math.min(diff * 0.5, MAX_PULL_DISTANCE);
            setCurrentY(dampedDiff);
            // Prevent native scroll if pulling down
            if (e.cancelable) e.preventDefault();
        }
    };

    const handleTouchEnd = async () => {
        if (!startY || refreshing) return;

        if (currentY > MIN_PULL_DISTANCE) {
            setRefreshing(true);
            setCurrentY(MIN_PULL_DISTANCE); // Hold at minimal distance while refreshing
            try {
                await onRefresh();
            } finally {
                // Reset
                setRefreshing(false);
                setCurrentY(0);
                setStartY(0);
            }
        } else {
            // Spring back
            setCurrentY(0);
            setStartY(0);
        }
    };

    return (
        <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="min-h-screen relative"
            ref={contentRef}
        >
            {/* Refresh Indicator */}
            <div
                className={cn(
                    "fixed top-0 left-0 right-0 flex justify-center items-center pointer-events-none transition-transform duration-200 z-50",
                    refreshing ? "opacity-100" : "opacity-0" // Hide when not active/refreshing to avoid blocking clicks if huge
                )}
                style={{
                    height: `${Math.max(currentY, refreshing ? MIN_PULL_DISTANCE : 0)}px`,
                    opacity: currentY > 0 ? 1 : 0
                }}
            >
                <div className="bg-white rounded-full p-2 shadow-md border border-gray-100">
                    {refreshing ? (
                        <Loader2 className="animate-spin text-primary" size={20} />
                    ) : (
                        <ArrowDown
                            className={cn("text-gray-400 transition-transform duration-200", currentY > MIN_PULL_DISTANCE ? "rotate-180 text-primary" : "")}
                            size={20}
                        />
                    )}
                </div>
            </div>

            {/* Content */}
            <div
                style={{
                    transform: `translateY(${currentY}px)`,
                    transition: refreshing || currentY === 0 ? 'transform 0.3s ease-out' : 'none'
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default PullToRefresh;
