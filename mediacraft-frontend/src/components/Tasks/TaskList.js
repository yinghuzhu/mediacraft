import { useTranslation } from 'next-i18next';
import TaskItem from './TaskItem';

export default function TaskList({ tasks, onRefresh }) {
  const { t } = useTranslation('common');

  if (tasks.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('tasks.noTasks')}</h3>
        <p className="text-gray-600 mb-6">{t('tasks.noTasksDescription')}</p>
        <div className="space-x-4">
          <a
            href="/watermark-remover"
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            {t('tasks.removeWatermark')}
          </a>
          <a
            href="/video-merger"
            className="inline-flex items-center px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary-dark transition-colors"
          >
            {t('tasks.mergeVideos')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">{t('tasks.taskList')}</h2>
          <button
            onClick={onRefresh}
            className="text-sm text-primary hover:text-primary-dark transition-colors"
          >
            {t('tasks.refresh')}
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Preview
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('tasks.taskInfo')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('tasks.type')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('tasks.status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('tasks.progress')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('tasks.createdAt')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('tasks.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tasks.map((task) => (
              <TaskItem 
                key={task.task_id || task.task_uuid} 
                task={task} 
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}