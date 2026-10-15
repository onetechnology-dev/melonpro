import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Key, 
  CheckCircle2, 
  AlertCircle,
  Code2,
  UserCog,
  Sprout,
  Users2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../locales/i18nContext';
import { useMapSettings } from '../../context/MapSettingsContext';
import { getDarknessOverlayClasses, getBlurClass } from '../../data/loginBackgroundPresets';
import { UserRole } from '../../types/auth';
import { MelonLogo } from '../common/MelonIllustrations';
import greenhouseBg from '../../assets/images/greenhouse_mode_bg.jpg';

export const LoginFormView: React.FC = () => {
  const { login, quickLoginAsRole, users } = useAuth();
  const { language, setLanguage } = useI18n();
  const { loginBgUrl, loginBgConfig, projectName, footTag, showDemoAccounts } = useMapSettings();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim()) {
      setErrorMessage(language === 'km' ? 'សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់ ឬអ៊ីមែល' : 'Please enter your username or email');
      return;
    }
    if (!password) {
      setErrorMessage(language === 'km' ? 'សូមបញ្ចូលលេខសម្ងាត់' : 'Please enter your password');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await login(usernameOrEmail, password);
      if (!res.success) {
        setErrorMessage(res.message || (language === 'km' ? 'លេខសម្ងាត់ ឬឈ្មោះអ្នកប្រើមិនត្រឹមត្រូវ' : 'Invalid credentials'));
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    setIsLoading(true);
    setErrorMessage(null);
    setTimeout(() => {
      quickLoginAsRole(role);
      setIsLoading(false);
    }, 200);
  };

  const handleSelectDemoCredentials = (username: string) => {
    setUsernameOrEmail(username);
    setPassword('123');
    setErrorMessage(null);
  };

  // Helper to dynamically get demo user by role
  const getDemoUser = (role: UserRole) => {
    return users.find((u) => u.role === role);
  };

  const devUser = getDemoUser('developer') || {
    name: 'Meng Luk',
    nameKm: 'ម៉េង លុក',
    username: 'developer'
  };

  const adminUser = getDemoUser('admin') || {
    name: 'Sokha Chea',
    nameKm: 'ជា សុខា',
    username: 'admin'
  };

  const farmerUser = getDemoUser('farmer') || {
    name: 'Bunthoeun Mean',
    nameKm: 'មាន ប៊ុនធឿន',
    username: 'farmer'
  };

  const teamUser = getDemoUser('team') || {
    name: 'Sreymom Pich',
    nameKm: 'ពេជ្រ ស្រីមុំ',
    username: 'team'
  };

  const darknessClass = getDarknessOverlayClasses(loginBgConfig?.darkness || 'balanced');
  const blurClass = getBlurClass(loginBgConfig?.blur || 'subtle');
  const activeBg = loginBgUrl || greenhouseBg;

  return (
    <div className={`relative min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden w-full flex flex-col justify-between overflow-x-hidden ${language === 'km' ? 'font-khmer' : ''}`}>
      {/* Background Image with Ambient Glass Overlays */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transform scale-102 transition-all duration-700"
        style={{ backgroundImage: `url(${activeBg})` }}
      >
        <div className={`absolute inset-0 ${darknessClass} ${blurClass} transition-all duration-700`} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/40 to-black/80 pointer-events-none" />
      </div>

      {/* Top Header Bar - Compact */}
      <header className="relative z-10 w-full px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 6 }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer"
          >
            <MelonLogo className="w-8 h-8 sm:w-9 sm:h-9 drop-shadow-md" />
          </motion.div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-xl font-black text-white tracking-tight drop-shadow-md">
                {projectName}
              </span>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                v2.6 ERP
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-emerald-200/90 font-medium tracking-wide">
              {language === 'km' ? 'ប្រព័ន្ធគ្រប់គ្រងចំការត្រសក់ផ្អែមឆ្លាតវៃ' : 'Smart Melon Farm & Crop Operations'}
            </p>
          </div>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center bg-black/40 backdrop-blur-md p-0.5 rounded-xl border border-white/15 shadow-md">
          <button
            type="button"
            onClick={() => setLanguage('km')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              language === 'km' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            ភាសាខ្មែរ
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              language === 'en' 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            English
          </button>
        </div>
      </header>

      {/* Main Container - Centered and fit to viewport */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-3.5 sm:px-5 py-1 flex-1 flex flex-col items-center justify-center min-h-0">
        {/* Glassmorphic Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md bg-slate-900/85 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-4 sm:p-5 text-white relative overflow-hidden shrink-0"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Form Header */}
          <div className="text-center mb-3">
            <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md mb-1.5">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {language === 'km' ? `ចូលប្រើប្រព័ន្ធ ${projectName}` : `Sign In to ${projectName}`}
            </h1>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {language === 'km' 
                ? 'សូមបញ្ចូលគណនីរបស់អ្នកដើម្បីចូលមើលទិន្នន័យចំការ' 
                : 'Enter your credentials to access farm management'}
            </p>
          </div>

          {/* Error Banner */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-2.5 p-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="flex-1">{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Fields - Compact layout */}
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {/* Username / Email */}
            <div>
              <label className="block text-[11px] font-bold text-slate-200 mb-1">
                {language === 'km' ? 'ឈ្មោះអ្នកប្រើប្រាស់ ឬ អ៊ីមែល' : 'Username or Email'}
              </label>
              <div className="relative flex items-center">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder={language === 'km' ? 'developer, admin, farmer, ឬ team' : 'developer, admin, farmer, or team'}
                  className="w-full pl-9 pr-3 py-1.5 sm:py-2 bg-slate-800/80 border border-slate-700 hover:border-emerald-500/50 focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-200">
                  {language === 'km' ? 'លេខសម្ងាត់' : 'Password'}
                </label>
                {showDemoAccounts && (
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/70 px-2 py-0.2 rounded border border-emerald-500/30">
                    Demo: 123
                  </span>
                )}
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-1.5 sm:py-2 bg-slate-800/80 border border-slate-700 hover:border-emerald-500/50 focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all shadow-inner font-mono"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Autofill */}
            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-800"
                />
                <span>{language === 'km' ? 'ចងចាំការចូលប្រើ' : 'Remember me'}</span>
              </label>

              <button
                type="button"
                onClick={() => handleSelectDemoCredentials('developer')}
                className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline cursor-pointer"
              >
                {language === 'km' ? 'បំពេញគណនី Dev' : 'Autofill Dev'}
              </button>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-2 sm:py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-md shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 text-xs sm:text-sm"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{language === 'km' ? 'ចូលប្រើប្រព័ន្ធ' : 'Sign In to Workspace'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* DEMO ACCOUNTS DIRECTORY CARD - PLACED DIRECTLY BELOW FORM LOGIN */}
        {showDemoAccounts && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="w-full max-w-4xl mt-2.5 sm:mt-3 bg-slate-900/85 backdrop-blur-xl rounded-2xl border border-white/20 p-3 sm:p-3.5 shadow-2xl text-white shrink-0"
          >
            {/* Header with Clear Password Notification */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <h2 className="text-xs sm:text-sm font-bold text-white">
                  {language === 'km' ? 'បញ្ជីគណនីសាកល្បង (Demo Accounts)' : 'Demo Accounts & Role Permissions'}
                </h2>
              </div>

              {/* Prominent Password Pill */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-[11px] font-bold shadow-inner shrink-0">
                <Sparkles className="w-3 h-3 text-emerald-300" />
                <span>Password for all: <strong>123</strong></span>
              </div>
            </div>

            {/* 4 Demo Role Cards Grid - Displaying Full Names */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 mt-2">
              {/* 1. DEVELOPER */}
              <div className="p-2.5 rounded-xl bg-slate-800/85 hover:bg-slate-800 border border-indigo-500/40 hover:border-indigo-400 transition-all flex flex-col justify-between group shadow-md">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 flex items-center gap-1">
                      <Code2 className="w-2.5 h-2.5" />
                      Developer
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">PW: 123</span>
                  </div>
                  {/* Full Name Display */}
                  <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-indigo-200 transition-colors leading-tight">
                    {devUser.name}
                  </h3>
                  <p className="text-[11px] font-khmer text-indigo-200 font-bold truncate leading-tight mt-0.5">
                    {devUser.nameKm}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                    @{devUser.username}
                  </p>
                  <div className="mt-1.5 pt-1 border-t border-slate-700/60 text-[9px] sm:text-[10px] space-y-0.5">
                    <p className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                      <span>Full Control All Features</span>
                    </p>
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('developer')}
                    className="w-full py-1 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>1-Click Login</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* 2. ADMIN */}
              <div className="p-2.5 rounded-xl bg-slate-800/85 hover:bg-slate-800 border border-blue-500/40 hover:border-blue-400 transition-all flex flex-col justify-between group shadow-md">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-300 border border-blue-400/30 flex items-center gap-1">
                      <UserCog className="w-2.5 h-2.5" />
                      Admin
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">PW: 123</span>
                  </div>
                  {/* Full Name Display */}
                  <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-blue-200 transition-colors leading-tight">
                    {adminUser.name}
                  </h3>
                  <p className="text-[11px] font-khmer text-blue-200 font-bold truncate leading-tight mt-0.5">
                    {adminUser.nameKm}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                    @{adminUser.username}
                  </p>
                  <div className="mt-1.5 pt-1 border-t border-slate-700/60 text-[9px] sm:text-[10px] space-y-0.5">
                    <p className="text-blue-300 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                      <span>Full Control (Except Quotation)</span>
                    </p>
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('admin')}
                    className="w-full py-1 px-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>1-Click Login</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* 3. FARMERS */}
              <div className="p-2.5 rounded-xl bg-slate-800/85 hover:bg-slate-800 border border-emerald-500/40 hover:border-emerald-400 transition-all flex flex-col justify-between group shadow-md">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                      <Sprout className="w-2.5 h-2.5" />
                      Farmers
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">PW: 123</span>
                  </div>
                  {/* Full Name Display */}
                  <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-emerald-200 transition-colors leading-tight">
                    {farmerUser.name}
                  </h3>
                  <p className="text-[11px] font-khmer text-emerald-200 font-bold truncate leading-tight mt-0.5">
                    {farmerUser.nameKm}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                    @{farmerUser.username}
                  </p>
                  <div className="mt-1.5 pt-1 border-t border-slate-700/60 text-[9px] sm:text-[10px] space-y-0.5">
                    <p className="text-emerald-300 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                      <span>View, Add, Edit</span>
                    </p>
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('farmer')}
                    className="w-full py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>1-Click Login</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* 4. TEAM */}
              <div className="p-2.5 rounded-xl bg-slate-800/85 hover:bg-slate-800 border border-amber-500/40 hover:border-amber-400 transition-all flex flex-col justify-between group shadow-md">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/30 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                      <Users2 className="w-2.5 h-2.5" />
                      Team
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">PW: 123</span>
                  </div>
                  {/* Full Name Display */}
                  <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-amber-200 transition-colors leading-tight">
                    {teamUser.name}
                  </h3>
                  <p className="text-[11px] font-khmer text-amber-200 font-bold truncate leading-tight mt-0.5">
                    {teamUser.nameKm}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                    @{teamUser.username}
                  </p>
                  <div className="mt-1.5 pt-1 border-t border-slate-700/60 text-[9px] sm:text-[10px] space-y-0.5">
                    <p className="text-amber-300 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                      <span>View, Add, Edit</span>
                    </p>
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('team')}
                    className="w-full py-1 px-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>1-Click Login</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer - Compact */}
      <footer className="relative z-10 w-full py-2 text-center text-[10px] sm:text-[11px] text-slate-400 shrink-0">
        <p className="font-khmer">
          {footTag || `© ${new Date().getFullYear()} ${projectName} Farm OS. Enterprise Greenhouse & Crop Management Platform.`}
        </p>
      </footer>
    </div>
  );
};
