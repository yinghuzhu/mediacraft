import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '../../components/Layout/Layout';
import TaskStatus from '../../components/Tasks/TaskStatus';
import ProgressBar from '../../components/Tasks/ProgressBar';
import withAuth from '../../components/Auth/withAuth';
import { taskService } from '../../services/api';

// Get API base URL from environment - handle empty string correctly
const API_BASE_URL = (() => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  // If NEXT_PUBLIC_API_URL is explicitly set to empty string, use relative paths
  if (envUrl === '') {
    return ''; // Use relative paths for API calls
  }
  // If undefined or not set, default to localhost for development
  return envUrl || 'http://localhost:50001';
})();

function TaskDetail() {
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
      const response = await taskService.getTaskDetail(id);
      
      if (response.data && response.data.success && response.data.data) {
        setTask(response.data.data);
      } else {
        setError(response.data?.message || '获取任务详情失败');
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
      const date = new Date(dateString);
      // 使用更详细的本地化选项，自动根据用户浏览器时区显示
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // 24小时制，更国际化
      });
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

  const sanitizeConfig = (config) => {
    if (!config || typeof config !== 'object') return config;
    
    const sanitized = JSON.parse(JSON.stringify(config)); // Deep clone
    
    // Remove sensitive information
    const removeSensitiveData = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(item => removeSensitiveData(item));
      } else if (obj && typeof obj === 'object') {
        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
          // Remove absolute paths and sensitive keys
          if (key === 'path' || key === 'input_file_path' || key === 'output_file_path') {
            if (typeof value === 'string' && value.includes('/')) {
              // Keep only filename
              cleaned[key] = value.split('/').pop();
            } else {
              cleaned[key] = value;
            }
          } else {
            cleaned[key] = removeSensitiveData(value);
          }
        }
        return cleaned;
      }
      return obj;
    };
    
    return removeSensitiveData(sanitized);
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
              <div className="flex items-center space-x-4">
                {/* Video Thumbnail */}
                {task.input_file_path && (
                  <div className="w-24 h-18 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                    <img
                      src={`${API_BASE_URL}/api/tasks/${task.task_id || task.task_uuid}/thumbnail`}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full flex items-center justify-center text-gray-400" style={{ display: 'none' }}>
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {task.original_filename || t('common.unknown')}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('tasks.taskId')}: {task.task_id || task.task_uuid}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <TaskStatus status={task.status} />
                {task.status === 'completed' && task.processed_file_path && (
                  <a
                    href={`${API_BASE_URL}/api/tasks/${task.task_id || task.task_uuid}/download`}
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

            {/* 视频文件信息（仅对视频合并任务显示） */}
            {task.task_type === 'video_merge' && task.config && task.config.files && task.config.files.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Video Files</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {task.config.files.map((file, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start space-x-4">
                        {/* Video Thumbnail */}
                        <div className="w-20 h-15 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                          <img
                            src={`${API_BASE_URL}/api/tasks/${task.task_id || task.task_uuid}/files/${index}/thumbnail`}
                            alt={`${file.filename} thumbnail`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-full h-full flex items-center justify-center text-gray-400" style={{ display: 'none' }}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        
                        {/* File Info */}
                        <div className="flex-grow min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{file.filename}</h4>
                          <div className="mt-1 text-xs text-gray-500 space-y-1">
                            <div>Size: {formatFileSize(file.size)}</div>
                            <div>Duration: {file.duration ? `${file.duration.toFixed(1)}s` : 'Unknown'}</div>
                            <div>Resolution: {file.resolution || 'Unknown'}</div>
                            {file.start_time !== undefined && file.end_time !== undefined && (
                              <div>Segment: {file.start_time.toFixed(1)}s - {file.end_time.toFixed(1)}s</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 配置信息 */}
            {task.config && Object.keys(task.config).length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('tasks.configInfo')}</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(sanitizeConfig(task.config), null, 2)}
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
                    href={`${API_BASE_URL}/api/tasks/${task.task_id || task.task_uuid}/download`}
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

// 使用 withAuth HOC 包装组件
export default withAuth(TaskDetail);

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}