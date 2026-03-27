import React, { useState, useEffect } from 'react';
import { settingsAPI, offersAPI } from '../../services/api';
import { Save, Image as ImageIcon, Plus, Trash2, Palette, MapPin, Type, Edit3, Phone, Mail, Video, Layout, Languages, ShieldCheck, Smartphone, Lock, Globe, MessageSquare, Megaphone, Share2, BarChart3, HelpCircle, Star, Hash, Search, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useLanguage } from '../../context/LanguageContext';

export default function HomepageBuilder() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    const [settings, setSettings] = useState({
        logoUrl: '',
        displayName: '',
        slogan: '',
        primaryColor: '#3b82f6',
        contactEmail: '',
        contactPhone: '',
        contactAddress: '',
        mapEmbedUrl: '',
        socialLinks: { facebook: '', instagram: '', twitter: '' },
        fontFamily: 'Inter',
        videoUrl: '',
        secondaryColor: '#10B981',
        borderRadius: '8px',
        seoTitle: '',
        seoDescription: '',
        analyticsGaId: '',
        analyticsFbId: '',
        analyticsTiktokId: '',
        ogImageUrl: '',
        testimonials: [] as any[],
        faqs: [] as any[],
        trustStats: [] as any[],
        whatsappNumber: '',
        whatsappMessage: '',
        newsletterEnabled: false,
        customScripts: '',
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
            toast.success(isFeatured ? t('homepage_builder.toast.offer_featured') : t('homepage_builder.toast.offer_removed'));
        } catch (error) {
            console.error('Error toggling featured status:', error);
            toast.error(t('homepage_builder.toast.update_failed'));
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
            toast.error(t('homepage_builder.toast.load_failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (isPremium) {
            if (settings.videoUrl && !settings.videoUrl.startsWith('http')) {
                toast.error('Video URL must be a valid link');
                return;
            }
            if (settings.whatsappNumber && !/^[0-9+\s]+$/.test(settings.whatsappNumber)) {
                toast.error('Invalid WhatsApp number format');
                return;
            }
            if (settings.analyticsGaId && !/^(G-|UA-)[A-Z0-9-]+$/i.test(settings.analyticsGaId)) {
                toast.error('Invalid Google Analytics ID');
                return;
            }
        }

        try {
            setSaving(true);
            await settingsAPI.updateHomepageSettings({
                settings,
                slides: slides.map((s, index) => ({ ...s, orderIndex: index }))
            });
            toast.success(t('homepage_builder.toast.save_success'));
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error(t('homepage_builder.toast.save_failed'));
        } finally {
            setSaving(false);
        }
    };

    const handleAddSlide = () => {
        setSlides([...slides, { imageUrl: '', title: '', description: '', ctaText: '', ctaUrl: '', isActive: true }]);
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
        if (!file.type.startsWith('image/')) { toast.error(t('homepage_builder.toast.upload_image_only')); return; }
        if (file.size > 2 * 1024 * 1024) { toast.error(t('homepage_builder.toast.file_too_large')); return; }

        try {
            setUploading(true);
            const { logoUrl } = await settingsAPI.uploadLogo(file);
            setSettings({ ...settings, logoUrl });
            toast.success(t('homepage_builder.toast.logo_uploaded'));
        } catch (error) {
            toast.error(t('homepage_builder.toast.upload_failed'));
        } finally {
            setUploading(false);
        }
    };

    const handleSlideUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { toast.error(t('homepage_builder.toast.upload_image_only')); return; }
        if (file.size > 5 * 1024 * 1024) { toast.error(t('homepage_builder.toast.file_too_large')); return; }

        try {
            setUploading(true);
            const { imageUrl } = await settingsAPI.uploadHeroImage(file);
            handleSlideChange(index, 'imageUrl', imageUrl);
            toast.success(t('homepage_builder.toast.slide_uploaded'));
        } catch (error) {
            toast.error(t('homepage_builder.toast.slide_upload_failed'));
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('homepage_builder.title')}</h1>
                    <p className="text-gray-500 text-sm mt-1">{t('homepage_builder.description')}</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200 dark:shadow-none disabled:opacity-50"
                >
                    <Save size={18} />
                    {saving ? t('homepage_builder.saving') : t('homepage_builder.publish_changes')}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="space-y-8 animate-in fade-in slide-in-from-left duration-500">
                    {/* Brand Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-gray-100">
                            <Palette size={20} className="text-blue-500" />
                            {t('homepage_builder.branding_theme')}
                        </h2>
                        
                        <div className="space-y-5">
                            {/* Logo */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('homepage_builder.agency_logo')}</label>
                                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <div className="w-12 h-12 rounded-lg bg-white dark:bg-gray-800 border dark:border-gray-700 flex items-center justify-center overflow-hidden">
                                        {settings.logoUrl ? <img src={settings.logoUrl} className="w-full h-full object-contain" /> : <ImageIcon className="text-gray-400" size={20} />}
                                    </div>
                                    <label className="text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-md cursor-pointer hover:bg-gray-50 transition">
                                        {uploading ? '...' : t('homepage_builder.change')}
                                        <input type="file" onChange={handleLogoUpload} accept="image/*" className="hidden" />
                                    </label>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('homepage_builder.display_name')}</label>
                                    <input
                                        type="text"
                                        value={settings.displayName}
                                        onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                                        className="w-full border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg p-2.5 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('homepage_builder.slogan')}</label>
                                    <input
                                        type="text"
                                        value={settings.slogan}
                                        onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
                                        className="w-full border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg p-2.5 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Base Theme */}
                            <div className="pt-4 border-t dark:border-gray-700">
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">{t('homepage_builder.primary_color')}</label>
                                <div className="flex items-center gap-3">
                                    <input type="color" value={settings.primaryColor} onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} className="w-10 h-10 rounded border-0" />
                                    <input type="text" value={settings.primaryColor} onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })} className="flex-1 border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg p-2 text-sm font-mono" />
                                </div>
                            </div>

                            {/* Premium Branding (Democratized) */}
                            <div className={`pt-4 border-t dark:border-gray-700 space-y-4`}>
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-gray-500 uppercase">{t('homepage_builder.premium_theme')}</label>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1">{t('homepage_builder.font_family')}</label>
                                        <select value={settings.fontFamily} onChange={(e) => setSettings({...settings, fontFamily: e.target.value})} className="w-full border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg p-2 text-xs">
                                            <option value="Inter">Inter</option>
                                            <option value="Outfit">Outfit</option>
                                            <option value="Montserrat">Montserrat</option>
                                            <option value="Playfair Display">Playfair</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1">{t('homepage_builder.radius')}</label>
                                        <select value={settings.borderRadius} onChange={(e) => setSettings({...settings, borderRadius: e.target.value})} className="w-full border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg p-2 text-xs">
                                            <option value="0px">{t('homepage_builder.radius_square')}</option>
                                            <option value="4px">{t('homepage_builder.radius_small')}</option>
                                            <option value="8px">{t('homepage_builder.radius_medium')}</option>
                                            <option value="16px">{t('homepage_builder.radius_large')}</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] text-gray-400 mb-1">{t('homepage_builder.hero_video_url')}</label>
                                    <input type="text" value={settings.videoUrl || ''} onChange={(e) => setSettings({...settings, videoUrl: e.target.value})} className="w-full border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg p-2 text-xs" placeholder="https://..." />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-gray-100">
                            <MapPin size={20} className="text-green-500" />
                            {t('homepage_builder.contact_location')}
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase">{t('homepage_builder.public_email')}</label>
                                <input type="email" value={settings.contactEmail} onChange={(e) => setSettings({...settings, contactEmail: e.target.value})} className="w-full border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg p-2.5 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase">{t('homepage_builder.phone_number')}</label>
                                <input type="tel" value={settings.contactPhone} onChange={(e) => setSettings({...settings, contactPhone: e.target.value})} className="w-full border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg p-2.5 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase">{t('homepage_builder.office_address')}</label>
                                <textarea value={settings.contactAddress} onChange={(e) => setSettings({...settings, contactAddress: e.target.value})} rows={2} className="w-full border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg p-2.5 text-sm resize-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column (Hero & Featured) */}
                <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-right duration-500">
                    {/* Hero Carousel */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                                <ImageIcon size={20} className="text-purple-500" />
                                {t('homepage_builder.hero_slides')}
                            </h2>
                            <button onClick={handleAddSlide} className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 font-bold px-3 py-1.5 rounded-lg hover:bg-purple-200 transition flex items-center gap-1">
                                <Plus size={14} /> {t('homepage_builder.add_slide')}
                            </button>
                        </div>

                        <div className="space-y-4">
                            {slides.map((slide, idx) => (
                                <div key={idx} className="group p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl border dark:border-gray-700 relative">
                                    <button onClick={() => handleRemoveSlide(idx)} className="absolute top-2 right-2 text-red-500 p-1 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16} /></button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <div className="flex gap-2">
                                                <input value={slide.imageUrl} onChange={(e) => handleSlideChange(idx, 'imageUrl', e.target.value)} placeholder={t('homepage_builder.image_url')} className="flex-1 text-xs p-2 rounded border dark:bg-gray-800 dark:border-gray-700" />
                                                <label className="flex items-center justify-center p-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded cursor-pointer hover:bg-gray-50 transition min-w-[40px]">
                                                    <ImageIcon size={14} className="text-blue-500" />
                                                    <input type="file" onChange={(e) => handleSlideUpload(idx, e)} accept="image/*" className="hidden" />
                                                </label>
                                            </div>
                                            <input value={slide.title} onChange={(e) => handleSlideChange(idx, 'title', e.target.value)} placeholder={t('homepage_builder.slide_title')} className="w-full text-sm font-bold p-2 bg-transparent" />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input value={slide.ctaText} onChange={(e) => handleSlideChange(idx, 'ctaText', e.target.value)} placeholder={t('homepage_builder.button_text')} className="w-full text-xs p-2 rounded border dark:bg-gray-800" />
                                                <input value={slide.ctaUrl} onChange={(e) => handleSlideChange(idx, 'ctaUrl', e.target.value)} placeholder={t('homepage_builder.button_url')} className="w-full text-xs p-2 rounded border dark:bg-gray-800" />
                                            </div>
                                        </div>
                                        <div className="bg-gray-200 dark:bg-gray-800 rounded-lg h-32 overflow-hidden relative border dark:border-gray-700">
                                            {slide.imageUrl && <img src={slide.imageUrl} className="w-full h-full object-cover" />}
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-2 text-center">
                                                <span className="text-white font-bold text-xs">{slide.title || 'Slide Preview'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Featured Packages (UI Management) */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-gray-100">
                            <Star size={20} className="text-amber-500" />
                            {t('homepage_builder.featured_offers')}
                        </h2>
                        {loadingOffers ? (
                            <div className="text-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                {offers.length === 0 ? (
                                    <p className="col-span-2 text-center text-gray-500 py-10">{t('homepage_builder.no_offers_found')}</p>
                                ) : (
                                    offers.map(offer => (
                                        <div key={offer.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${offer.isFeatured ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/50 shadow-sm' : 'bg-gray-50 dark:bg-gray-900/40 border-gray-100 dark:border-gray-700'}`}>
                                            <div className="w-12 h-12 rounded-lg bg-white dark:bg-gray-800 overflow-hidden flex-shrink-0">
                                                {offer.imageUrl ? <img src={offer.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon size={16} className="m-auto text-gray-400" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold truncate">{offer.title}</p>
                                                <p className="text-[10px] text-gray-500 uppercase">{offer.category || 'Package'}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleToggleFeatured(offer.id, !offer.isFeatured)}
                                                className={`p-2 rounded-lg transition ${offer.isFeatured ? 'text-amber-600' : 'text-gray-300 hover:text-amber-400'}`}
                                            >
                                                <Star size={18} fill={offer.isFeatured ? 'currentColor' : 'none'} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                        <p className="mt-4 text-[10px] text-gray-400 flex items-center gap-1 uppercase tracking-widest"><ShieldCheck size={10} /> Toggle favorites to display them in the featured carousel on your landing page.</p>
                    </div>
                </div>
            </div>

            {/* Interactive Sections (Stats & FAQ) - Democratized */}
            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8`}>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100"><ShieldCheck size={20} className="text-blue-500" /> {t('homepage_builder.trust_stats')}</h2>
                        <button onClick={() => setSettings({...settings, trustStats: [...settings.trustStats, {label: '', value: ''}]})} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Plus size={18} /></button>
                    </div>
                    <div className="space-y-3">
                        {settings.trustStats.map((stat, i) => (
                            <div key={i} className="flex gap-2 p-2 bg-gray-50 dark:bg-gray-900/40 rounded-lg border dark:border-gray-700">
                                <input value={stat.value} onChange={(e) => {
                                    const next = [...settings.trustStats]; next[i].value = e.target.value; setSettings({...settings, trustStats: next});
                                }} placeholder="10k+" className="w-16 text-xs p-1.5 border dark:bg-gray-900 rounded dark:border-gray-700" />
                                <input value={stat.label} onChange={(e) => {
                                    const next = [...settings.trustStats]; next[i].label = e.target.value; setSettings({...settings, trustStats: next});
                                }} placeholder="Experience" className="flex-1 text-xs p-1.5 border dark:bg-gray-900 rounded dark:border-gray-700" />
                                <button onClick={() => setSettings({...settings, trustStats: settings.trustStats.filter((_, idx) => idx !== i)})} className="text-red-400 p-1"><Trash2 size={14} /></button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 text-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100"><HelpCircle size={20} className="text-amber-500" /> {t('homepage_builder.manage_faq')}</h2>
                        <button onClick={() => setSettings({...settings, faqs: [...settings.faqs, {question: '', answer: ''}]})} className="text-xs bg-amber-50 text-amber-600 font-bold px-3 py-1.5 rounded-lg border border-amber-100">{t('homepage_builder.add_question')}</button>
                    </div>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {settings.faqs.map((faq, i) => (
                            <div key={i} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border dark:border-gray-700 relative group">
                                <button onClick={() => setSettings({...settings, faqs: settings.faqs.filter((_, idx) => idx !== i)})} className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 p-1"><Trash2 size={14} /></button>
                                <input value={faq.question} onChange={(e) => {
                                    const next = [...settings.faqs]; next[i].question = e.target.value; setSettings({...settings, faqs: next});
                                }} placeholder={t('homepage_builder.placeholder_question')} className="w-full font-bold bg-transparent mb-2 outline-none border-b border-gray-200 dark:border-gray-700 pb-1" />
                                <textarea value={faq.answer} onChange={(e) => {
                                    const next = [...settings.faqs]; next[i].answer = e.target.value; setSettings({...settings, faqs: next});
                                }} placeholder={t('homepage_builder.placeholder_answer')} className="w-full text-xs text-gray-500 bg-transparent resize-none outline-none" rows={2} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Testimonials - Democratized */}
            <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700`}>
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100"><MessageSquare size={20} className="text-indigo-500" /> {t('homepage_builder.testimonials')}</h2>
                    <button onClick={() => setSettings({...settings, testimonials: [...settings.testimonials, {name: '', role: '', content: '', avatar: ''}]})} className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition">{t('homepage_builder.add_review')}</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {settings.testimonials.map((t, i) => (
                        <div key={i} className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border dark:border-gray-700 relative shadow-sm">
                            <button onClick={() => setSettings({...settings, testimonials: settings.testimonials.filter((_, idx) => idx !== i)})} className="absolute -top-3 -right-3 bg-white dark:bg-gray-800 text-red-500 dark:border-gray-700 border rounded-full p-2 shadow-sm hover:scale-110 transition"><Trash2 size={14} /></button>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 border dark:border-gray-700 flex items-center justify-center p-1 overflow-hidden">
                                    {t.avatar ? <img src={t.avatar} className="w-full h-full rounded-full object-cover" /> : <Star size={20} className="text-amber-400" fill="currentColor" />}
                                </div>
                                <div className="flex-1">
                                    <input value={t.name} onChange={(e) => { const next = [...settings.testimonials]; next[i].name = e.target.value; setSettings({...settings, testimonials: next}); }} className="w-full text-sm font-bold bg-transparent outline-none" placeholder={t('homepage_builder.placeholder_client_name')} />
                                    <input value={t.role} onChange={(e) => { const next = [...settings.testimonials]; next[i].role = e.target.value; setSettings({...settings, testimonials: next}); }} className="w-full text-[10px] text-gray-400 uppercase tracking-tighter" placeholder={t('homepage_builder.placeholder_role')} />
                                </div>
                            </div>
                            <textarea value={t.content} onChange={(e) => { const next = [...settings.testimonials]; next[i].content = e.target.value; setSettings({...settings, testimonials: next}); }} className="w-full text-xs text-gray-500 bg-transparent resize-none italic leading-relaxed" rows={4} placeholder={t('homepage_builder.placeholder_testimonial')} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Grid: SEO & Conversion - Democratized */}
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8`}>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><Search size={20} className="text-red-500" /> {t('homepage_builder.seo_social')}</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{t('homepage_builder.landing_page_title')}</label>
                            <input value={settings.seoTitle || ''} onChange={(e) => setSettings({...settings, seoTitle: e.target.value})} className="w-full border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg p-2.5 text-sm" placeholder="e.g. Best Travel Agency in Paris" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{t('homepage_builder.meta_description')}</label>
                            <textarea value={settings.seoDescription || ''} onChange={(e) => setSettings({...settings, seoDescription: e.target.value})} className="w-full border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg p-2.5 text-sm resize-none" rows={3} placeholder="Briefly describe what makes your agency unique..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{t('homepage_builder.analytics_id')}</label>
                                <input value={settings.analyticsGaId || ''} onChange={(e) => setSettings({...settings, analyticsGaId: e.target.value})} className="w-full border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg p-2 text-xs" placeholder="G-XXXXXX" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{t('homepage_builder.og_image')}</label>
                                <input value={settings.ogImageUrl || ''} onChange={(e) => setSettings({...settings, ogImageUrl: e.target.value})} className="w-full border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg p-2 text-xs" placeholder="URL of image for Facebook/Twitter sharing" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><Megaphone size={20} className="text-green-500" /> {t('homepage_builder.conversion_leads')}</h2>
                    <div className="space-y-5">
                        <div className="flex items-center justify-between p-4 bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-800/40 rounded-full text-green-600"><Phone size={20} /></div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-green-700 dark:text-green-400">{t('homepage_builder.whatsapp_button')}</p>
                                    <p className="text-[10px] text-gray-500">{t('homepage_builder.whatsapp_desc')}</p>
                                </div>
                            </div>
                            <input value={settings.whatsappNumber || ''} onChange={(e) => setSettings({...settings, whatsappNumber: e.target.value})} className="w-40 text-xs p-2 border-0 bg-white dark:bg-gray-800 rounded-lg shadow-inner shadow-gray-100 dark:shadow-none" placeholder="+212..." />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-800/40 rounded-full text-blue-600"><Mail size={20} /></div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400">{t('homepage_builder.newsletter_widget')}</p>
                                    <p className="text-[10px] text-gray-500">{t('homepage_builder.newsletter_desc')}</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={settings.newsletterEnabled || false} onChange={e => setSettings({...settings, newsletterEnabled: e.target.checked})} className="sr-only peer" />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1"><Layout size={12} /> {t('homepage_builder.custom_scripts')}</label>
                            <textarea value={settings.customScripts || ''} onChange={(e) => setSettings({...settings, customScripts: e.target.value})} className="w-full border-none bg-gray-950 text-green-500 font-mono text-[10px] p-4 rounded-xl shadow-inner shadow-black" rows={4} placeholder="<script> (e.g. Meta Pixel, Hotjar...) </script>" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
