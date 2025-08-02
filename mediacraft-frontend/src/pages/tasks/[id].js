import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '../../components/Layout/Layout';
import TaskStatus from '../../components/Tasks/TaskStatus';
import ProgressBar from '../../components/Tasks/ProgressBar';

export default function TaskDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation('common');
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchTaskDetail();
      // 如果任务正在处理，设置定时刷新
      const interval = setInterval(() => {
        if (task && (task.status === 'processing' || task.status === 'queued')) {
          fetchTaskDetail();
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [id, task?.status]);

  const fetchTaskDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tasks/${id}/status`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setTask(data.data);
        } else {
          setError(data.message || '获取任务详情失败');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || '网络请求失败');
      }
    } catch (err) {
      setError('获取任务详情时发生错误');
      console.error('Error fetching task detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTaskTypeText = (taskType) => {
    return t(`tasks.types.${taskType}`) || taskType || t('common.unknown');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Layout title={t('tasks.taskDetail')}>
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
      <Layout title={t('tasks.taskDetail')}>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">{t('tasks.loadFailed')}</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-x-4">
              <button
                onClick={fetchTaskDetail}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                {t('tasks.retry')}
              </button>
              <button
                onClick={() => router.push('/tasks')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                {t('tasks.backToList')}
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!task) {
    return (
      <Layout title={t('tasks.taskDetail')}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('tasks.taskNotFound')}</h3>
            <button
              onClick={() => router.push('/tasks')}
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
            >
              {t('tasks.backToList')}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`任务详情 - ${task.original_filename || '未知文件'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* 面包屑导航 */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <button
                onClick={() => router.push('/tasks')}
                className="hover:text-primary transition-colors"
              >
                {t('tasks.title')}
              </button>
            </li>
            <li>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li className="text-gray-900">
              {task.original_filename || t('tasks.taskDetail')}
            </li>
          </ol>
        </nav>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {/* 任务头部信息 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {task.original_filename || t('common.unknown')}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {t('tasks.taskId')}: {task.task_id || task.task_uuid}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <TaskStatus status={task.status} />
                {task.status === 'completed' && task.processed_file_path && (
                  <a
                    href={`/api/tasks/${task.task_id || task.task_uuid}/download`}
                    className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('tasks.download')}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* 进度条 */}
          {(task.status === 'processing' || task.status === 'queued') && (
            <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">{t('tasks.processingProgress')}</span>
                <span className="text-sm text-blue-700">{task.progress_percentage || 0}%</span>
              </div>
              <ProgressBar percentage={task.progress_percentage || 0} size="lg" />
              {task.progress_message && (
                <p className="text-sm text-blue-700 mt-2">{task.progress_message}</p>
              )}
            </div>
          )}

          {/* 任务详细信息 */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('tasks.basicInfo')}</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('tasks.type')}</dt>
                    <dd className="text-sm text-gray-900">{getTaskTypeText(task.task_type)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('tasks.fileSize')}</dt>
                    <dd className="text-sm text-gray-900">{formatFileSize(task.file_size)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('tasks.createdAt')}</dt>
                    <dd className="text-sm text-gray-900">{formatDate(task.created_at)}</dd>
                  </div>
                  {task.started_at && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t('tasks.startedAt')}</dt>
                      <dd className="text-sm text-gray-900">{formatDate(task.started_at)}</dd>
                    </div>
                  )}
                  {task.completed_at && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t('tasks.completedAt')}</dt>
                      <dd className="text-sm text-gray-900">{formatDate(task.completed_at)}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('tasks.processingStatus')}</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('tasks.currentStatus')}</dt>
                    <dd className="text-sm text-gray-900">
                      <TaskStatus status={task.status} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{t('tasks.progress')}</dt>
                    <dd className="text-sm text-gray-900">
                      <ProgressBar percentage={task.progress_percentage || 0} />
                    </dd>
                  </div>
                  {task.error_message && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{t('tasks.errorInfo')}</dt>
                      <dd className="text-sm text-red-600">{task.error_message}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* 配置信息 */}
            {task.config && Object.keys(task.config).length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('tasks.configInfo')}</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(task.config, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <button
                onClick={() => router.push('/tasks')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← {t('tasks.backToList')}
              </button>
              <div className="space-x-4">
                <button
                  onClick={fetchTaskDetail}
                  className="text-primary hover:text-primary-dark transition-colors"
                >
                  {t('tasks.refreshStatus')}
                </button>
                {task.status === 'completed' && task.processed_file_path && (
                  <a
                    href={`/api/tasks/${task.task_id || task.task_uuid}/download`}
                    className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('tasks.download')}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}