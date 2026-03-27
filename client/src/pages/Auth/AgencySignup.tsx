import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { authAPI } from '../../services/api';

const AgencySignup = () => {
    const [formData, setFormData] = useState({
        agencyName: '',
        licenseNumber: '',
        address: '',
        contactName: '',
        position: '',
        email: '',
        phone: '',
        plan: 'Basic',
        paymentMethod: 'Espèces'
    });
    const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [registeredSubdomain, setRegisteredSubdomain] = useState('');
    const navigate = useNavigate();
    // Use t from context if available, otherwise mock or import
    // Assuming context is available
    const { t } = useLanguage();

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            // Auto-generate subdomain from agency name (lowercase, alphanumeric + hyphens only)
            const generatedSubdomain = formData.agencyName
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');

            if (formData.paymentMethod !== 'Espèces' && !paymentProofFile) {
                setError('Veuillez joindre une preuve de paiement (Reçu).');
                setLoading(false);
                return;
            }

            const submitData = new FormData();
            submitData.append('name', formData.agencyName);
            submitData.append('subdomain', generatedSubdomain);
            submitData.append('contactName', formData.contactName);
            submitData.append('ownerEmail', formData.email);
            submitData.append('phone', formData.phone);
            submitData.append('password', password);
            submitData.append('address', formData.address);
            submitData.append('plan', formData.plan);
            submitData.append('paymentMethod', formData.paymentMethod);
            if (paymentProofFile) {
                submitData.append('paymentProof', paymentProofFile);
            }

            await authAPI.registerAgency(submitData);
            setRegisteredSubdomain(generatedSubdomain);
            setIsSuccess(true);
        } catch (err: any) {
            const details = err.response?.data?.details;
            let errorMsg = err.response?.data?.error || 'Registration failed';
            if (details && Array.isArray(details)) {
                errorMsg += " : " + details.map((d: any) => `${d.path?.join('.') || 'field'}: ${d.message}`).join(', ');
            } else if (details && typeof details === 'object') {
                errorMsg += " : " + JSON.stringify(details);
            }
            setError(errorMsg);
        } finally {

            setLoading(false);
        }
    };

    return (
        <div className="flex px-4 py-8 min-h-screen bg-background-light dark:bg-background-dark items-center justify-center">
            <div className="max-w-[700px] w-full bg-white dark:bg-[#1a2634] rounded-2xl shadow-xl p-8 md:p-12 border border-primary-100 dark:border-gray-700">
                {isSuccess ? (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Demande envoyée ! ✅</h2>
                        <p className="text-slate-600 dark:text-slate-300 mb-5 max-w-md mx-auto">
                            Votre demande d'inscription a été soumise avec succès. Notre équipe va examiner votre dossier.
                        </p>

                        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-5 mb-4 text-left max-w-sm mx-auto space-y-3">
                            <div className="flex items-start gap-3">
                                <span className="text-xl">🔗</span>
                                <div>
                                    <p className="font-bold text-primary-800 dark:text-primary-300 text-sm">Votre lien de connexion unique</p>
                                    <a
                                        href={(() => {
                                            const currentHost = window.location.host;
                                            const protocol = window.location.protocol;
                                            if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
                                                const portMatch = currentHost.match(/:\d+/);
                                                const port = portMatch ? portMatch[0] : '';
                                                return `${protocol}//${registeredSubdomain}.localhost${port}/login`;
                                            } else {
                                                const baseDomain = currentHost.split('.').slice(-2).join('.');
                                                return `${protocol}//${registeredSubdomain}.${baseDomain}/login`;
                                            }
                                        })()}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-mono text-primary-600 dark:text-primary-400 hover:underline break-all"
                                    >
                                        {(() => {
                                            const currentHost = window.location.host;
                                            if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
                                                const portMatch = currentHost.match(/:\d+/);
                                                const port = portMatch ? portMatch[0] : '';
                                                return `${registeredSubdomain}.localhost${port}/login`;
                                            } else {
                                                const baseDomain = currentHost.split('.').slice(-2).join('.');
                                                return `${registeredSubdomain}.${baseDomain}/login`;
                                            }
                                        })()}
                                    </a>
                                    <p className="text-xs text-primary-600 dark:text-primary-500 mt-1">📌 Sauvegardez ce lien dans vos favoris</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5 mb-6 text-left max-w-sm mx-auto space-y-3">
                            <div className="flex items-start gap-3">
                                <span className="text-xl">⏳</span>
                                <div>
                                    <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">Examen sous 24h ouvrables</p>
                                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Vous recevrez une confirmation par email une fois approuvé.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 border-t border-amber-100 dark:border-amber-800 pt-3">
                                <span className="text-xl">📤</span>
                                <div>
                                    <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">Preuve de paiement manquante ?</p>
                                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Connectez-vous via votre lien ci-dessus et téléchargez votre reçu depuis votre tableau de bord.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <a
                                href={(() => {
                                    const currentHost = window.location.host;
                                    const protocol = window.location.protocol;
                                    if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
                                        const portMatch = currentHost.match(/:\d+/);
                                        const port = portMatch ? portMatch[0] : '';
                                        return `${protocol}//${registeredSubdomain}.localhost${port}/login`;
                                    } else {
                                        const baseDomain = currentHost.split('.').slice(-2).join('.');
                                        return `${protocol}//${registeredSubdomain}.${baseDomain}/login`;
                                    }
                                })()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary inline-flex items-center justify-center h-11 px-8 text-sm font-bold"
                            >
                                Se connecter maintenant
                            </a>
                            <Link to="/" className="inline-flex items-center justify-center h-11 px-8 text-sm font-bold border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                                Retour à l'accueil
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="mb-8">
                            <span className="text-xs font-bold tracking-wider text-primary uppercase mb-2 block">{t('auth.partner_program')}</span>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('auth.agency_title')}</h1>
                            <p className="text-slate-500 dark:text-slate-400">{t('auth.agency_subtitle')}</p>
                        </div>

                        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                    {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

                    {/* Agency Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-gray-200 border-b pb-2 border-gray-100 dark:border-gray-700">{t('auth.agency_info')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('auth.agency_name')}</label>
                                <input name="agencyName" onChange={handleChange} required className="input-field h-11" placeholder="e.g. Al-Djazair Travels" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('auth.license_number')}</label>
                                <input name="licenseNumber" onChange={handleChange} className="input-field h-11" placeholder="License / RC Number" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('auth.address')}</label>
                            <input name="address" onChange={handleChange} className="input-field h-11" placeholder="Full address" />
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-gray-200 border-b pb-2 border-gray-100 dark:border-gray-700">{t('auth.contact_person')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('auth.full_name')}</label>
                                <input name="contactName" onChange={handleChange} required className="input-field h-11" placeholder="Manager Name" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('auth.position')}</label>
                                <input name="position" onChange={handleChange} className="input-field h-11" placeholder="e.g. General Manager" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('auth.email')}</label>
                                <input type="email" name="email" onChange={handleChange} required className="input-field h-11" placeholder="This will be your login" dir="ltr" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('auth.phone')}</label>
                                <input type="tel" name="phone" onChange={handleChange} required className="input-field h-11" placeholder="+213 ..." dir="ltr" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('auth.password')}</label>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field h-11" placeholder="••••••••" dir="ltr" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('auth.confirm_password')}</label>
                                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="input-field h-11" placeholder="••••••••" dir="ltr" />
                            </div>
                        </div>
                    </div>

                    {/* Plan Selection */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-gray-200 border-b pb-2 border-gray-100 dark:border-gray-700">Subscription Plan</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {['Basic', 'Pro', 'Enterprise'].map((planOption) => (
                                <div 
                                    key={planOption}
                                    onClick={() => setFormData({ ...formData, plan: planOption })}
                                    className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${formData.plan === planOption ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'}`}
                                >
                                    <div className={`font-bold text-lg mb-1 ${formData.plan === planOption ? 'text-primary' : 'text-slate-800 dark:text-slate-200'}`}>
                                        {planOption}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {planOption === 'Basic' ? 'Start small, grow big.' : planOption === 'Pro' ? 'For growing businesses.' : 'Advanced features.'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-gray-200 border-b pb-2 border-gray-100 dark:border-gray-700">Méthode de Paiement (Payment Method)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {['Espèces', 'Virement Bancaire', 'BaridiMob'].map((method) => (
                                <div 
                                    key={method}
                                    onClick={() => setFormData({ ...formData, paymentMethod: method })}
                                    className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${formData.paymentMethod === method ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'}`}
                                >
                                    <div className={`font-bold text-[15px] mb-1 ${formData.paymentMethod === method ? 'text-primary' : 'text-slate-800 dark:text-slate-200'}`}>
                                        {method}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {method === 'Espèces' ? 'Paiement en espèces au bureau' : method === 'Virement Bancaire' ? 'Virement bancaire classique' : 'Transfert rapide (Edahabia)'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Conditional Payment Proof Upload */}
                    {formData.paymentMethod !== 'Espèces' && (
                        <div className="space-y-4 p-5 bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900 rounded-xl">
                            <div>
                                <h3 className="text-[15px] font-bold text-slate-800 dark:text-gray-200 mb-1">Preuve de paiement (Reçu) <span className="text-red-500">*</span></h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Veuillez joindre une capture d'écran, un reçu ou un PDF confirmant votre paiement.</p>
                                
                                <div className="flex items-center justify-center w-full">
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-800 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                                            {paymentProofFile ? (
                                                <>
                                                    <svg className="w-8 h-8 mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                    <p className="text-sm font-semibold text-green-600 truncate max-w-full">{paymentProofFile.name}</p>
                                                    <p className="text-xs text-slate-500 hidden sm:block">Cliquez pour remplacer</p>
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-8 h-8 mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                                    <p className="mb-2 text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold">Cliquez pour uploader image/pdf</span> ou glissez le fichier ici</p>
                                                </>
                                            )}
                                        </div>
                                        <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setPaymentProofFile(e.target.files[0]);
                                            }
                                        }} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    <button disabled={loading} className="btn-primary h-12 w-full text-base font-bold mt-4 disabled:opacity-50">
                        {loading ? 'Processing...' : t('auth.submit_application')}
                    </button>

                    <p className="text-center text-sm text-slate-500">
                        {t('auth.already_account')} <Link to="/login/agency" className="text-primary font-bold hover:underline">{t('auth.login_btn')}</Link>
                    </p>
                </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default AgencySignup;
