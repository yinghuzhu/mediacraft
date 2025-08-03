import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import Button from '../UI/Button';
import Alert from '../UI/Alert';
import { videoMergerService } from '../../services/api';

export default function CreateTaskSection({ onTaskCreated }) {
  const { t } = useTranslation('common');
  const [mergeMode, setMergeMode] = useState('concat');
  const [audioHandling, setAudioHandling] = useState('keep_all');
  const [qualityPreset, setQualityPreset] = useState('medium');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  
  // Auto-generate task name based on current timestamp
  const generateTaskName = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-'); // HH-MM-SS
    return `Video Merge ${dateStr} ${timeStr}`;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsCreating(true);
    setError(null);
    
    try {
      const taskName = generateTaskName();
      const response = await videoMergerService.createTask(taskName);
      
      console.log('Create task response:', response);
      
      if (response.data && response.data.success && response.data.data && response.data.data.task_id) {
        onTaskCreated({
          taskId: response.data.data.task_id,
          taskName: taskName,
          mergeMode,
          audioHandling,
          qualityPreset
        });
      } else {
        console.error('Create task failed:', response);
        setError(response.data?.message || t('common.error'));
      }
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold">{t('videoMerger.createTask.title')}</h2>
      </div>
      <div className="card-body">
        {error && (
          <Alert 
            type="danger" 
            message={error} 
            onClose={() => setError(null)} 
          />
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('videoMerger.createTask.taskName')}
            </label>
            <div className="form-control bg-gray-50 text-gray-600">
              {generateTaskName()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Task name will be automatically generated</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label htmlFor="merge-mode" className="block text-sm font-medium text-gray-700 mb-1">
                {t('videoMerger.createTask.mergeMode')}
              </label>
              <select
                id="merge-mode"
                className="form-control"
                value={mergeMode}
                onChange={(e) => setMergeMode(e.target.value)}
              >
                <option value="concat">Simple Concatenation</option>
                <option value="blend" disabled>Smooth Transition (Coming Soon)</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="audio-handling" className="block text-sm font-medium text-gray-700 mb-1">
                {t('videoMerger.createTask.audioHandling')}
              </label>
              <select
                id="audio-handling"
                className="form-control"
                value={audioHandling}
                onChange={(e) => setAudioHandling(e.target.value)}
              >
                <option value="keep_all">Keep All Audio</option>
                <option value="keep_first">Keep First Video's Audio Only</option>
                <option value="remove">Remove All Audio</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="quality-preset" className="block text-sm font-medium text-gray-700 mb-1">
                {t('videoMerger.createTask.qualityPreset')}
              </label>
              <select
                id="quality-preset"
                className="form-control"
                value={qualityPreset}
                onChange={(e) => setQualityPreset(e.target.value)}
              >
                <option value="fast">Fast (Lower Quality)</option>
                <option value="medium">Medium (Balanced)</option>
                <option value="high">High (Best Quality)</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              loading={isCreating}
              disabled={isCreating}
            >
              {t('videoMerger.createTask.create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}