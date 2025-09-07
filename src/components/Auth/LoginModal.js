import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../UI/Button';
import Alert from '../UI/Alert';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const { t } = useTranslation('common');
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let result;
      if (isLogin) {
        result = await login(formData.username, formData.password);
      } else {
        result = await register(formData.username, formData.password, formData.email);
      }

      if (result.success) {
        onLoginSuccess && onLoginSuccess();
        onClose();
        setFormData({ username: '', password: '', email: '' });
      } else {
        setError(result.message || t('auth.operationFailed'));
      }
    } catch (err) {
      setError(err.message || t('auth.operationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setFormData({ username: '', password: '', email: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {isLogin ? t('auth.login') : t('auth.register')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <Alert 
            type="danger" 
            message={error} 
            onClose={() => setError(null)} 
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.username')}
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              minLength={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={t('auth.usernamePlaceholder')}
            />
          </div>

          {!isLogin && (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.emailOptional')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={t('auth.emailPlaceholder')}
              />
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.password')}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder={t('auth.passwordPlaceholder')}
            />
          </div>

          <div className="flex space-x-3">
            <Button
              type="submit"
              loading={isLoading}
              disabled={isLoading}
              className="flex-1"
            >
              {isLogin ? t('auth.loginButton') : t('auth.registerButton')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={toggleMode}
              disabled={isLoading}
              className="flex-1"
            >
              {isLogin ? t('auth.createAccount') : t('auth.haveAccount')}
            </Button>
          </div>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>
            {isLogin ? t('auth.noAccount') : t('auth.haveAccountQuestion')}
            <button
              type="button"
              onClick={toggleMode}
              className="text-primary hover:underline ml-1"
            >
              {isLogin ? t('auth.registerNow') : t('auth.loginNow')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}