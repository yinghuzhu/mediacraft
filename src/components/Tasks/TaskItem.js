import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import TaskStatus from './TaskStatus';
import ProgressBar from './ProgressBar';
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

export default function TaskItem({ task }) {
  const { t } = useTranslation('common');
  const router = useRouter();

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

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 1) return t('time.justNow');
      if (diffMins < 60) return t('time.minutesAgo', { minutes: diffMins });
      if (diffHours < 24) return t('time.hoursAgo', { hours: diffHours });
      if (diffDays < 7) return t('time.daysAgo', { days: diffDays });
      
      // 超过一周显示具体日期
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    const sizes = [t('fileSize.bytes'), t('fileSize.kb'), t('fileSize.mb'), t('fileSize.gb')];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleRowClick = () => {
    router.push(`/tasks/${task.task_id || task.task_uuid}`);
  };

  return (
    <tr className="hover:bg-gray-50 cursor-pointer" onClick={handleRowClick}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="w-16 h-12 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
          {task.input_file_path ? (
            <img
              src={`${API_BASE_URL}/api/tasks/${task.task_id || task.task_uuid}/thumbnail`}
              alt="Video thumbnail"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className="w-full h-full flex items-center justify-center text-gray-400" style={{ display: task.input_file_path ? 'none' : 'flex' }}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900">
            {task.original_filename || t('common.unknown')}
          </div>
          <div className="text-sm text-gray-500">
            {formatFileSize(task.file_size)}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900">
          {getTaskTypeText(task.task_type)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <TaskStatus status={task.status} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <ProgressBar percentage={task.progress_percentage || 0} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <span title={formatDate(task.created_at)}>
          {formatRelativeTime(task.created_at)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        {task.status === 'completed' && task.processed_file_path ? (
          <a
            href={`${API_BASE_URL}/api/tasks/${task.task_id || task.task_uuid}/download`}
            className="text-primary hover:text-primary-dark transition-colors"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            {t('tasks.download')}
          </a>
        ) : task.status === 'failed' ? (
          <span className="text-red-600 text-xs">
            {task.error_message || t('tasks.statuses.failed')}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
    </tr>
  );
}