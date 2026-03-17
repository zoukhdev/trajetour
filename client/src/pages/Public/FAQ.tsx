import { useLanguage } from '../../context/LanguageContext';

const FAQ = () => {
    const { t } = useLanguage();

    const faqs = [1, 2, 3];

    return (
        <div className="bg-background-light dark:bg-background-dark py-16 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-[#0e141b] dark:text-white mb-4">{t('public.faq.title')}</h1>
                    <p className="text-gray-600 dark:text-gray-400">{t('public.faq.subtitle')}</p>
                </div>

                <div className="space-y-4">
                    {faqs.map((i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-lg text-[#0e141b] dark:text-white mb-2">{t(`public.faq.q${i}`)}</h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{t(`public.faq.a${i}`)}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FAQ;
