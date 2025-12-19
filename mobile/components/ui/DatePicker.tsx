import { View, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useState } from 'react';
import { ThemedText } from './ThemedText';
import { Calendar, X } from 'lucide-react-native';

interface DatePickerProps {
    value?: string; // Expected format: YYYY-MM-DD
    onChange: (date: string) => void;
    placeholder?: string;
    label?: string;
    minDate?: string;
    maxDate?: string;
}

export function DatePicker({ value, onChange, placeholder, label, minDate, maxDate }: DatePickerProps) {
    const [showModal, setShowModal] = useState(false);
    const [selectedYear, setSelectedYear] = useState<number>(
        value ? new Date(value).getFullYear() : new Date().getFullYear()
    );
    const [selectedMonth, setSelectedMonth] = useState<number>(
        value ? new Date(value).getMonth() : new Date().getMonth()
    );
    const [selectedDay, setSelectedDay] = useState<number>(
        value ? new Date(value).getDate() : new Date().getDate()
    );

    const formatDate = (date: string) => {
        if (!date) return placeholder || 'Sélectionner une date';
        try {
            const d = new Date(date);
            return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch {
            return placeholder || 'Sélectionner une date';
        }
    };

    const daysInMonth = (month: number, year: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month: number, year: number) => {
        return new Date(year, month, 1).getDay();
    };

    const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 50 + i);
    const months = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const handleDaySelect = (day: number) => {
        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        onChange(dateStr);
        setShowModal(false);
    };

    const renderCalendarDays = () => {
        const days = [];
        const totalDays = daysInMonth(selectedMonth, selectedYear);
        const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
        const startDay = firstDay === 0 ? 6 : firstDay - 1; // Adjust for Monday start

        // Empty cells before first day
        for (let i = 0; i < startDay; i++) {
            days.push(<View key={`empty-${i}`} className="w-10 h-10" />);
        }

        // Days of month
        for (let day = 1; day <= totalDays; day++) {
            const isSelected = value && new Date(value).getDate() === day &&
                new Date(value).getMonth() === selectedMonth &&
                new Date(value).getFullYear() === selectedYear;

            days.push(
                <TouchableOpacity
                    key={day}
                    onPress={() => handleDaySelect(day)}
                    className={`w-10 h-10 items-center justify-center rounded-lg ${isSelected ? 'bg-blue-600' : 'bg-gray-50'
                        }`}
                >
                    <ThemedText className={`text-sm ${isSelected ? 'text-white font-bold' : 'text-gray-700'}`}>
                        {day}
                    </ThemedText>
                </TouchableOpacity>
            );
        }

        return days;
    };

    return (
        <View>
            {label && (
                <ThemedText className="text-sm font-medium text-gray-700 mb-2">
                    {label}
                </ThemedText>
            )}
            <TouchableOpacity
                onPress={() => setShowModal(true)}
                className="bg-white border border-gray-300 rounded-lg px-4 py-3 flex-row items-center justify-between"
            >
                <ThemedText className={value ? 'text-gray-900' : 'text-gray-400'}>
                    {formatDate(value)}
                </ThemedText>
                <Calendar size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <Modal
                visible={showModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
                        {/* Header */}
                        <View className="flex-row justify-between items-center mb-6">
                            <ThemedText className="text-xl font-bold text-gray-900">
                                Sélectionner une date
                            </ThemedText>
                            <TouchableOpacity
                                onPress={() => setShowModal(false)}
                                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                            >
                                <X size={18} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {/* Month/Year Selectors */}
                        <View className="flex-row gap-2 mb-4">
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                className="flex-1"
                            >
                                {months.map((month, index) => (
                                    <TouchableOpacity
                                        key={month}
                                        onPress={() => setSelectedMonth(index)}
                                        className={`px-4 py-2 rounded-lg mr-2 ${selectedMonth === index ? 'bg-blue-600' : 'bg-gray-100'
                                            }`}
                                    >
                                        <ThemedText className={`text-sm ${selectedMonth === index ? 'text-white font-semibold' : 'text-gray-700'
                                            }`}>
                                            {month}
                                        </ThemedText>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="mb-6"
                        >
                            {years.map((year) => (
                                <TouchableOpacity
                                    key={year}
                                    onPress={() => setSelectedYear(year)}
                                    className={`px-4 py-2 rounded-lg mr-2 ${selectedYear === year ? 'bg-blue-600' : 'bg-gray-100'
                                        }`}
                                >
                                    <ThemedText className={`text-sm ${selectedYear === year ? 'text-white font-semibold' : 'text-gray-700'
                                        }`}>
                                        {year}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Weekday Headers */}
                        <View className="flex-row mb-2">
                            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
                                <View key={i} className="w-10 items-center">
                                    <ThemedText className="text-xs font-semibold text-gray-500">{day}</ThemedText>
                                </View>
                            ))}
                        </View>

                        {/* Calendar Grid */}
                        <View className="flex-row flex-wrap gap-1">
                            {renderCalendarDays()}
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
