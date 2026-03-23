import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../../services/api';
import { Save, Image as ImageIcon, Plus, Trash2, Palette, MapPin, Type, Edit3, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function HomepageBuilder() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [settings, setSettings] = useState({
        logoUrl: '',
        displayName: '',
        slogan: '',
        primaryColor: '#3b82f6', // Default blue
        contactEmail: '',
        contactPhone: '',
        contactAddress: '',
        mapEmbedUrl: '',
        socialLinks: { facebook: '', instagram: '', twitter: '' }
    });

    const [slides, setSlides] = useState<any[]>([]);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await settingsAPI.getHomepageSettings();
            if (data.settings) {
                setSettings({
                    ...settings,
                    ...data.settings
                });
            }
            if (data.slides) {
                setSlides(data.slides);
            }
        } catch (error) {
            console.error('Error fetching homepage settings:', error);
            toast.error('Failed to load homepage settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await settingsAPI.updateHomepageSettings({
                settings,
                slides: slides.map((s, index) => ({ ...s, orderIndex: index }))
            });
            toast.success('Homepage settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleAddSlide = () => {
        setSlides([
            ...slides,
            { imageUrl: '', title: '', description: '', ctaText: '', ctaUrl: '', isActive: true }
        ]);
    };

    const handleRemoveSlide = (index: number) => {
        setSlides(slides.filter((_, i) => i !== index));
    };

    const handleSlideChange = (index: number, field: string, value: any) => {
        const newSlides = [...slides];
        newSlides[index] = { ...newSlides[index], [field]: value };
        setSlides(newSlides);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Homepage Customization</h1>
                    <p className="text-gray-500 text-sm mt-1">Customize the look and feel of your public landing page.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Essential Settings */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Brand Identity */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Palette size={20} className="text-blue-500" />
                            Brand Identity
                        </h2>
                        
                        <div className="space-y-4">
                            {/* Logo Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Agency Logo</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden">
                                        {settings.logoUrl ? (
                                            <img src={settings.logoUrl} alt="Logo preview" className="w-full h-full object-contain" />
                                        ) : (
                                            <ImageIcon className="text-gray-400" size={24} />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={settings.logoUrl}
                                            onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                                            placeholder="https://example.com/logo.png"
                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Provide a URL for your logo (SVG or PNG recommended).</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Type size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={settings.displayName}
                                        onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                                        placeholder="E.g., Wanderlust Travels"
                                        className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slogan</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Edit3 size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={settings.slogan}
                                        onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
                                        placeholder="Your catchphrase here..."
                                        className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Primary Color</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={settings.primaryColor}
                                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                        className="h-10 w-10 border-0 rounded overflow-hidden cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={settings.primaryColor}
                                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                        className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo URL</label>
                                <input
                                    type="text"
                                    value={settings.logoUrl}
                                    onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                                    placeholder="https://example.com/logo.png"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                {settings.logoUrl && (
                                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-center">
                                        <img src={settings.logoUrl} alt="Logo Preview" className="h-16 object-contain max-w-full" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <MapPin size={20} className="text-green-500" />
                            Contact & Location
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        value={settings.contactEmail}
                                        onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                                        className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Phone</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="tel"
                                        value={settings.contactPhone}
                                        onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                                        className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Physical Address</label>
                                <textarea
                                    value={settings.contactAddress}
                                    onChange={(e) => setSettings({ ...settings, contactAddress: e.target.value })}
                                    rows={3}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Google Maps Embed URL</label>
                                <input
                                    type="text"
                                    value={settings.mapEmbedUrl}
                                    onChange={(e) => setSettings({ ...settings, mapEmbedUrl: e.target.value })}
                                    placeholder="https://www.google.com/maps/embed?pb=..."
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <p className="text-xs text-gray-500 mt-1">Paste the 'src' URL from Google Maps embed iframe.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Hero Slides */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <ImageIcon size={20} className="text-purple-500" />
                                Hero Carousel Slides
                            </h2>
                            <button
                                onClick={handleAddSlide}
                                className="flex items-center gap-1 text-sm bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 px-3 py-1.5 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition"
                            >
                                <Plus size={16} /> Add Slide
                            </button>
                        </div>

                        {slides.length === 0 ? (
                            <div className="text-center p-8 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <ImageIcon size={48} className="mx-auto text-gray-400 mb-3" />
                                <h3 className="text-gray-900 dark:text-white font-medium">No slides yet</h3>
                                <p className="text-gray-500 text-sm mt-1 mb-4">Add your first slide to display a hero image banner.</p>
                                <button
                                    onClick={handleAddSlide}
                                    className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                                >
                                    <Plus size={18} /> Create Slide
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {slides.map((slide, index) => (
                                    <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/30 relative group">
                                        <button
                                            onClick={() => handleRemoveSlide(index)}
                                            className="absolute top-4 right-4 text-red-400 hover:text-red-600 dark:hover:text-red-300 p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Image URL</label>
                                                    <input
                                                        type="text"
                                                        value={slide.imageUrl}
                                                        onChange={(e) => handleSlideChange(index, 'imageUrl', e.target.value)}
                                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-sm"
                                                        placeholder="https://example.com/slide1.jpg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                                                    <input
                                                        type="text"
                                                        value={slide.title}
                                                        onChange={(e) => handleSlideChange(index, 'title', e.target.value)}
                                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-sm"
                                                        placeholder="Discover the World"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                                                    <textarea
                                                        value={slide.description}
                                                        onChange={(e) => handleSlideChange(index, 'description', e.target.value)}
                                                        rows={2}
                                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-sm resize-none"
                                                        placeholder="Short catchy description..."
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">CTA Text</label>
                                                        <input
                                                            type="text"
                                                            value={slide.ctaText}
                                                            onChange={(e) => handleSlideChange(index, 'ctaText', e.target.value)}
                                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-sm"
                                                            placeholder="Book Now"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-500 mb-1">CTA URL</label>
                                                        <input
                                                            type="text"
                                                            value={slide.ctaUrl}
                                                            onChange={(e) => handleSlideChange(index, 'ctaUrl', e.target.value)}
                                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-800 text-sm"
                                                            placeholder="/packages"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`active-${index}`}
                                                        checked={slide.isActive}
                                                        onChange={(e) => handleSlideChange(index, 'isActive', e.target.checked)}
                                                        className="rounded text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <label htmlFor={`active-${index}`} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                                        Active
                                                    </label>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Preview</label>
                                                <div className="flex-1 bg-gray-200 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden relative flex items-center justify-center min-h-[150px]">
                                                    {slide.imageUrl ? (
                                                        <>
                                                            <img 
                                                                src={slide.imageUrl} 
                                                                alt={slide.title} 
                                                                className="absolute inset-0 w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                    e.currentTarget.parentElement?.classList.add('error-image');
                                                                }}
                                                            />
                                                            <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-center p-4">
                                                                <h4 className="text-white font-bold text-lg">{slide.title || 'Slide Title'}</h4>
                                                                <p className="text-white/80 text-xs mt-1 max-w-[80%] truncate">{slide.description || 'Slide description here'}</p>
                                                                {slide.ctaText && (
                                                                    <span className="mt-3 px-3 py-1 bg-blue-600 text-white text-xs rounded-full">{slide.ctaText}</span>
                                                                )}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <ImageIcon className="text-gray-400" size={32} />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
