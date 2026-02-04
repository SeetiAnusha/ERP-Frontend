import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Globe size={20} className="text-gray-600" />
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            language === 'en'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🇺🇸 EN
        </button>
        <button
          onClick={() => setLanguage('es')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            language === 'es'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🇪🇸 ES
        </button>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
