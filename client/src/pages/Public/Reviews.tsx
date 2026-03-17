import { useLanguage } from '../../context/LanguageContext';

const Reviews = () => {
    const { t } = useLanguage();

    const reviews = [
        {
            id: 1,
            text: 'Une expérience inoubliable. L\'organisation était parfaite du début à la fin. Les guides étaient très instruits et serviables.',
            author: 'Mohamed Amine',
            trip: 'Hajj 2023',
            rating: 5,
            image: 'https://i.pravatar.cc/150?u=a042581f4e29026704d'
        },
        {
            id: 2,
            text: 'Service exceptionnel. Les hôtels étaient très proches du Haram, ce qui a rendu notre Omra très confortable avec les enfants.',
            author: 'Fatima Z.',
            trip: 'Omrah Ramadan',
            rating: 5,
            image: 'https://i.pravatar.cc/150?u=a042581f4e29026024d'
        },
        {
            id: 3,
            text: 'Barkallah oufikoum pour cette belle organisation. Je recommande vivement Trajetour pour leur sérieux et leur honnêteté.',
            author: 'Karim B.',
            trip: 'Omrah 2024',
            rating: 4,
            image: 'https://i.pravatar.cc/150?u=a04258114e29026302d'
        }
    ];

    return (
        <div className="bg-background-light dark:bg-background-dark py-20 px-4">
            <div className="max-w-7xl mx-auto text-center mb-16">
                <h1 className="text-4xl font-black text-[#0e141b] dark:text-white mb-4">{t('public.reviews.title')}</h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">{t('public.reviews.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {reviews.map((review) => (
                    <div key={review.id} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-1 text-amber-400 mb-6">
                            {[...Array(5)].map((_, i) => (
                                <span key={i} className={`material-symbols-outlined text-2xl ${i < review.rating ? 'fill-current' : 'text-gray-300'}`}>star</span>
                            ))}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed italic mb-8 flex-1">"{review.text}"</p>
                        <div className="flex items-center gap-4 mt-auto">
                            <img src={review.image} alt={review.author} className="w-12 h-12 rounded-full border-2 border-primary/20" />
                            <div>
                                <h4 className="font-bold text-[#0e141b] dark:text-white">{review.author}</h4>
                                <p className="text-xs text-primary font-medium uppercase tracking-wide">{review.trip}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Reviews;
