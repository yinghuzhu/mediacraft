import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useAuth } from '../../contexts/AuthContext';
import LoginModal from './LoginModal';

/**
 * 高阶组件：用于保护需要登录的页面
 */
export default function withAuth(WrappedComponent) {
  return function AuthenticatedComponent(props) {
    const { t } = useTranslation('common');
    const { isAuthenticated, isLoading, user } = useAuth();
    const [showLoginModal, setShowLoginModal] = useState(false);

    useEffect(() => {
      // 如果加载完成且用户未登录，显示登录弹窗
      if (!isLoading && !isAuthenticated) {
        setShowLoginModal(true);
      }
    }, [isLoading, isAuthenticated]);

    const handleLoginSuccess = () => {
      // 登录成功后直接关闭弹窗，留在当前页面
      setShowLoginModal(false);
    };

    const handleLoginModalClose = () => {
      // 只有在用户主动关闭弹窗且未登录时才重定向到首页
      if (!isAuthenticated) {
        window.location.href = '/';
        return;
      }
      setShowLoginModal(false);
    };

    // 显示加载状态
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">{t('auth.verifyingLogin')}</p>
          </div>
        </div>
      );
    }

    // 如果未登录，显示登录弹窗
    if (!isAuthenticated) {
      return (
        <>
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('auth.needLogin')}</h2>
              <p className="text-gray-600 mb-6">{t('auth.pleaseLoginToUse')}</p>
              <button
                onClick={() => setShowLoginModal(true)}
                className="btn btn-primary"
              >
                {t('auth.loginNow')}
              </button>
            </div>
          </div>
          
          <LoginModal
            isOpen={showLoginModal}
            onClose={handleLoginModalClose}
            onLoginSuccess={handleLoginSuccess}
          />
        </>
      );
    }

    // 已登录，渲染原组件
    return <WrappedComponent {...props} user={user} />;
  };
}