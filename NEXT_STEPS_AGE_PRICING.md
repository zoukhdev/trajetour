# Remaining Work: OrderFormV2 Age-Based Pricing Updates

## ✅ Completed
1. Database migration - added `pricing` JSONB column
2. Backend API - POST/PUT endpoints handle pricing object
3. RoomingList form - 3 price inputs (Adult/Child/Infant)

## 🔄 Remaining Tasks for OrderFormV2

### 1. Add Hotel Dropdown Filter
**Location**: Before room assignment section

**Code to add**:
```tsx
const [selectedHotel, setSelectedHotel] = useState('');
const uniqueHotels = [...new Set(rooms.map(r => r.hotel_name))];

// In JSX:
<div className="mb-4">
    <label>Filtrer par Hôtel</label>
    <select 
        value={selectedHotel}
        onChange={e => setSelectedHotel(e.target.value)}
    >
        <option value="">Tous les hôtels</option>
        {uniqueHotels.map(hotel => (
            <option key={hotel} value={hotel}>{hotel}</option>
        ))}
    </select>
</div>

// Filter rooms:
const filteredRooms = selectedHotel 
    ? rooms.filter(r => r.hotel_name === selectedHotel)
    : rooms;
```

### 2. Add Age Calculation Helper
```tsx
const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

const getAgeCategory = (age: number): 'adult' | 'child' | 'infant' => {
    if (age < 2) return 'infant';
    if (age < 12) return 'child';
    return 'adult';
};
```

### 3. Update Passenger Interface
```tsx
interface Passenger {
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    assignedRoomId: string | null;
    ageCategory?: 'adult' | 'child' | 'infant';
    suggestedPrice?: number;
    finalPrice?: number;
    priceOverridden?: boolean;
}
```

### 4. Auto-Assign Price When Room Selected
In the room assignment handler:
```tsx
const handleRoomAssignment = (passengerId: string, roomId: string) => {
    const passenger = passengers.find(p => p.id === passengerId);
    const room = rooms.find(r => r.id === roomId);
    
    if (!passenger || !room) return;
    
    const age = calculateAge(passenger.birthDate);
    const category = getAgeCategory(age);
    const suggestedPrice = room.pricing?.[category] || room.price;
    
    setPassengers(prev => prev.map(p => 
        p.id === passengerId 
            ? {
                ...p,
                assignedRoomId: roomId,
                ageCategory: category,
                suggestedPrice,
                finalPrice: suggestedPrice,
                priceOverridden: false
              }
            : p
    ));
};
```

### 5. Add Price Override UI
For each passenger with assigned room:
```tsx
<div className="flex items-center gap-2">
    <span>Prix: {passenger.finalPrice} DZD</span>
    <button 
        onClick={() => setEditingPriceForPassenger(passenger.id)}
        className="text-sm text-blue-600"
    >
        ✏️ Modifier
    </button>
    {passenger.priceOverridden && <span className="text-xs text-orange-600">⚠️ Modifié</span>}
</div>

{editingPriceForPassenger === passenger.id && (
    <input
        type="number"
        value={passenger.finalPrice}
        onChange={e => {
            const newPrice = Number(e.target.value);
            setPassengers(prev => prev.map(p =>
                p.id === passenger.id
                    ? { ...p, finalPrice: newPrice, priceOverridden: true }
                    : p
            ));
        }}
        onBlur={() => setEditingPriceForPassenger(null)}
    />
)}
```

### 6. Auto-Calculate Total
```tsx
useEffect(() => {
    const total = passengers.reduce((sum, p) => 
        sum + (p.finalPrice || 0), 0
    );
    setTotalAmount(total);
}, [passengers]);

// In JSX - replace input with readonly display:
<div className="bg-gray-50 p-4 rounded-lg">
    <label>Total de la Commande (Auto-calculé)</label>
    <div className="text-2xl font-bold text-primary">
        {totalAmount.toLocaleString()} DZD
    </div>
    <p className="text-xs text-gray-500">
        Somme des prix des chambres assignées
    </p>
</div>
```

## Testing Checklist
- [ ] Create room with pricing (Adult: 500, Child: 300, Infant: 100)
- [ ] Create order with passengers of different ages
- [ ] Verify suggested prices match age categories
- [ ] Test manual price override
- [ ] Verify total auto-updates
- [ ] Test hotel filtering

## Files to Modify
- `client/src/pages/Orders/OrderFormV2.tsx` (main file to update)
