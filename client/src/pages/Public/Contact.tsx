import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const Contact = () => {
    const { t } = useLanguage();
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
        // Add actual submission logic here
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen py-16 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-black text-[#0e141b] dark:text-white mb-4">{t('public.contact.title')}</h1>
                    <p className="text-gray-600 dark:text-gray-400">{t('public.contact.subtitle')}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                    <div className="p-10 lg:p-16 flex flex-col justify-center">
                        <h2 className="text-2xl font-bold text-[#0e141b] dark:text-white mb-8">Get in Touch</h2>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            {sent ? (
                                <div className="p-4 bg-green-50 text-green-700 rounded-xl text-center font-bold animate-fade-in">
                                    {t('public.contact.sent')}
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('public.contact.name')}</label>
                                        <input type="text" className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('public.contact.email')}</label>
                                        <input type="email" className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all" required dir="ltr" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('public.contact.message')}</label>
                                        <textarea rows={4} className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all resize-none" required></textarea>
                                    </div>
                                    <button className="h-14 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30 text-lg">
                                        {t('public.contact.send')}
                                    </button>
                                </>
                            )}
                        </form>
                    </div>

                    <div className="bg-primary p-10 lg:p-16 text-white flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>

                        <div className="relative z-10">
                            <h3 className="text-2xl font-bold mb-8">Contact Info</h3>
                            <ul className="flex flex-col gap-8">
                                <li className="flex items-start gap-4">
                                    <div className="size-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
                                        <span className="material-symbols-outlined text-2xl">location_on</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg mb-1">Our Office</p>
                                        <p className="text-blue-100 leading-relaxed">123 Pilgrim Street, Es-Senia<br />Oran, Algeria</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="size-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
                                        <span className="material-symbols-outlined text-2xl flipped-rtl">call</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg mb-1">Phone</p>
                                        <p className="text-blue-100" dir="ltr">+213 550 32 30 20</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="size-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0">
                                        <span className="material-symbols-outlined text-2xl">mail</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg mb-1">Email</p>
                                        <p className="text-blue-100">contact@trajetour.com</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <div className="relative z-10 mt-12">
                            <p className="text-blue-100 text-sm">Working Hours: Sat - Thu, 9:00 AM - 5:00 PM</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
