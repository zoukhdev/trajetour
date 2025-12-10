import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Client, Agency, Order, Expense, Transaction, User, Supplier, Offer, GuideExpense, Discount, Tax, BankAccount, Payment } from '../types';
import { clientsAPI, ordersAPI, paymentsAPI, offersAPI } from '../services/api';

interface DataContextType {
    clients: Client[];
    agencies: Agency[];
    orders: Order[];
    expenses: Expense[];
    transactions: Transaction[];
    users: User[];
    suppliers: Supplier[];
    offers: Offer[];
    guideExpenses: GuideExpense[];
    discounts: Discount[];
    taxes: Tax[];
    bankAccounts: BankAccount[];
    addClient: (client: Client) => void;
    updateClient: (client: Client) => void;
    addAgency: (agency: Agency) => void;
    addOrder: (order: Order) => void;
    updateOrder: (order: Order) => void;
    addExpense: (expense: Expense) => void;
    addUser: (user: User) => void;
    updateUser: (user: User) => void;
    deleteUser: (id: string) => void;
    addSupplier: (supplier: Supplier) => void;
    updateSupplier: (supplier: Supplier) => void;
    deleteSupplier: (id: string) => void;
    addOffer: (offer: Offer) => void;
    updateOffer: (offer: Offer) => void;
    deleteOffer: (id: string) => void;
    addGuideExpense: (expense: GuideExpense) => void;
    updateGuideExpense: (expense: GuideExpense) => void;
    deleteGuideExpense: (id: string) => void;
    addDiscount: (discount: Discount) => void;
    updateDiscount: (discount: Discount) => void;
    deleteDiscount: (id: string) => void;
    addTax: (tax: Tax) => void;
    updateTax: (tax: Tax) => void;
    deleteTax: (id: string) => void;
    addTransaction: (transaction: Transaction) => void;
    addBankAccount: (account: BankAccount) => void;
    updateBankAccount: (account: BankAccount) => void;
    deleteBankAccount: (id: string) => void;
    addPayment: (payment: Payment, orderId: string) => Promise<Payment>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [guideExpenses, setGuideExpenses] = useState<GuideExpense[]>([]);
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [taxes, setTaxes] = useState<Tax[]>([]);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);


    // Load data from backend API and local storage
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load clients from backend
                const clientsData = await clientsAPI.getAll(1, 1000);
                setClients(clientsData.data || []);

                // Load orders from backend  
                const ordersData = await ordersAPI.getAll(1, 1000);
                setOrders(ordersData.data || []);

                // Load offers from backend
                const offersData = await offersAPI.getAll();
                setOffers(offersData || []);
            } catch (error) {
                console.error('❌ Error loading clients/orders from backend:', error);
                // Show user-visible error
                if (error instanceof Error) {
                    console.error('Error details:', error.message);
                }
                // Do NOT fallback to localStorage - we need to know when the backend fails
                // This ensures data consistency across all devices
            }
        };

        loadData();

        // Load other data from localStorage (will migrate gradually)
        const storedAgencies = localStorage.getItem('agencies');
        const storedExpenses = localStorage.getItem('expenses');
        const storedTransactions = localStorage.getItem('transactions');
        const storedUsers = localStorage.getItem('users');
        const storedSuppliers = localStorage.getItem('suppliers');
        const storedGuideExpenses = localStorage.getItem('guideExpenses');
        const storedDiscounts = localStorage.getItem('discounts');
        const storedTaxes = localStorage.getItem('taxes');
        const storedBankAccounts = localStorage.getItem('bankAccounts');

        if (storedAgencies) setAgencies(JSON.parse(storedAgencies));
        if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
        if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
        if (storedSuppliers) setSuppliers(JSON.parse(storedSuppliers));
        if (storedGuideExpenses) setGuideExpenses(JSON.parse(storedGuideExpenses));
        if (storedDiscounts) setDiscounts(JSON.parse(storedDiscounts));
        if (storedTaxes) setTaxes(JSON.parse(storedTaxes));

        if (storedBankAccounts) {
            setBankAccounts(JSON.parse(storedBankAccounts));
        } else {
            // Init default accounts
            const defaultAccounts: BankAccount[] = [
                { id: '1', name: 'Caisse Principale', type: 'Caisse', balance: 0, currency: 'DZD', isDefault: true, icon: 'Wallet' },
                { id: '2', name: 'Compte CPA', type: 'Bank', balance: 0, currency: 'DZD', accountNumber: '00400123456789', icon: 'CreditCard' },
                { id: '3', name: 'Compte BADR', type: 'Bank', balance: 0, currency: 'DZD', accountNumber: '00300987654321', icon: 'Landmark' },
                { id: '4', name: 'Caisse Euro', type: 'Caisse', balance: 0, currency: 'EUR', icon: 'Euro' },
                { id: '5', name: 'Caisse Dollar', type: 'Caisse', balance: 0, currency: 'USD', icon: 'DollarSign' },
                { id: '6', name: 'Baridimob', type: 'Bank', balance: 0, currency: 'DZD', accountNumber: '00799999000000', icon: 'Smartphone' },
            ];
            setBankAccounts(defaultAccounts);
        }

        if (storedUsers) {
            const parsedUsers = JSON.parse(storedUsers);
            if (parsedUsers.length > 0) {
                setUsers(parsedUsers);
            } else {
                const defaultAdmin: User = {
                    id: '1000',
                    username: 'Admin',
                    email: 'admin@wahat.com',
                    password: 'admin',
                    role: 'admin',
                    permissions: ['manage_users', 'manage_business', 'manage_financials', 'view_reports'],
                    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
                };
                setUsers([defaultAdmin]);
            }
        } else {
            const defaultAdmin: User = {
                id: '1000',
                username: 'Admin',
                email: 'admin@wahat.com',
                password: 'admin',
                role: 'admin',
                permissions: ['manage_users', 'manage_business', 'manage_financials', 'view_reports'],
                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
            };
            setUsers([defaultAdmin]);
        }
    }, []);

    // Save data to localStorage (only for non-backend entities)
    // Clients and orders are saved to backend API automatically
    useEffect(() => { localStorage.setItem('agencies', JSON.stringify(agencies)); }, [agencies]);
    useEffect(() => { localStorage.setItem('expenses', JSON.stringify(expenses)); }, [expenses]);
    useEffect(() => { localStorage.setItem('transactions', JSON.stringify(transactions)); }, [transactions]);
    useEffect(() => { localStorage.setItem('users', JSON.stringify(users)); }, [users]);
    useEffect(() => { localStorage.setItem('suppliers', JSON.stringify(suppliers)); }, [suppliers]);
    useEffect(() => { localStorage.setItem('guideExpenses', JSON.stringify(guideExpenses)); }, [guideExpenses]);
    useEffect(() => { localStorage.setItem('discounts', JSON.stringify(discounts)); }, [discounts]);
    useEffect(() => { localStorage.setItem('taxes', JSON.stringify(taxes)); }, [taxes]);
    useEffect(() => { localStorage.setItem('bankAccounts', JSON.stringify(bankAccounts)); }, [bankAccounts]);

    const addClient = async (client: Client) => {
        try {
            const newClient = await clientsAPI.create(client);
            setClients(prev => [...prev, newClient]);
            console.log('✅ Client created successfully:', newClient.id);
        } catch (error) {
            console.error('❌ Error adding client to backend:', error);
            // Do NOT fallback to localStorage - throw error so UI can handle it
            throw error;
        }
    };
    const updateClient = async (updatedClient: Client) => {
        try {
            const saved = await clientsAPI.update(updatedClient.id, updatedClient);
            setClients(prev => prev.map(c => c.id === saved.id ? saved : c));
            console.log('✅ Client updated successfully:', saved.id);
        } catch (error) {
            console.error('❌ Error updating client:', error);
            // Do NOT fallback to localStorage - throw error so UI can handle it
            throw error;
        }
    };
    const addAgency = (agency: Agency) => setAgencies(prev => [...prev, agency]);

    // Transaction Logic
    const addTransaction = (transaction: Transaction) => {
        setTransactions(prev => [...prev, transaction]);

        if (transaction.accountId) {
            setBankAccounts(prev => prev.map(account => {
                if (account.id === transaction.accountId) {
                    const amount = transaction.type === 'IN' ? transaction.amount : -transaction.amount;
                    return { ...account, balance: account.balance + amount };
                }
                return account;
            }));
        }
    };

    const addOrder = async (order: Order) => {
        try {
            const newOrder = await ordersAPI.create(order);
            setOrders(prev => [...prev, newOrder]);
            console.log('✅ Order created successfully:', newOrder.id);
            // Handle transactions from payments
            newOrder.payments.forEach((payment: Payment) => {
                const transaction: Transaction = {
                    id: Math.floor(10000000 + Math.random() * 90000000).toString(),
                    type: 'IN',
                    amount: payment.amountDZD,
                    amountDZD: payment.amountDZD,
                    currency: payment.currency || 'DZD',
                    source: 'Order',
                    referenceId: newOrder.id,
                    description: `Paiement Commande #${newOrder.id.substr(0, 6)}`,
                    date: payment.date,
                };
                addTransaction(transaction);
            });
        } catch (error) {
            console.error('❌ Error adding order to backend:', error);
            // Do NOT fallback to localStorage - throw error so UI can handle it
            throw error;
        }
    };


    const updateOrder = async (updatedOrder: Order) => {
        try {
            const saved = await ordersAPI.update(updatedOrder.id, updatedOrder);
            setOrders(prev => prev.map(o => o.id === saved.id ? saved : o));
            console.log('✅ Order updated successfully:', saved.id);
        } catch (error) {
            console.error('❌ Error updating order:', error);
            // Do NOT fallback to localStorage - throw error so UI can handle it
            throw error;
        }
    };

    const addExpense = (expense: Expense) => {
        setExpenses(prev => [...prev, expense]);
        const transaction: Transaction = {
            id: Math.floor(10000000 + Math.random() * 90000000).toString(),
            type: 'OUT',
            amount: expense.amountDZD,
            amountDZD: expense.amountDZD,
            currency: expense.currency || 'DZD',
            source: 'Expense',
            referenceId: expense.id,
            description: `Charge: ${expense.designation}`,
            date: expense.date,
            accountId: expense.accountId // Link to account
        };
        addTransaction(transaction);
    };

    const addUser = (user: User) => setUsers(prev => [...prev, user]);
    const updateUser = (updatedUser: User) => setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    const deleteUser = (id: string) => setUsers(prev => prev.filter(u => u.id !== id));

    const addSupplier = (supplier: Supplier) => setSuppliers(prev => [...prev, supplier]);
    const updateSupplier = (updatedSupplier: Supplier) => setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
    const deleteSupplier = (id: string) => setSuppliers(prev => prev.filter(s => s.id !== id));

    const addOffer = async (offer: Offer) => {
        try {
            const newOffer = await offersAPI.create(offer);
            setOffers(prev => [newOffer, ...prev]);
        } catch (error) {
            console.error('❌ Error adding offer:', error);
            throw error;
        }
    };
    const updateOffer = async (updatedOffer: Offer) => {
        try {
            const saved = await offersAPI.update(updatedOffer.id, updatedOffer);
            setOffers(prev => prev.map(o => o.id === saved.id ? saved : o));
        } catch (error) {
            console.error('❌ Error updating offer:', error);
            throw error;
        }
    };
    const deleteOffer = async (id: string) => {
        try {
            await offersAPI.delete(id);
            setOffers(prev => prev.filter(o => o.id !== id));
        } catch (error) {
            console.error('❌ Error deleting offer:', error);
            throw error;
        }
    };

    const addGuideExpense = (expense: GuideExpense) => {
        setGuideExpenses(prev => [...prev, expense]);
        const transaction: Transaction = {
            id: Math.floor(10000000 + Math.random() * 90000000).toString(),
            type: 'OUT',
            amount: expense.amount,
            amountDZD: expense.amount,
            currency: 'DZD',
            source: 'Expense',
            referenceId: expense.id,
            description: `Guide: ${expense.guideName} - ${expense.category}`,
            date: expense.date
        };
        addTransaction(transaction);
    };

    const updateGuideExpense = (updatedExpense: GuideExpense) => setGuideExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    const deleteGuideExpense = (id: string) => setGuideExpenses(prev => prev.filter(e => e.id !== id));

    const addDiscount = (discount: Discount) => setDiscounts(prev => [...prev, discount]);
    const updateDiscount = (updatedDiscount: Discount) => setDiscounts(prev => prev.map(d => d.id === updatedDiscount.id ? updatedDiscount : d));
    const deleteDiscount = (id: string) => setDiscounts(prev => prev.filter(d => d.id !== id));

    const addTax = (tax: Tax) => setTaxes(prev => [...prev, tax]);
    const updateTax = (updatedTax: Tax) => setTaxes(prev => prev.map(t => t.id === updatedTax.id ? updatedTax : t));
    const deleteTax = (id: string) => setTaxes(prev => prev.filter(t => t.id !== id));

    const addBankAccount = (account: BankAccount) => setBankAccounts(prev => [...prev, account]);
    const updateBankAccount = (updatedAccount: BankAccount) => setBankAccounts(prev => prev.map(a => a.id === updatedAccount.id ? updatedAccount : a));
    const deleteBankAccount = (id: string) => setBankAccounts(prev => prev.filter(a => a.id !== id));

    return (
        <DataContext.Provider value={{
            clients,
            agencies,
            orders,
            expenses,
            transactions,
            users,
            suppliers,
            offers,
            guideExpenses,
            discounts,
            taxes,
            bankAccounts,
            addClient,
            updateClient,
            addAgency,
            addOrder,
            updateOrder,
            addExpense,
            addUser,
            updateUser,
            deleteUser,
            addSupplier,
            updateSupplier,
            deleteSupplier,
            addOffer,
            updateOffer,
            deleteOffer,
            addGuideExpense,
            updateGuideExpense,
            deleteGuideExpense,
            addDiscount,
            updateDiscount,
            deleteDiscount,
            addTax,
            updateTax,
            deleteTax,
            addTransaction,
            addBankAccount,
            updateBankAccount,
            deleteBankAccount,
            addPayment: async (payment: Payment, orderId: string) => {
                try {
                    // API Call
                    const newPayment = await paymentsAPI.create({
                        orderId,
                        amount: payment.amount,
                        currency: payment.currency,
                        exchangeRate: payment.exchangeRateUsed,
                        method: payment.method,
                        paymentDate: payment.date
                    });

                    // Update Local State (Orders)
                    setOrders(prev => prev.map(o => {
                        if (o.id === orderId) {
                            return {
                                ...o,
                                payments: [...o.payments, newPayment]
                            };
                        }
                        return o;
                    }));

                    console.log('✅ Payment created successfully:', newPayment.id);
                    return newPayment;
                } catch (error) {
                    console.error('❌ Error adding payment:', error);
                    throw error;
                }
            }
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
