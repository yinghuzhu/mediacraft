import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import TaskStatus from './TaskStatus';
import ProgressBar from './ProgressBar';

export default function TaskItem({ task }) {
  const { t } = useTranslation('common');
  const router = useRouter();

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

  const handleRowClick = () => {
    router.push(`/tasks/${task.task_id || task.task_uuid}`);
  };

  return (
    <tr className="hover:bg-gray-50 cursor-pointer" onClick={handleRowClick}>
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
        {formatDate(task.created_at)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        {task.status === 'completed' && task.processed_file_path ? (
          <a
            href={`/api/tasks/${task.task_id || task.task_uuid}/download`}
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