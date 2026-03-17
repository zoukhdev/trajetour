/**
 * Age calculation utilities for passenger pricing
 */

/**
 * Calculate age from birthdate
 */
export function calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}

/**
 * Get age category based on age
 * Infant: 0-2 years
 * Child: 3-17 years
 * Adult: 18+ years
 */
export function getAgeCategory(age: number): 'infant' | 'child' | 'adult' {
    if (age <= 2) return 'infant';
    if (age <= 17) return 'child';
    return 'adult';
}

/**
 * Calculate total price for a passenger based on birthdate and offer hotels
 */
export function calculatePassengerPrice(
    birthDate: string,
    offerHotels: Array<{
        infant_price: number;
        child_price: number;
        adult_price: number;
    }>
): number {
    if (!birthDate || !offerHotels || offerHotels.length === 0) {
        return 0;
    }

    const age = calculateAge(birthDate);
    const category = getAgeCategory(age);

    const priceKey = `${category}_price` as 'infant_price' | 'child_price' | 'adult_price';

    return offerHotels.reduce((total, hotel) => {
        return total + (parseFloat(String(hotel[priceKey])) || 0);
    }, 0);
}

/**
 * Get age category display name
 */
export function getAgeCategoryLabel(age: number): string {
    const category = getAgeCategory(age);
    switch (category) {
        case 'infant':
            return 'Infant (0-2 years)';
        case 'child':
            return 'Child (3-17 years)';
        case 'adult':
            return 'Adult (18+ years)';
        default:
            return '';
    }
}
