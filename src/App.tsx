import { Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect,Suspense } from 'react';
import CreateSessionPage from './pages/CreateSessionPage';
import JoinSessionPage from './pages/JoinSessionPage';
import SessionPage from './pages/SessionPage';
import LanguageSwitcher from './components/LanguageSwitcher';

function App() {
  const { i18n, t } = useTranslation();

  useEffect(() => {
    // Set document direction based on language
    document.body.dir = i18n.dir();
  }, [i18n, i18n.language]);

  return (
    <Suspense fallback="loading...">
      <div className="container mx-auto p-4 font-sans">
        <header className="flex justify-between items-center mb-4 border-b pb-2">
          <h1 className="text-2xl font-bold">
            <Link to="/">{t('appName')}</Link>
          </h1>
          <LanguageSwitcher />
        </header>

        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create" element={<CreateSessionPage />} />
            <Route path="/join" element={<JoinSessionPage />} />
            <Route path="/session/:sessionId" element={<SessionPage />} />
            {/* Add other routes as needed */}
          </Routes>
        </main>

        <footer className="mt-8 text-center text-gray-500 text-sm">
        Designed by Khaled Galal
        </footer>
      </div>
    </Suspense>
  );
}

// Simple HomePage component for initial navigation
function HomePage() {
  const { t } = useTranslation();
  return (
    <div className="text-center">
      <h2 className="text-xl mb-4">{t('appName')} - {t('createSessionTitle')} / {t('joinSessionTitle')}</h2>
      <div className="space-x-4">
        <Link to="/create" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          {t('createSessionButton')}
        </Link>
        <Link to="/join" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          {t('joinButton')}
        </Link>
      </div>
    </div>
  );
}

export default App;

