import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 检查用户登录状态
  const checkAuthStatus = async () => {
    try {
      const response = await authService.getProfile();
      if (response.data.success && response.data.data.user) {
        setUser(response.data.data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.log('Auth check failed:', error.message);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 登录
  const login = async (username, password) => {
    try {
      const response = await authService.login(username, password);
      if (response.data.success && response.data.data.user) {
        const userData = response.data.data.user;

        // 立即更新状态
        setUser(userData);
        setIsAuthenticated(true);

        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || '登录失败'
      };
    }
  };

  // 注册
  const register = async (username, password, email = '') => {
    try {
      const response = await authService.register(username, password, email);
      if (response.data.success) {
        // 注册成功后自动登录
        return await login(username, password);
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || '注册失败'
      };
    }
  };

  // 登出
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // 组件挂载时检查登录状态
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}