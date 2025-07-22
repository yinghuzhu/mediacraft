import { useRouter } from 'next/router';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';

export default function Header() {
  const router = useRouter();
  const { t } = useTranslation('common');
  
  const changeLanguage = (locale) => {
    router.push(router.pathname, router.asPath, { locale });
  };
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="40" 
                height="40" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#0d6efd" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M12 2v20"/>
                <path d="M17 5H9l-2 5 2 5 4 2 4-2 2-5-2-5z"/>
              </svg>
              <span className="ml-2 text-xl font-semibold">MediaCraft</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-4">
            <Link 
              href="/" 
              className={`px-3 py-2 rounded-md ${
                router.pathname === '/' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t('nav.home')}
            </Link>
            <Link 
              href="/watermark-remover" 
              className={`px-3 py-2 rounded-md ${
                router.pathname === '/watermark-remover' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t('nav.watermarkRemover')}
            </Link>
            <Link 
              href="/video-merger" 
              className={`px-3 py-2 rounded-md ${
                router.pathname === '/video-merger' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t('nav.videoMerger')}
            </Link>
          </nav>
          
          <div className="flex items-center">
            <button 
              onClick={() => changeLanguage('en')} 
              className={`px-2 py-1 rounded-md ${
                router.locale === 'en' ? 'bg-gray-200' : 'hover:bg-gray-100'
              }`}
            >
              EN
            </button>
            <button 
              onClick={() => changeLanguage('zh')} 
              className={`ml-2 px-2 py-1 rounded-md ${
                router.locale === 'zh' ? 'bg-gray-200' : 'hover:bg-gray-100'
              }`}
            >
              中文
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}