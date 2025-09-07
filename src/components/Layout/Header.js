import { useRouter } from 'next/router';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginModal from '../Auth/LoginModal';

export default function Header() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const { user, isAuthenticated, logout } = useAuth();
  const [isMyMenuOpen, setIsMyMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const myMenuRef = useRef(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event) {
      if (myMenuRef.current && !myMenuRef.current.contains(event.target)) {
        setIsMyMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const changeLanguage = (locale) => {
    router.push(router.pathname, router.asPath, { locale });
  };

  const handleLoginSuccess = (userData) => {
    setIsLoginModalOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsMyMenuOpen(false);
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
                <path d="M12 2v20" />
                <path d="M17 5H9l-2 5 2 5 4 2 4-2 2-5-2-5z" />
              </svg>
              <span className="ml-2 text-xl font-semibold">MediaCraft</span>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-4">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md ${router.pathname === '/' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              {t('nav.home')}
            </Link>
            <Link
              href="/watermark-remover"
              className={`px-3 py-2 rounded-md ${router.pathname === '/watermark-remover' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              {t('nav.watermarkRemover')}
            </Link>
            <Link
              href="/video-merger"
              className={`px-3 py-2 rounded-md ${router.pathname === '/video-merger' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              {t('nav.videoMerger')}
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {/* 用户菜单 */}
            {isAuthenticated ? (
              <div className="relative" ref={myMenuRef}>
                <button
                  onClick={() => setIsMyMenuOpen(!isMyMenuOpen)}
                  className={`px-3 py-2 rounded-md flex items-center ${router.pathname.startsWith('/tasks') ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {user?.username || t('nav.my')}
                  <svg
                    className={`ml-1 h-4 w-4 transition-transform ${isMyMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* 下拉菜单 */}
                {isMyMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link
                      href="/tasks"
                      className={`block px-4 py-2 text-sm ${router.pathname === '/tasks'
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      onClick={() => setIsMyMenuOpen(false)}
                    >
                      {t('nav.myTasks')}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t('auth.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-3 py-2 rounded-md bg-primary text-white hover:bg-blue-600"
              >
                {t('auth.loginButton')}
              </button>
            )}

            {/* 语言切换 */}
            <div className="flex items-center">
              <button
                onClick={() => changeLanguage('en')}
                className={`px-2 py-1 rounded-md ${router.locale === 'en' ? 'bg-gray-200' : 'hover:bg-gray-100'
                  }`}
              >
                EN
              </button>
              <button
                onClick={() => changeLanguage('zh')}
                className={`ml-2 px-2 py-1 rounded-md ${router.locale === 'zh' ? 'bg-gray-200' : 'hover:bg-gray-100'
                  }`}
              >
                中文
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 登录模态框 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </header>
  );
}