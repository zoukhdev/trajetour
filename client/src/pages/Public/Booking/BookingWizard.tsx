import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { packagesAPI, ordersAPI, clientsAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { calculateAge, getAgeCategory, calculatePassengerPrice, getAgeCategoryLabel } from '../../../utils/ageUtils';

interface Passenger {
    firstName: string;
    lastName: string;
    passportNumber: string;
    birthDate: string;
    nationality: string;
    phoneNumber?: string; // Essential for Client creation
    price?: number;
    age?: number;
    ageCategory?: 'infant' | 'child' | 'adult';
}



const BookingWizard = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // State
    const [step, setStep] = useState(1);
    const [packageData, setPackageData] = useState<any>(null);
    const [offerHotels, setOfferHotels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingPricing, setLoadingPricing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [passengers, setPassengers] = useState<Passenger[]>([
        { firstName: '', lastName: '', passportNumber: '', birthDate: '', nationality: '' }
    ]);

    // Fetch Package Data and Offer Hotels Pricing
    useEffect(() => {
        const fetchPackage = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const data = await packagesAPI.getById(id);
                setPackageData(data);
                // Pre-fill first passenger if user is logged in
                if (user) {
                    setPassengers(prev => [{
                        ...prev[0],
                        firstName: user.firstName || '',
                        lastName: user.lastName || '',
                    }]);
                }

                // Fetch offer hotels pricing
                await fetchOfferHotels(id);
            } catch (err) {
                console.error("Failed to load package:", err);
                setError("Failed to load package details. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchPackage();
    }, [id, user]);

    // Fetch Offer Hotels for Pricing
    const fetchOfferHotels = async (offerId: string) => {
        try {
            setLoadingPricing(true);
            const response = await fetch(`/api/offers/${offerId}/hotels`, {
                credentials: 'include'
            });
            const data = await response.json();
            setOfferHotels(data.hotels || []);
            console.log('Offer Hotels Pricing:', data.hotels);
        } catch (err) {
            console.error('Error fetching offer hotels:', err);
            // Don't show error to user, just log it - pricing is optional enhancement
        } finally {
            setLoadingPricing(false);
        }
    };

    // Handlers
    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const handlePassengerChange = (index: number, field: keyof Passenger, value: string) => {
        const newPassengers = [...passengers];
        newPassengers[index] = { ...newPassengers[index], [field]: value };

        // If birth date changed, calculate age and price
        if (field === 'birthDate' && value) {
            const age = calculateAge(value);
            const ageCategory = getAgeCategory(age);
            const price = calculatePassengerPrice(value, offerHotels);

            newPassengers[index] = {
                ...newPassengers[index],
                age,
                ageCategory,
                price
            };
        }

        setPassengers(newPassengers);
    };

    const addPassenger = () => {
        setPassengers([...passengers, { firstName: '', lastName: '', passportNumber: '', birthDate: '', nationality: '' }]);
    };

    const removePassenger = (index: number) => {
        if (passengers.length === 1) return;
        setPassengers(passengers.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!user) {
            navigate('/login?redirect=/book/' + id);
            return;
        }

        try {
            setIsSubmitting(true);
            // Calculate total from individual passenger prices if available
            const totalAmount = passengers.reduce((sum, p) => sum + (p.price || packageData?.price || 0), 0);


            // Sanitize passengers to match API schema (remove client-side fields)
            const sanitizedPassengers = passengers.map(({ age, ageCategory, price, ...p }) => {
                // Map frontend age category to backend codes
                let backendAgeCategory: 'ADT' | 'CHD' | 'INF' | undefined;
                if (ageCategory === 'adult') backendAgeCategory = 'ADT';
                else if (ageCategory === 'child') backendAgeCategory = 'CHD';
                else if (ageCategory === 'infant') backendAgeCategory = 'INF';

                return {
                    firstName: p.firstName,
                    lastName: p.lastName,
                    birthDate: p.birthDate || '',
                    passportNumber: p.passportNumber || '',
                    passportExpiry: '', // Frontend might not even collect this yet
                    nationality: p.nationality || '',
                    phoneNumber: p.phoneNumber || '',
                    // Only include gender if it's set to a valid value, otherwise undefined or default
                    // valid values: 'Homme' | 'Femme'
                    gender: (p as any).gender || undefined,
                    ageCategory: backendAgeCategory
                };
            });

            // Determine Client ID
            let finalClientId = user.clientId;

            // If user is an agent (or doesn't have a linked Client ID), we must create/find a Client for this booking
            if (!finalClientId) {
                // Use the first passenger as the "Client" (Lead Passenger)
                const leadPassenger = sanitizedPassengers[0];
                if (!leadPassenger.phoneNumber) {
                    setError("For agency bookings, the first passenger must have a phone number to create a client record.");
                    setIsSubmitting(false);
                    return;
                }

                try {
                    // Start by trying to create a NEW client
                    // In a real app, we'd search first, but here we'll let 'create' handle it (or assuming no dupes filter yet)
                    // If creating fails due to duplicate (e.g. mobile number unique), we might need to handle catch block
                    const newClientData = {
                        fullName: `${leadPassenger.firstName} ${leadPassenger.lastName}`,
                        mobileNumber: leadPassenger.phoneNumber,
                        type: 'Individual',
                        passportNumber: leadPassenger.passportNumber,
                        passportExpiry: leadPassenger.passportExpiry || ''
                    };

                    const clientResponse = await clientsAPI.create(newClientData);
                    finalClientId = clientResponse.id;
                    console.log("Created/Found Client ID:", finalClientId);

                } catch (clientErr) {
                    // Fallback: This is risky without search, but if create failed, 
                    // ideally we should search. For now logging errors.
                    console.error("Failed to create client from passenger:", clientErr);
                    // If validation failed likely due to duplicates, we can't easily recover without search API
                    // But blocking is better than invalid FK error
                    setError("Could not create client record for this passenger. Please check details.");
                    setIsSubmitting(false);
                    return;
                }
            }

            const orderData = {
                clientId: finalClientId, // Use resolved Client ID
                agencyId: user.agencyId || null, // Link to agency if applicable
                offerId: id, // Required for backend age-based pricing calculation
                // Add package as an item since offerId is not top-level
                items: [{
                    id: id,
                    description: packageData.title || packageData.name,
                    quantity: passengers.length,
                    unitPrice: packageData.price,
                    amount: totalAmount
                }],
                passengers: sanitizedPassengers,
                totalAmount: totalAmount,
                totalAmountDZD: totalAmount, // For multi-currency support usually same if base is DZD
                notes: `Booked via Booking Wizard for Package: ${packageData.title}`,
                status: 'Non payé' // Initial status must be one of allowed enum values ('Payé', 'Non payé', 'Partiel')
            };

            const createdOrder = await ordersAPI.create(orderData);
            console.log("Order Created:", createdOrder);

            // Redirect to success or dashboard
            // Redirect to success or dashboard based on role
            if (user?.agencyId || user?.role === 'agent') {
                navigate('/agency/bookings', { state: { successMessage: 'Booking created successfully!' } });
            } else {
                navigate('/dashboard/client', { state: { successMessage: 'Booking created successfully!' } });
            }

        } catch (err: any) {
            console.error("Booking failed:", err);
            setError(err.response?.data?.message || err.response?.data?.error || "Booking failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center min-h-screen"><span className="loader">Loading...</span></div>;
    if (error) return <div className="text-red-500 text-center py-20">{error}</div>;
    if (!packageData) return <div className="text-center py-20">Package not found</div>;

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen py-10 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Stepper */}
                <div className="flex justify-between items-center mb-10 relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 -z-10"></div>
                    {[1, 2, 3].map((s) => (
                        <div key={s} className={`flex flex-col items-center gap-2 bg-background-light dark:bg-background-dark px-2`}>
                            <div className={`size-10 rounded-full flex items-center justify-center font-bold text-white transition-colors ${step >= s ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'}`}>
                                {s}
                            </div>
                            <span className={`text-sm font-bold ${step >= s ? 'text-primary' : 'text-gray-400'}`}>
                                {s === 1 ? 'Package' : s === 2 ? 'Details' : 'Confirm'}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 min-h-[400px]">
                    {step === 1 && (
                        <div>
                            <h2 className="text-2xl font-bold mb-6 text-[#0e141b] dark:text-white">Review Package</h2>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl mb-6">
                                <h3 className="text-xl font-bold text-primary mb-2">{packageData.name}</h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">{packageData.description}</p>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined">calendar_today</span> {packageData.duration || '14 Days'}</span>
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined">flight</span> {packageData.flight || 'Included'}</span>
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined">location_on</span> {packageData.destination || 'Makkah & Madinah'}</span>
                                </div>
                                <div className="mt-4 text-2xl font-bold text-green-600 dark:text-green-400">
                                    {packageData.price} DZD <span className="text-sm font-normal text-gray-500">/ person</span>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button onClick={nextStep} className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-600 transition flex items-center gap-2">
                                    Next: Enter Details <span className="material-symbols-outlined">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-[#0e141b] dark:text-white">Passenger Details</h2>
                                <button onClick={addPassenger} className="text-primary font-bold flex items-center gap-1 hover:underline">
                                    <span className="material-symbols-outlined">add_circle</span> Add Passenger
                                </button>
                            </div>

                            <div className="space-y-6">
                                {passengers.map((passenger, index) => (
                                    <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl relative">
                                        <div className="flex justify-between mb-4">
                                            <h4 className="font-bold text-gray-700 dark:text-gray-300">Passenger {index + 1}</h4>
                                            {passengers.length > 1 && (
                                                <button onClick={() => removePassenger(index)} className="text-red-500 hover:text-red-700">
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="form-group">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                                                <input required type="text" value={passenger.firstName} onChange={(e) => handlePassengerChange(index, 'firstName', e.target.value)} className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-2.5" />
                                            </div>
                                            <div className="form-group">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                                                <input required type="text" value={passenger.lastName} onChange={(e) => handlePassengerChange(index, 'lastName', e.target.value)} className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-2.5" />
                                            </div>
                                            <div className="form-group">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Passport Number</label>
                                                <input required type="text" value={passenger.passportNumber} onChange={(e) => handlePassengerChange(index, 'passportNumber', e.target.value)} className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-2.5" />
                                            </div>
                                            <div className="form-group">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Birth Date</label>
                                                <input required type="date" onClick={(e) => (e.target as HTMLInputElement).showPicker()} value={passenger.birthDate} onChange={(e) => handlePassengerChange(index, 'birthDate', e.target.value)} className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-2.5" />
                                            </div>
                                            <div className="form-group">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nationality</label>
                                                <input required type="text" value={passenger.nationality} onChange={(e) => handlePassengerChange(index, 'nationality', e.target.value)} className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-2.5" placeholder="e.g. Algerian" />
                                            </div>
                                            <div className="form-group">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number {index === 0 && <span className="text-red-500">*</span>}</label>
                                                <input
                                                    type="tel"
                                                    value={passenger.phoneNumber || ''}
                                                    onChange={(e) => handlePassengerChange(index, 'phoneNumber', e.target.value)}
                                                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-2.5"
                                                    placeholder="Required for first passenger"
                                                    required={index === 0}
                                                />
                                            </div>
                                        </div>

                                        {/* Price and Age Category Display */}
                                        {passenger.birthDate && passenger.price !== undefined && (
                                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">person</span>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                Age: {passenger.age} years
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                {getAgeCategoryLabel(passenger.age || 0)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-primary">
                                                            {passenger.price.toLocaleString()} DZD
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Price</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 flex justify-between">
                                <button onClick={prevStep} className="text-gray-500 font-bold hover:text-gray-700">Back</button>
                                <button onClick={nextStep} className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-600 transition flex items-center gap-2">
                                    Next: Payment <span className="material-symbols-outlined">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div>
                            <h2 className="text-2xl font-bold mb-6 text-[#0e141b] dark:text-white">Payment & Confirmation</h2>

                            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl space-y-4 mb-8">
                                <div className="flex justify-between items-center text-lg">
                                    <span className="text-gray-600 dark:text-gray-400">Package:</span>
                                    <span className="font-bold text-[#0e141b] dark:text-white">{packageData.name}</span>
                                </div>
                                <div className="flex justify-between items-center text-lg">
                                    <span className="text-gray-600 dark:text-gray-400">Passengers:</span>
                                    <span className="font-bold text-[#0e141b] dark:text-white">{passengers.length}</span>
                                </div>

                                {/* Passenger Price Breakdown */}
                                {passengers.some(p => p.price !== undefined) && (
                                    <div className="space-y-2 pt-2">
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Price Breakdown:</p>
                                        {passengers.map((passenger, index) => (
                                            passenger.price !== undefined && (
                                                <div key={index} className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-600 dark:text-gray-400">
                                                        {passenger.firstName || `Passenger ${index + 1}`}
                                                        {passenger.ageCategory && ` (${passenger.ageCategory.charAt(0).toUpperCase() + passenger.ageCategory.slice(1)})`}
                                                    </span>
                                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                                        {passenger.price.toLocaleString()} DZD
                                                    </span>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                )}

                                <div className="h-px bg-gray-200 dark:bg-gray-600 my-4"></div>
                                <div className="flex justify-between items-center text-2xl font-bold text-primary">
                                    <span>Total:</span>
                                    <span>{passengers.reduce((sum, p) => sum + (p.price || packageData?.price || 0), 0).toLocaleString()} DZD</span>
                                </div>
                            </div>

                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg flex gap-3 text-yellow-800 dark:text-yellow-200 mb-6">
                                <span className="material-symbols-outlined">info</span>
                                <p className="text-sm">By confirming, your order will be placed as "Pending". An agent will contact you for payment processing.</p>
                            </div>

                            <div className="mt-8 flex justify-between">
                                <button onClick={prevStep} className="text-gray-500 font-bold hover:text-gray-700">Back</button>
                                <button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isSubmitting ? 'Processing...' : 'Confirm Booking'} <span className="material-symbols-outlined">check_circle</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


export default BookingWizard;
