export type UserRole = 'admin' | 'staff' | 'caisser';

export type Permission =
    | 'manage_users'
    | 'manage_business' // Clients, Agencies, Orders
    | 'manage_financials' // Expenses, Caisse
    | 'view_reports';

export interface User {
    id: string;
    username: string;
    email: string;
    password?: string; // In a real app, this would be hashed. For mock, we store it.
    role: UserRole;
    permissions: Permission[];
    avatar?: string;
}

export interface Client {
    id: string;
    fullName: string;
    mobileNumber: string;
    type: 'Individual' | 'Entreprise';
    passportNumber?: string;
    passportExpiry?: string;
}

export interface Agency {
    id: string;
    name: string;
    type: 'Agence' | 'Rabbateur';
    email?: string;
    phone?: string;
    address?: string;
    logo?: string;
    invoicePrefix?: string;
    invoiceFooter?: string;
    subscription?: 'Standard' | 'Premium' | 'Gold';
    creditStart: number;
    currentCredit: number;
}

// Exchange Rate History for multi-currency support
export interface ExchangeRateRecord {
    id: string;
    date: string; // YYYY-MM-DD
    sarToDzd: number;
    eurToDzd: number;
    usdToDzd?: number;
    createdBy: string;
    createdAt: string;
}

// Passenger details for orders
export interface Passenger {
    id: string;
    firstName: string;
    lastName: string;
    passportNumber?: string;
    passportExpiry?: string;
    phoneNumber?: string;
    email?: string;
    birthDate?: string;
    gender?: 'Homme' | 'Femme';
    roomType?: 'Single' | 'Double' | 'Triple' | 'Quad';
    assignedRoomId?: string; // UUID of assigned Room
    photo?: string; // Base64
}

export interface Hotel {
    name: string;
}

export interface Room {
    id: string;
    offerId?: string;
    hotelName: string;
    roomNumber: string;
    capacity: number;
    gender: 'MEN' | 'WOMEN' | 'MIXED';
    status: 'ACTIVE' | 'OUT_OF_SERVICE';
    price: number;
    occupiedCount?: number; // From backend
}

export interface OrderItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number; // In order currency
    amount: number; // In order currency (quantity * unitPrice)
    amountDZD?: number; // DZD equivalent for foreign currency items
}

export type PaymentMethod = 'Cash' | 'CCP' | 'Baridimob' | 'Bank Transfer';
export type Currency = 'DZD' | 'EUR' | 'USD' | 'SAR';

export interface Payment {
    id: string;
    amount: number; // In payment currency
    currency: Currency;
    amountDZD: number; // DZD equivalent
    exchangeRateUsed: number; // 1 Foreign = X DZD
    exchangeRateDate: string; // Date of rate used
    method: PaymentMethod;
    date: string;
    accountId?: string;
    isValidated?: boolean; // Admin validation status
}

export type OrderStatus = 'Payé' | 'Non payé' | 'Partiel';

export interface Order {
    id: string;
    clientId: string;
    agencyId?: string;

    // UPDATED: Multiple passengers instead of single
    passengers: Passenger[]; // Array of passengers
    hotels: Hotel[]; // Array of hotels

    // Commission fields
    commissionPerPassengerDZD?: number; // Manual input per passenger
    totalCommissionDZD?: number; // Calculated: passengers.length × commission

    // Multi-currency support
    orderCurrency: 'DZD' | 'SAR' | 'EUR';

    items: OrderItem[];
    totalAmount: number; // In order currency
    totalAmountDZD: number; // DZD equivalent
    exchangeRateUsed?: number; // Rate used for conversion

    // FIFO Payment Allocation
    remainingBalanceDZD: number; // Outstanding amount in DZD

    payments: Payment[];
    status: OrderStatus;
    createdAt: string;
    createdBy: string; // User ID
    notes?: string;

    // Joined fields
    clientName?: string;
    clientMobile?: string;
}

export type ExpenseCategory = 'Bureau' | 'Salaire' | 'Transport' | 'Autre';

export interface Expense {
    id: string;
    designation: string;
    category: ExpenseCategory;
    amount: number;
    currency: Currency;
    exchangeRate: number;
    amountDZD: number;
    date: string;
    createdBy: string;
    accountId?: string; // Account used for payment
}

export type TransactionType = 'IN' | 'OUT';
export type TransactionSource = 'Order' | 'Expense';

export interface Transaction {
    id: string;
    type: TransactionType;
    amount: number; // In transaction currency
    amountDZD: number; // DZD equivalent
    currency: Currency;
    exchangeRateUsed?: number;
    exchangeRateDate?: string;
    source: TransactionSource;
    referenceId: string; // Order ID or Expense ID
    description: string;
    date: string;
    accountId?: string; // Link to BankAccount
}

export interface Supplier {
    id: string;
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    serviceType: string; // e.g., Hotel, Transport, Visa
}

export type OfferType = 'Omra' | 'Haj' | 'Voyage Organisé' | 'Visa' | 'Autre';

export interface Offer {
    id: string;
    title: string;
    type: OfferType;
    destination: string;
    price: number; // Base price in DZD
    disponibilite: number; // Number of available places
    defaultAgencyCommission?: number; // Suggested commission in DZD
    startDate: string;
    endDate: string;
    hotel?: string;
    transport?: 'Avion' | 'Bus' | 'Sans Transport';
    description?: string;
    status: 'Active' | 'Draft' | 'Archived';

    // Offer inclusions (Step 2 - Section A)
    inclusions?: {
        visa: boolean;
        transfer: boolean;
        assurance: boolean;
        guide: boolean;
        photos: boolean;
        excursions: boolean;
        petitDejeuner: boolean;
        dejeuner: boolean;
        diner: boolean;
        bagages: boolean;
    };
}

export interface GuideExpense {
    id: string;
    guideName: string;
    tripName: string;
    description: string;
    amount: number; // DZD
    date: string;
    category: 'Transport' | 'Hébergement' | 'Repas' | 'Autre';
    status: 'Payé' | 'En attente';
}

export interface Discount {
    id: string;
    title: string;
    type: 'Percentage' | 'Amount';
    value: number;
    startDate: string;
    endDate: string;
    active: boolean;
    reference: string;
    applicableTo: 'Omra' | 'Billetterie' | 'Réservation d\'hôtel' | 'Voyage Organisé' | 'Traitement dossier de visa' | 'Assurance de voyage' | 'Rendez-vous visa';
}

export interface Tax {
    id: string;
    reference: string;
    name: string;
    type: 'Percentage' | 'Amount';
    value: number;
    applicableTo: 'Omra' | 'Billetterie' | 'Réservation d\'hôtel' | 'Voyage Organisé' | 'Traitement dossier de visa' | 'Assurance de voyage' | 'Rendez-vous visa' | 'Toutes';
    active: boolean;
}

export interface BankAccount {
    id: string;
    name: string; // e.g., "Caisse Principale", "CPA", "BADR", "SAR Account"
    type: 'Caisse' | 'Bank';
    currency: 'DZD' | 'SAR' | 'EUR' | 'USD';
    balance: number; // In account currency
    balanceDZD?: number; // Cached DZD equivalent (sum of transaction DZD amounts)
    accountNumber?: string;
    icon?: string; // Icon name e.g., 'Wallet', 'CreditCard'
    isDefault?: boolean;
}

// Commission tracking
export interface Commission {
    id: string;
    orderId: string;
    agencyId: string;
    passengerCount: number;
    commissionPerPassenger: number;
    totalCommission: number;
    status: 'Pending' | 'Paid' | 'Cancelled';
    createdAt: string;
    paidAt?: string;
    notes?: string;
}
