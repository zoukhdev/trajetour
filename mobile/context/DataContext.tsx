
import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { clientStorage } from '../services/storage';
import { eventBus, EVENTS } from '../services/events';
import type { Client, Agency, Order, Expense, Transaction, User, Supplier, Offer, GuideExpense, Discount, Tax, BankAccount, Payment, Room } from '../types';
import {
    clientsAPI, ordersAPI, paymentsAPI, offersAPI, suppliersAPI,
    agenciesAPI, expensesAPI, usersAPI, transactionsAPI, bankAccountsAPI, roomsAPI, passengersAPI
} from '../services/api';

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
    rooms: Room[];

    refreshData: () => Promise<void>;

    // CRUD Operations
    addClient: (client: Client) => Promise<void>;
    updateClient: (client: Client) => Promise<void>;

    addAgency: (agency: Agency) => Promise<void>;
    updateAgency: (agency: Agency) => Promise<void>;
    deleteAgency: (id: string) => Promise<void>;

    addOrder: (order: Order) => Promise<void>;
    updateOrder: (order: Order) => Promise<void>;
    deleteOrder: (id: string) => Promise<void>;
    updatePassengerPrice: (passengerId: string, orderId: string, finalPrice: number) => Promise<void>;

    addExpense: (expense: Expense) => Promise<void>;
    updateExpense: (expense: Expense) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;

    addUser: (user: User) => Promise<void>;
    updateUser: (user: User) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;

    addSupplier: (supplier: Supplier) => Promise<Supplier>;
    updateSupplier: (supplier: Supplier) => Promise<void>;
    deleteSupplier: (id: string) => Promise<void>;

    addOffer: (offer: Offer) => Promise<Offer>;
    updateOffer: (offer: Offer) => Promise<void>;
    deleteOffer: (id: string) => Promise<void>;

    addGuideExpense: (expense: GuideExpense) => void;
    updateGuideExpense: (expense: GuideExpense) => void;
    deleteGuideExpense: (id: string) => void;

    addDiscount: (discount: Discount) => void;
    updateDiscount: (discount: Discount) => void;
    deleteDiscount: (id: string) => void;

    addTax: (tax: Tax) => void;
    updateTax: (tax: Tax) => void;
    deleteTax: (id: string) => void;

    addTransaction: (transaction: Transaction) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;

    addBankAccount: (account: BankAccount) => void;
    updateBankAccount: (account: BankAccount) => void;
    deleteBankAccount: (id: string) => void;

    addRoom: (room: Room) => Promise<void>;
    updateRoom: (room: Room) => Promise<void>;
    deleteRoom: (id: string) => Promise<void>;

    addPayment: (payment: Payment, orderId: string) => Promise<Payment>;
    validatePayment: (paymentId: string, orderId: string, isValidated: boolean) => Promise<void>;
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
    const [rooms, setRooms] = useState<Room[]>([]);

    // Legacy / Minor entities still in LS for now (or TODO later)
    const [guideExpenses, setGuideExpenses] = useState<GuideExpense[]>([]);
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [taxes, setTaxes] = useState<Tax[]>([]);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

    // Calculate bank account balances dynamically from transactions
    const bankAccountsWithBalances = useMemo(() => {
        return bankAccounts.map(account => {
            // Find all transactions for this account
            const accountTransactions = transactions.filter(t => t.accountId === account.id);

            // Calculate balance in account's native currency (EUR, DZD, SAR)
            const nativeBalance = accountTransactions.reduce((sum, t) => {
                // Use transaction's amount in its original currency
                const transactionAmount = t.amount;
                return sum + (t.type === 'IN' ? transactionAmount : -transactionAmount);
            }, 0);

            // Calculate balance in DZD for Total NET calculation
            const balanceDZD = accountTransactions.reduce((sum, t) => {
                const transactionAmountDZD = t.amountDZD || t.amount;
                return sum + (t.type === 'IN' ? transactionAmountDZD : -transactionAmountDZD);
            }, 0);

            return {
                ...account,
                balance: nativeBalance,        // Native currency (EUR for EUR account)
                balanceDZD: balanceDZD        // DZD equivalent for totals
            };
        });
    }, [bankAccounts, transactions]);

    const loadData = async () => {
        try {
            // CACHE-FIRST STRATEGY: Load from local storage immediately if available
            const cachedClients = await clientStorage.getItem('cache_clients');
            const cachedOrders = await clientStorage.getItem('cache_orders');
            const cachedOffers = await clientStorage.getItem('cache_offers');
            const cachedSuppliers = await clientStorage.getItem('cache_suppliers');

            if (cachedClients) setClients(JSON.parse(cachedClients));
            if (cachedOrders) setOrders(JSON.parse(cachedOrders));
            if (cachedOffers) setOffers(JSON.parse(cachedOffers));
            if (cachedSuppliers) setSuppliers(JSON.parse(cachedSuppliers));

            // Use Promise.allSettled so one failure doesn't block everything
            const results = await Promise.allSettled([
                clientsAPI.getAll(1, 1000),
                ordersAPI.getAll(1, 1000),
                offersAPI.getAll(),
                suppliersAPI.getAll(),
                agenciesAPI.getAll(1, 1000),
                expensesAPI.getAll(1, 1000),
                usersAPI.getAll(1, 1000),
                transactionsAPI.getAll(1, 100),
                bankAccountsAPI.getAll(),
                roomsAPI.getAll()
            ]);

            // Helper to get data or empty array
            const getData = (index: number, name: string) => {
                const result = results[index];
                if (result.status === 'fulfilled') {
                    return result.value.data || result.value || []; // Handle {data: []} or []
                } else {
                    console.error(`❌ Failed to load ${name}:`, result.reason);
                    // Optionally alert the user here or track errors
                    return [];
                }
            };

            const clientsData = getData(0, 'Clients');
            const ordersData = getData(1, 'Orders');
            const offersData = getData(2, 'Offers');
            const suppliersData = getData(3, 'Suppliers');
            const agenciesData = getData(4, 'Agencies');
            const expensesData = getData(5, 'Expenses');
            const usersData = getData(6, 'Users');
            const transactionsData = getData(7, 'Transactions');
            const bankAccountsData = getData(8, 'BankAccounts');
            const roomsData = getData(9, 'Rooms');


            setClients(Array.isArray(clientsData) ? clientsData : (clientsData.data || []));
            setOrders(Array.isArray(ordersData) ? ordersData : (ordersData.data || []));
            setOffers(Array.isArray(offersData) ? offersData : []);

            // Suppliers Mapping
            // Check if suppliersData is array before mapping
            const validSuppliers = Array.isArray(suppliersData) ? suppliersData : [];
            const mappedSuppliers = validSuppliers.map((s: any) => ({
                id: s.id,
                name: s.name,
                contactPerson: s.contact_person,
                phone: s.phone,
                email: s.email,
                address: s.address,
                serviceType: s.service_type,
                createdAt: s.created_at
            }));

            setSuppliers(mappedSuppliers);
            setAgencies(Array.isArray(agenciesData) ? agenciesData : (agenciesData.data || []));
            setExpenses(Array.isArray(expensesData) ? expensesData : (expensesData.data || []));
            setUsers(Array.isArray(usersData) ? usersData : (usersData.data || []));
            setTransactions(Array.isArray(transactionsData) ? transactionsData : (transactionsData.data || []));
            setBankAccounts(Array.isArray(bankAccountsData) ? bankAccountsData : []);
            setRooms(Array.isArray(roomsData) ? roomsData : []);

            // UPDATE CACHE
            if (clientsData?.data || Array.isArray(clientsData)) await clientStorage.setItem('cache_clients', JSON.stringify(Array.isArray(clientsData) ? clientsData : clientsData.data));
            if (ordersData?.data || Array.isArray(ordersData)) await clientStorage.setItem('cache_orders', JSON.stringify(Array.isArray(ordersData) ? ordersData : ordersData.data));
            if (offersData) await clientStorage.setItem('cache_offers', JSON.stringify(offersData));
            if (mappedSuppliers) await clientStorage.setItem('cache_suppliers', JSON.stringify(mappedSuppliers));

            // Check for failures to notify
            const failures = results.filter(r => r.status === 'rejected');
            if (failures.length > 0) {
                console.error(`⚠️ ${failures.length} APIs failed to load. Check console for details.`);
            }

        } catch (error) {
            console.error('❌ Critical Error loading data:', error);
        }
    };

    useEffect(() => {
        loadData();

        // Auto-refresh when app comes to foreground
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active') {
                console.log('📱 App resumed: Refreshing data...');
                loadData();
            }
        });

        // Listen for Offline Sync completion
        const handleSyncComplete = () => {
            console.log('🔄 Sync complete: Refreshing data...');
            loadData();
        };
        const eventSubscription = eventBus.on(EVENTS.DATA_REFRESH_NEEDED, handleSyncComplete);

        return () => {
            subscription.remove();
            eventSubscription.remove();
        };

        // Load Remaining LocalStorage Data
        const loadSecondary = async () => {
            const storedGuideExpenses = await clientStorage.getItem('guideExpenses');
            const storedDiscounts = await clientStorage.getItem('discounts');
            const storedTaxes = await clientStorage.getItem('taxes');

            if (storedGuideExpenses) setGuideExpenses(JSON.parse(storedGuideExpenses!));
            if (storedDiscounts) setDiscounts(JSON.parse(storedDiscounts!));
            if (storedTaxes) setTaxes(JSON.parse(storedTaxes!));
        };
        loadSecondary();

    }, []);

    // Sync specific LocalStorage items (One-way binding for remaining legacy items)
    useEffect(() => { const save = async () => await clientStorage.setItem('guideExpenses', JSON.stringify(guideExpenses)); save(); }, [guideExpenses]);
    useEffect(() => { const save = async () => await clientStorage.setItem('discounts', JSON.stringify(discounts)); save(); }, [discounts]);
    useEffect(() => { const save = async () => await clientStorage.setItem('taxes', JSON.stringify(taxes)); save(); }, [taxes]);
    // REMOVED: useEffect(() => { localStorage.setItem('bankAccounts', ...); }); -> Now in DB


    // --- DATA MUTATION METHODS (Now Async) ---

    // CLIENTS
    const addClient = async (client: Client) => {
        const newClient = await clientsAPI.create(client);
        setClients(prev => [...prev, newClient]);
    };
    const updateClient = async (updatedClient: Client) => {
        const saved = await clientsAPI.update(updatedClient.id, updatedClient);
        setClients(prev => prev.map(c => c.id === saved.id ? saved : c));
    };

    // AGENCIES
    const addAgency = async (agency: Agency) => {
        const newAgency = await agenciesAPI.create(agency);
        setAgencies(prev => [...prev, newAgency]);
    };
    const updateAgency = async (agency: Agency) => {
        const saved = await agenciesAPI.update(agency.id, agency);
        setAgencies(prev => prev.map(a => a.id === saved.id ? saved : a));
    };
    const deleteAgency = async (id: string) => {
        await agenciesAPI.delete(id);
        setAgencies(prev => prev.filter(a => a.id !== id));
    };

    // EXPENSES
    const addExpense = async (expense: Expense) => {
        const newExpense = await expensesAPI.create(expense);
        setExpenses(prev => [...prev, newExpense]);

        // Auto-create transaction for expense?
        // Backend might handle this via triggers, but for now let's reproduce logic client-side 
        // OR better: The backend expense creation should trigger logic.
        // But users expect instant UI update.
        // Let's create the transaction explicitly if it's not handled.

        // REVISIT: For now, keeping "Smart Transaction Logic" in Frontend is risky if backend does it too.
        // Current Backend Routes (created in Phase 1) DO NOT auto-create transactions yet.
        // So we should call addTransaction manually or let the user do it.
        // Wait, the previous logic AUTOMATICALLY added a transaction.
        // Let's KEEP that logic but call the API.

        const transaction: Transaction = {
            id: '', // Backend generates
            type: 'OUT',
            amount: expense.amountDZD,
            amountDZD: expense.amountDZD,
            currency: expense.currency || 'DZD',
            source: 'Expense',
            referenceId: newExpense.id,
            description: `Charge: ${expense.designation} `,
            date: expense.date,
            accountId: expense.accountId
        };
        await addTransaction(transaction);
    };

    const updateExpense = async (expense: Expense) => {
        const saved = await expensesAPI.update(expense.id, expense);
        setExpenses(prev => prev.map(e => e.id === saved.id ? saved : e));
    };
    const deleteExpense = async (id: string) => {
        await expensesAPI.delete(id);
        setExpenses(prev => prev.filter(e => e.id !== id));
    };

    // USERS
    const addUser = async (user: User) => {
        const newUser = await usersAPI.create(user);
        setUsers(prev => [...prev, newUser]);
    };
    const updateUser = async (user: User) => {
        const saved = await usersAPI.update(user.id, user);
        setUsers(prev => prev.map(u => u.id === saved.id ? saved : u));
    };
    const deleteUser = async (id: string) => {
        await usersAPI.delete(id);
        setUsers(prev => prev.filter(u => u.id !== id));
    };

    // TRANSACTIONS
    const addTransaction = async (transaction: Transaction) => {
        const newTrans = await transactionsAPI.create(transaction);
        setTransactions(prev => [newTrans, ...prev]);

        // Note: Bank account balances are now calculated automatically via useMemo
        // No need to manually update balance here
    };
    const deleteTransaction = async (id: string) => {
        await transactionsAPI.delete(id);
        setTransactions(prev => prev.filter(t => t.id !== id));
        // Note: Reverting balance technically requires re-fetching or knowing the deleted amount.
        // For simplicity, we might force reload or leave it drifting until refresh.
    };


    // ORDERS
    const addOrder = async (order: Order) => {
        const newOrder = await ordersAPI.create(order);
        setOrders(prev => [...prev, newOrder]);

        // Handle payments -> transactions
        if (newOrder.payments && newOrder.payments.length > 0) {
            for (const payment of newOrder.payments) {
                const transaction: Transaction = {
                    id: '',
                    type: 'IN',
                    amount: payment.amountDZD,
                    amountDZD: payment.amountDZD,
                    currency: payment.currency || 'DZD',
                    source: 'Order',
                    referenceId: newOrder.id,
                    description: `Paiement Commande #${newOrder.id.substring(0, 6)} `,
                    date: payment.date,
                };
                await addTransaction(transaction);
            }
        }
    };
    const updateOrder = async (updatedOrder: Order) => {
        const saved = await ordersAPI.update(updatedOrder.id, updatedOrder);
        setOrders(prev => prev.map(o => o.id === saved.id ? saved : o));
    };
    const deleteOrder = async (id: string) => {
        await ordersAPI.delete(id);
        setOrders(prev => prev.filter(o => o.id !== id));
    };

    const updatePassengerPrice = async (passengerId: string, orderId: string, finalPrice: number) => {
        await passengersAPI.update(passengerId, { finalPrice, priceOverridden: true });
        // Refresh the specific order to get recalculated totals
        const updatedOrder = await ordersAPI.getById(orderId);
        setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
    };

    // SUPPLIERS
    const addSupplier = async (supplier: Supplier) => {
        const apiData = {
            name: supplier.name,
            contact_person: supplier.contactPerson,
            phone: supplier.phone,
            email: supplier.email,
            address: supplier.address,
            service_type: supplier.serviceType
        };
        const newSupplier = await suppliersAPI.create(apiData);
        const mapped = {
            id: newSupplier.id,
            name: newSupplier.name,
            contactPerson: newSupplier.contact_person,
            phone: newSupplier.phone,
            email: newSupplier.email,
            address: newSupplier.address,
            serviceType: newSupplier.service_type,
            createdAt: newSupplier.created_at
        };
        setSuppliers(prev => [...prev, mapped]);
        return mapped;
    };

    const updateSupplier = async (updatedSupplier: Supplier) => {
        const apiData = {
            name: updatedSupplier.name,
            contact_person: updatedSupplier.contactPerson,
            phone: updatedSupplier.phone,
            email: updatedSupplier.email,
            address: updatedSupplier.address,
            service_type: updatedSupplier.serviceType
        };
        const saved = await suppliersAPI.update(updatedSupplier.id, apiData);
        // Map back... simpler to just reload or careful map
        // For brevity assuming re-map same as create
        const mapped = {
            id: saved.id,
            name: saved.name,
            contactPerson: saved.contact_person,
            phone: saved.phone,
            email: saved.email,
            address: saved.address,
            serviceType: saved.service_type,
            createdAt: saved.created_at
        };
        setSuppliers(prev => prev.map(s => s.id === saved.id ? mapped : s));
    };
    const deleteSupplier = async (id: string) => {
        await suppliersAPI.delete(id);
        setSuppliers(prev => prev.filter(s => s.id !== id));
    };

    // OFFERS
    const addOffer = async (offer: Offer) => {
        const newOffer = await offersAPI.create(offer);
        setOffers(prev => [newOffer, ...prev]);
        return newOffer;
    };
    const updateOffer = async (updatedOffer: Offer) => {
        const saved = await offersAPI.update(updatedOffer.id, updatedOffer);
        setOffers(prev => prev.map(o => o.id === saved.id ? saved : o));
    };
    const deleteOffer = async (id: string) => {
        await offersAPI.delete(id);
        setOffers(prev => prev.filter(o => o.id !== id));
    };

    // LEGACY (Still LocalStorage for now)
    const addGuideExpense = (expense: GuideExpense) => {
        setGuideExpenses(prev => [...prev, expense]);
        // Auto-transaction
        const transaction: Transaction = {
            id: Math.floor(Math.random() * 100000).toString(), // Temporary ID for client side check
            type: 'OUT',
            amount: expense.amount,
            amountDZD: expense.amount,
            currency: 'DZD',
            source: 'Expense',
            referenceId: expense.id,
            description: `Guide: ${expense.guideName} `,
            date: expense.date
        };
        addTransaction(transaction); // This will now go to DB!
    };
    const updateGuideExpense = (e: GuideExpense) => setGuideExpenses(prev => prev.map(x => x.id === e.id ? e : x));
    const deleteGuideExpense = (id: string) => setGuideExpenses(prev => prev.filter(e => e.id !== id));

    const addDiscount = (d: Discount) => setDiscounts(prev => [...prev, d]);
    const updateDiscount = (d: Discount) => setDiscounts(prev => prev.map(x => x.id === d.id ? d : x));
    const deleteDiscount = (id: string) => setDiscounts(prev => prev.filter(x => x.id !== id));

    const addTax = (t: Tax) => setTaxes(prev => [...prev, t]);
    const updateTax = (t: Tax) => setTaxes(prev => prev.map(x => x.id === t.id ? t : x));
    const deleteTax = (id: string) => setTaxes(prev => prev.filter(x => x.id !== id));

    const addBankAccount = (a: BankAccount) => setBankAccounts(prev => [...prev, a]);
    const updateBankAccount = (a: BankAccount) => setBankAccounts(prev => prev.map(x => x.id === a.id ? a : x));
    const deleteBankAccount = (id: string) => setBankAccounts(prev => prev.filter(x => x.id !== id));

    // ROOMS
    const addRoom = async (room: Room) => {
        const newRoom = await roomsAPI.create(room);
        setRooms(prev => [...prev, newRoom]);
    };
    const updateRoom = async (room: Room) => {
        const savedRoom = await roomsAPI.update(room.id, room);
        setRooms(prev => prev.map(r => r.id === savedRoom.id ? savedRoom : r));
    };
    const deleteRoom = async (id: string) => {
        await roomsAPI.delete(id);
        setRooms(prev => prev.filter(r => r.id !== id));
    };

    return (
        <DataContext.Provider value={{
            clients, agencies, orders, expenses, transactions, users, suppliers,
            offers, guideExpenses, discounts, taxes, bankAccounts: bankAccountsWithBalances, rooms,
            refreshData: loadData,
            addClient, updateClient,
            addAgency, updateAgency, deleteAgency,
            addOrder, updateOrder, deleteOrder, updatePassengerPrice,
            addExpense, updateExpense, deleteExpense,
            addUser, updateUser, deleteUser,
            addSupplier, updateSupplier, deleteSupplier,
            addOffer, updateOffer, deleteOffer,
            addGuideExpense, updateGuideExpense, deleteGuideExpense,
            addDiscount, updateDiscount, deleteDiscount,
            addTax, updateTax, deleteTax,
            addTransaction, deleteTransaction,
            addBankAccount, updateBankAccount, deleteBankAccount,
            addRoom, updateRoom, deleteRoom,
            addPayment: async (payment: Payment, orderId: string) => {
                const newPayment = await paymentsAPI.create({
                    orderId,
                    amount: payment.amount,
                    currency: payment.currency,
                    exchangeRate: payment.exchangeRateUsed,
                    method: payment.method,
                    paymentDate: payment.date,
                    accountId: payment.accountId
                });
                setOrders(prev => prev.map(o => {
                    if (o.id === orderId) {
                        return { ...o, payments: [...o.payments, newPayment] };
                    }
                    return o;
                }));

                // Auto-create transaction if account is selected and successful
                if (payment.accountId && newPayment) {
                    const transaction: Transaction = {
                        id: '', // Backend Generated
                        type: 'IN',
                        amount: newPayment.amountDZD,
                        amountDZD: newPayment.amountDZD,
                        currency: newPayment.currency || 'DZD',
                        source: 'Order',
                        referenceId: orderId,
                        description: `Paiement Supplémentaire Commande #${orderId.substring(0, 6)} `,
                        date: newPayment.paymentDate,
                        accountId: payment.accountId
                    };
                    await addTransaction(transaction);
                    // Wait, addTransaction is defined in the closure scope of the component!
                    // But here we are in the value object. 
                    // I need to reference the function defined above. 
                    // `addTransaction` is defined in line 328 (of Step 1423).
                    // So I can call it directly.
                }

                return newPayment;
            },
            validatePayment: async (paymentId: string, orderId: string, isValidated: boolean) => {
                await paymentsAPI.validate(paymentId, isValidated);
                setOrders(prev => prev.map(o => {
                    if (o.id === orderId) {
                        return {
                            ...o,
                            payments: o.payments.map(p => p.id === paymentId ? { ...p, isValidated } : p)
                        };
                    }
                    return o;
                }));
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
