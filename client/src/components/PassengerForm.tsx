import { useState } from 'react';
import { User, Phone, Mail, Calendar, Upload, X } from 'lucide-react';
import type { Passenger } from '../types';

interface PassengerFormProps {
    passenger?: Passenger;
    onSave: (passenger: Passenger) => void;
    onCancel: () => void;
}

const PassengerForm = ({ passenger, onSave, onCancel }: PassengerFormProps) => {
    const [formData, setFormData] = useState<Passenger>(
        passenger || {
            id: Math.random().toString(36).substr(2, 9),
            firstName: '',
            lastName: '',
            passportNumber: '',
            passportExpiry: '',
            phoneNumber: '',
            email: '',
            birthDate: '',
            gender: 'Homme',
            photo: ''
        }
    );

    const handleChange = (field: keyof Passenger, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, photo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            alert('First name and last name are required');
            return;
        }

        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        <User size={14} className="inline mr-1" />
                        Prénom *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="Prénom du passager"
                    />
                </div>

                {/* Last Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        <User size={14} className="inline mr-1" />
                        Nom *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => handleChange('lastName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="Nom du passager"
                    />
                </div>

                {/* Birth Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Calendar size={14} className="inline mr-1" />
                        Date de naissance
                    </label>
                    <input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => handleChange('birthDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                </div>

                {/* Gender */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Genre</label>
                    <select
                        value={formData.gender}
                        onChange={(e) => handleChange('gender', e.target.value as 'Homme' | 'Femme')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    >
                        <option value="Homme">Homme</option>
                        <option value="Femme">Femme</option>
                    </select>
                </div>

                {/* Passport Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Numéro de passeport
                    </label>
                    <input
                        type="text"
                        value={formData.passportNumber}
                        onChange={(e) => handleChange('passportNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="N° de passeport"
                    />
                </div>

                {/* Passport Expiry */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date d'expiration passeport
                    </label>
                    <input
                        type="date"
                        value={formData.passportExpiry}
                        onChange={(e) => handleChange('passportExpiry', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                </div>

                {/* Phone Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Phone size={14} className="inline mr-1" />
                        Numéro de téléphone
                    </label>
                    <input
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => handleChange('phoneNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="+213 XXX XXX XXX"
                    />
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Mail size={14} className="inline mr-1" />
                        Email
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        placeholder="email@example.com"
                    />
                </div>
            </div>

            {/* Photo Upload */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Upload size={14} className="inline mr-1" />
                    Photo (Passeport/ID)
                </label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                />
                {formData.photo && (
                    <div className="mt-2 relative inline-block">
                        <img
                            src={formData.photo}
                            alt="Passenger"
                            className="h-24 w-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                            type="button"
                            onClick={() => handleChange('photo', '')}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {passenger ? 'Mettre à jour' : 'Ajouter'} Passager
                </button>
            </div>
        </form>
    );
};

export default PassengerForm;
