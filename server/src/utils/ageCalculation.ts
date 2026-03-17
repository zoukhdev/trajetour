/**
 * Age calculation utilities for hotel-based pricing
 */

/**
 * Calculate age from birthdate
 */
export function calculateAge(birthdate: string | Date): number {
    const birth = new Date(birthdate);
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
    birthdate: string | Date,
    offerHotels: Array<{
        infant_price: number;
        child_price: number;
        adult_price: number;
    }>
): number {
    const age = calculateAge(birthdate);
    const category = getAgeCategory(age);

    const priceKey = `${category}_price` as 'infant_price' | 'child_price' | 'adult_price';

    return offerHotels.reduce((total, hotel) => {
        return total + (parseFloat(String(hotel[priceKey])) || 0);
    }, 0);
}

/**
 * Calculate total order price for all passengers
 */
export function calculateOrderTotal(
    passengers: Array<{ birthdate: string | Date }>,
    offerHotels: Array<{
        infant_price: number;
        child_price: number;
        adult_price: number;
    }>
): number {
    return passengers.reduce((total, passenger) => {
        return total + calculatePassengerPrice(passenger.birthdate, offerHotels);
    }, 0);
}

/**
 * Enrich passengers with age and price information
 */
export function enrichPassengersWithPricing(
    passengers: Array<any>,
    offerHotels: Array<{
        infant_price: number;
        child_price: number;
        adult_price: number;
    }>
): Array<any> {
    return passengers.map(passenger => {
        const age = calculateAge(passenger.birthdate);
        const category = getAgeCategory(age);
        const price = calculatePassengerPrice(passenger.birthdate, offerHotels);

        return {
            ...passenger,
            age,
            age_category: category,
            price
        };
    });
}
