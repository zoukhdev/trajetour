import React, { useState, useEffect } from 'react';
import { settingsAPI, offersAPI } from '../../services/api';
import { Save, Image as ImageIcon, Plus, Trash2, Palette, MapPin, Type, Edit3, Phone, Mail, Video, Layout, Languages, ShieldCheck, Smartphone, Lock, Globe, MessageSquare, Megaphone, Share2, BarChart3, HelpCircle, Star, Hash, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';

export default function HomepageBuilder() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    const [settings, setSettings] = useState({
        logoUrl: '',
        displayName: '',
        slogan: '',
        primaryColor: '#3b82f6', // Default blue
        contactEmail: '',
        contactPhone: '',
        contactAddress: '',
        mapEmbedUrl: '',
        socialLinks: { facebook: '', instagram: '', twitter: '' },
        // Premium Branding
        fontFamily: 'Inter',
        videoUrl: '',
        secondaryColor: '#10B981',
        borderRadius: '8px',
        // SEO & Analytics
        seoTitle: '',
        seoDescription: '',
        analyticsGaId: '',
        analyticsFbId: '',
        analyticsTiktokId: '',
        ogImageUrl: '',
        // Interactive Blocks
        testimonials: [] as any[],
        faqs: [] as any[],
        trustStats: [] as any[],
        // Conversion
        whatsappNumber: '',
        whatsappMessage: '',
        newsletterEnabled: false,
        customScripts: '',
        // Multilingual
        translations: {} as any
    });

    const { subscription } = useSubscription();
    const isPremium = subscription?.plan === 'Pro' || subscription?.plan === 'Enterprise' || subscription?.plan === 'Gold';

    const [slides, setSlides] = useState<any[]>([]);
    const [offers, setOffers] = useState<any[]>([]);
    const [loadingOffers, setLoadingOffers] = useState(false);

    useEffect(() => {
        fetchSettings();
        fetchOffers();
    }, []);

    const fetchOffers = async () => {
        try {
            setLoadingOffers(true);
            const data = await offersAPI.getAll();
            setOffers(data.filter((o: any) => o.status === 'Published'));
        } catch (error) {
            console.error('Error fetching offers:', error);
        } finally {
            setLoadingOffers(false);
        }
    };

    const handleToggleFeatured = async (offerId: string, isFeatured: boolean) => {
        try {
            await offersAPI.toggleFeatured(offerId, isFeatured);
            setOffers(offers.map(o => o.id === offerId ? { ...o, isFeatured } : o));
            toast.success(isFeatured ? 'Offer featured on homepage' : 'Offer removed from featured');
        } catch (error) {
            console.error('Error toggling featured status:', error);
            toast.error('Failed to update offer status');
        }
    };

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
        // --- Premium Validation Logic ---
        if (isPremium) {
            // Video URL validation
            if (settings.videoUrl && !settings.videoUrl.startsWith('http')) {
                toast.error('Video URL must be a valid link (starting with http/https)');
                return;
            }

            // WhatsApp validation (alphanumeric and spaces/plus only)
            if (settings.whatsappNumber && !/^[0-9+\s]+$/.test(settings.whatsappNumber)) {
                toast.error('WhatsApp number should contain only digits, plus, and spaces');
                return;
            }

            // Google Analytics validation (G-XXXXX or UA-XXXXX)
            if (settings.analyticsGaId && !/^(G-|UA-)[A-Z0-9-]+$/i.test(settings.analyticsGaId)) {
                toast.error('Google Analytics ID format is invalid (should be G-XXXXX or UA-XXXXX)');
                return;
            }

            // SEO Length warnings (not blockers, just suggestions)
            if (settings.seoTitle && settings.seoTitle.length > 70) {
                toast.error('SEO Title is long (ideal: < 70 chars)');
            }
            if (settings.seoDescription && settings.seoDescription.length > 160) {
                toast.error('SEO Description is long (ideal: < 160 chars)');
            }

            // Clean empty FAQ/Testimonials/Stats
            const cleanedFaqs = settings.faqs?.filter((f: any) => f.question && f.answer) || [];
            const cleanedStats = settings.trustStats?.filter((s: any) => s.label && s.value) || [];
            const cleanedTesimonials = settings.testimonials?.filter((t: any) => t.name && t.content) || [];

            setSettings({
                ...settings,
                faqs: cleanedFaqs,
                trustStats: cleanedStats,
                testimonials: cleanedTesimonials
            });
        }

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

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error('File size must be less than 2MB');
            return;
        }

        try {
            setUploading(true);
            const { logoUrl } = await settingsAPI.uploadLogo(file);
            setSettings({ ...settings, logoUrl });
            toast.success('Logo uploaded and updated successfully!');
        } catch (error) {
            console.error('Error uploading logo:', error);
            toast.error('Failed to upload logo');
        } finally {
            setUploading(false);
        }
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
                                        <div className="flex flex-col gap-2">
                                            <label className="relative flex items-center justify-center gap-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition">
                                                <ImageIcon size={16} />
                                                {uploading ? 'Uploading...' : 'Upload Logo'}
                                                <input
                                                    type="file"
                                                    onChange={handleLogoUpload}
                                                    accept="image/*"
                                                    disabled={uploading}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                            </label>
                                            <p className="text-xs text-gray-500">SVG, PNG or JPG (Max 2MB)</p>
                                        </div>
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

                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                                    <Palette size={14} /> Primary Color
                                </label>
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

                            {/* Premium Branding Section */}
                            <div className={`pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4 ${!isPremium ? 'opacity-60 relative' : ''}`}>
                                {!isPremium && (
                                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 dark:bg-gray-800/40 backdrop-blur-[1px] rounded-xl">
                                        <div className="bg-white dark:bg-gray-800 shadow-xl border border-blue-100 dark:border-blue-900 rounded-lg py-2 px-4 flex items-center gap-2">
                                            <Lock size={14} className="text-blue-500" />
                                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">GOLD / Enterprise only</span>
                                        </div>
                                    </div>
                                )}
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                                        <Type size={14} /> Font Family
                                    </label>
                                    <select
                                        disabled={!isPremium}
                                        value={settings.fontFamily}
                                        onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="Inter">Inter (Sans-serif)</option>
                                        <option value="Roboto">Roboto</option>
                                        <option value="Outfit">Outfit</option>
                                        <option value="Playfair Display">Playfair Display (Serif)</option>
                                        <option value="Montserrat">Montserrat</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                                        <Palette size={14} /> Secondary Color
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            disabled={!isPremium}
                                            type="color"
                                            value={settings.secondaryColor}
                                            onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                                            className="h-10 w-10 border-0 rounded overflow-hidden cursor-pointer disabled:opacity-50"
                                        />
                                        <input
                                            disabled={!isPremium}
                                            type="text"
                                            value={settings.secondaryColor}
                                            onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                                            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase disabled:opacity-50"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                                        <Layout size={14} /> Border Radius
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {['0px', '4px', '8px', '16px', '9999px'].map(radius => (
                                            <button
                                                key={radius}
                                                disabled={!isPremium}
                                                onClick={() => setSettings({ ...settings, borderRadius: radius })}
                                                className={`px-2 py-1.5 text-xs font-medium rounded-md border transition-all ${settings.borderRadius === radius ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-500'}`}
                                            >
                                                {radius === '9999px' ? 'Full' : radius === '0px' ? 'Square' : radius}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                                        <Video size={14} /> Hero Video Background
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Video size={16} className="text-gray-400" />
                                        </div>
                                        <input
                                            disabled={!isPremium}
                                            type="text"
                                            value={settings.videoUrl || ''}
                                            onChange={(e) => setSettings({ ...settings, videoUrl: e.target.value })}
                                            placeholder="YouTube or direct MP4 link"
                                            className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                                        />
                                    </div>
                                </div>
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

            {/* Premium Interactive Sections: Testimonials, FAQ, Trust Stats */}
            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 ${!isPremium ? 'opacity-60 grayscale-[0.5] relative' : ''}`}>
                {!isPremium && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/10 backdrop-blur-[1px] rounded-xl">
                        <div className="bg-white dark:bg-gray-800 shadow-2xl border border-blue-200 dark:border-blue-900 rounded-xl p-6 flex flex-col items-center gap-3">
                            <Lock size={32} className="text-blue-500" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">GOLD / Enterprise Feature</h3>
                            <p className="text-sm text-gray-500 text-center max-w-[250px]">Unlock Testimonials, FAQ, and Trust Statistics to build more credibility.</p>
                        </div>
                    </div>
                )}

                {/* Trust Stats */}
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <ShieldCheck size={20} className="text-blue-500" />
                            Trust Statistics
                        </h2>
                        <button 
                            disabled={!isPremium}
                            onClick={() => setSettings({...settings, trustStats: [...(settings.trustStats || []), { label: 'Tourists', value: '10K+' }]})}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {(settings.trustStats || []).map((stat: any, idx: number) => (
                            <div key={idx} className="flex gap-2 items-center bg-gray-50 dark:bg-gray-900/40 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                <div className="flex-1 grid grid-cols-2 gap-2">
                                    <input 
                                        disabled={!isPremium}
                                        value={stat.value} 
                                        onChange={(e) => {
                                            const newStats = [...settings.trustStats];
                                            newStats[idx].value = e.target.value;
                                            setSettings({...settings, trustStats: newStats});
                                        }}
                                        placeholder="10K+" 
                                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-xs" 
                                    />
                                    <input 
                                        disabled={!isPremium}
                                        value={stat.label} 
                                        onChange={(e) => {
                                            const newStats = [...settings.trustStats];
                                            newStats[idx].label = e.target.value;
                                            setSettings({...settings, trustStats: newStats});
                                        }}
                                        placeholder="Happy Customers" 
                                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-xs" 
                                    />
                                </div>
                                <button onClick={() => {
                                    const newStats = settings.trustStats.filter((_: any, i: number) => i !== idx);
                                    setSettings({...settings, trustStats: newStats});
                                }} className="text-red-400 hover:text-red-600">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <HelpCircle size={20} className="text-amber-500" />
                            FAQ Management
                        </h2>
                        <button 
                            disabled={!isPremium}
                            onClick={() => setSettings({...settings, faqs: [...(settings.faqs || []), { question: '', answer: '' }]})}
                            className="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 disabled:opacity-50"
                        >
                            <Plus size={16} /> Add FAQ
                        </button>
                    </div>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {(settings.faqs || []).map((faq: any, idx: number) => (
                            <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-700 relative group">
                                <button 
                                    onClick={() => {
                                        const newFaqs = settings.faqs.filter((_: any, i: number) => i !== idx);
                                        setSettings({...settings, faqs: newFaqs});
                                    }} 
                                    className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 shadow-sm"
                                >
                                    <Trash2 size={12} />
                                </button>
                                <input 
                                    disabled={!isPremium}
                                    value={faq.question} 
                                    onChange={(e) => {
                                        const newFaqs = [...settings.faqs];
                                        newFaqs[idx].question = e.target.value;
                                        setSettings({...settings, faqs: newFaqs});
                                    }}
                                    placeholder="Question..." 
                                    className="w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 mb-2 p-1 font-semibold text-sm" 
                                />
                                <textarea 
                                    disabled={!isPremium}
                                    value={faq.answer} 
                                    onChange={(e) => {
                                        const newFaqs = [...settings.faqs];
                                        newFaqs[idx].answer = e.target.value;
                                        setSettings({...settings, faqs: newFaqs});
                                    }}
                                    placeholder="Answer..." 
                                    className="w-full bg-white dark:bg-gray-800 border-0 p-1 text-xs text-gray-500 resize-none h-16" 
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Testimonials */}
            <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-8 ${!isPremium ? 'opacity-60 grayscale-[0.5] relative' : ''}`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <MessageSquare size={20} className="text-blue-500" />
                        Client Testimonials
                    </h2>
                    <button 
                        disabled={!isPremium}
                        onClick={() => setSettings({...settings, testimonials: [...(settings.testimonials || []), { name: '', role: '', content: '', rating: 5, avatar: '' }]})}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                        <Plus size={16} /> Add Testimonial
                    </button>
                    {!isPremium && <span className="absolute top-2 right-2 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded">PREMIUM</span>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-medium">
                    {(settings.testimonials || []).map((t: any, idx: number) => (
                        <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-700 relative group">
                            <button 
                                onClick={() => {
                                    const newT = settings.testimonials.filter((_: any, i: number) => i !== idx);
                                    setSettings({...settings, testimonials: newT});
                                }} 
                                className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 shadow-sm"
                            >
                                <Trash2 size={12} />
                            </button>
                            <div className="flex gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                                    <input 
                                        type="text" 
                                        value={t.avatar} 
                                        onChange={(e) => {
                                            const newT = [...settings.testimonials];
                                            newT[idx].avatar = e.target.value;
                                            setSettings({...settings, testimonials: newT});
                                        }}
                                        placeholder="Img" 
                                        className="w-full h-full rounded-full text-[10px] text-center bg-transparent" 
                                    />
                                </div>
                                <div className="flex-1">
                                    <input 
                                        disabled={!isPremium}
                                        value={t.name} 
                                        onChange={(e) => {
                                            const newT = [...settings.testimonials];
                                            newT[idx].name = e.target.value;
                                            setSettings({...settings, testimonials: newT});
                                        }}
                                        placeholder="Client Name" 
                                        className="w-full bg-transparent font-bold text-sm" 
                                    />
                                    <input 
                                        disabled={!isPremium}
                                        value={t.role} 
                                        onChange={(e) => {
                                            const newT = [...settings.testimonials];
                                            newT[idx].role = e.target.value;
                                            setSettings({...settings, testimonials: newT});
                                        }}
                                        placeholder="Traveler" 
                                        className="w-full bg-transparent text-xs text-gray-400" 
                                    />
                                </div>
                            </div>
                            <textarea 
                                disabled={!isPremium}
                                value={t.content} 
                                onChange={(e) => {
                                    const newT = [...settings.testimonials];
                                    newT[idx].content = e.target.value;
                                    setSettings({...settings, testimonials: newT});
                                }}
                                placeholder="Write the testimonial here..." 
                                className="w-full bg-transparent text-xs text-gray-500 h-20 resize-none italic" 
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* SEO & Conversion Footer Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* SEO & Marketing Section */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                            <Search size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white uppercase tracking-wider">SEO & Marketing</h2>
                            <p className="text-sm text-gray-500">Boost your visibility on Search Engines</p>
                        </div>
                        {!isPremium && <span className="ml-auto bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-1 rounded">GOLD</span>}
                    </div>

                    <div className={`space-y-6 ${!isPremium ? 'opacity-60 grayscale-[0.5] relative' : ''}`}>
                        {!isPremium && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-transparent">
                                <div className="bg-white/90 dark:bg-gray-800/90 shadow-2xl border border-purple-200 dark:border-purple-900 rounded-xl p-4 flex flex-col items-center gap-3">
                                    <Lock size={24} className="text-purple-500" />
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">Upgrade to Pro/Enterprise</p>
                                </div>
                            </div>
                        )}
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meta Title</label>
                                <input
                                    disabled={!isPremium}
                                    type="text"
                                    value={settings.seoTitle || ''}
                                    onChange={(e) => setSettings({ ...settings, seoTitle: e.target.value })}
                                    placeholder="Agency Name | Best Tours in Region"
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meta Description</label>
                                <textarea
                                    disabled={!isPremium}
                                    value={settings.seoDescription || ''}
                                    onChange={(e) => setSettings({ ...settings, seoDescription: e.target.value })}
                                    rows={3}
                                    placeholder="Describe your agency for Google search results..."
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Google Analytics ID</label>
                                    <input
                                        disabled={!isPremium}
                                        type="text"
                                        value={settings.analyticsGaId || ''}
                                        onChange={(e) => setSettings({ ...settings, analyticsGaId: e.target.value })}
                                        placeholder="G-XXXXXX"
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">OpenGraph Image URL</label>
                                    <input
                                        disabled={!isPremium}
                                        type="text"
                                        value={settings.ogImageUrl || ''}
                                        onChange={(e) => setSettings({ ...settings, ogImageUrl: e.target.value })}
                                        placeholder="https://example.com/social-preview.jpg"
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Conversion Tools */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Conversion Tools</h2>
                            <p className="text-sm text-gray-500">Turn visitors into customers</p>
                        </div>
                        {!isPremium && <span className="ml-auto bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded">GOLD</span>}
                    </div>

                    <div className={`space-y-6 ${!isPremium ? 'opacity-60 grayscale-[0.5] relative' : ''}`}>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                                        <Phone size={14} /> WhatsApp Number
                                    </label>
                                    <input
                                        disabled={!isPremium}
                                        type="text"
                                        value={settings.whatsappNumber || ''}
                                        onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                                        placeholder="+212 600 000 000"
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                                        <Layout size={14} /> Custom Footer Script
                                    </label>
                                    <textarea
                                        disabled={!isPremium}
                                        value={settings.customScripts || ''}
                                        onChange={(e) => setSettings({ ...settings, customScripts: e.target.value })}
                                        rows={1}
                                        placeholder="<script>...</script>"
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-gray-900 dark:bg-black text-green-500 font-mono text-xs"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                                <div className="flex items-center gap-3">
                                    <Mail size={18} className="text-blue-500" />
                                    <div>
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white">Newsletter Subscription</p>
                                        <p className="text-[10px] text-gray-500">Collect emails from your footer</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        disabled={!isPremium}
                                        checked={settings.newsletterEnabled || false}
                                        onChange={(e) => setSettings({ ...settings, newsletterEnabled: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
