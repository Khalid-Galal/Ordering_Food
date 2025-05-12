// /src/components/LanguageSwitcher.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center space-x-2 rtl:space-x-reverse">
      <span className="text-sm font-medium">{t('language')}:</span>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 text-sm rounded ${i18n.language === 'en' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
        disabled={i18n.language === 'en'}
      >
        {t('english')}
      </button>
      <button
        onClick={() => changeLanguage('ar')}
        className={`px-2 py-1 text-sm rounded ${i18n.language === 'ar' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
        disabled={i18n.language === 'ar'}
      >
        {t('arabic')}
      </button>
    </div>
  );
};

export default LanguageSwitcher;

