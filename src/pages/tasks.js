import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '../components/Layout/Layout';
import TaskList from '../components/Tasks/TaskList';
import withAuth from '../components/Auth/withAuth';
import { authService } from '../services/api';

function MyTasks() {
  const { t } = useTranslation('common');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await authService.getUserTasks();
      
      if (response.data && response.data.success) {
        setTasks(response.data.data.tasks || []);
      } else {
        setError(response.data?.message || t('tasks.loadFailed'));
      }
    } catch (err) {
      setError(t('tasks.loadFailed'));
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <Layout title={t('tasks.title')}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">{t('tasks.loading')}</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title={t('tasks.title')}>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">{t('tasks.loadFailed')}</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchTasks}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              {t('tasks.retry')}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={t('tasks.title')}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('tasks.title')}</h1>
          <p className="text-gray-600">{t('tasks.description')}</p>
        </div>

        <TaskList tasks={tasks} onRefresh={fetchTasks} />
      </div>
    </Layout>
  );
}

// 使用 withAuth HOC 包装组件
export default withAuth(MyTasks);

// Note: Using getServerSideProps instead of getStaticProps for authenticated pages
export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}