import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import Button from '../UI/Button';
import Alert from '../UI/Alert';
import { mergeService } from '../../services/api';

export default function CreateTaskSection({ onTaskCreated }) {
  const { t } = useTranslation('common');
  const [taskName, setTaskName] = useState('');
  const [mergeMode, setMergeMode] = useState('concat');
  const [audioHandling, setAudioHandling] = useState('keep_all');
  const [qualityPreset, setQualityPreset] = useState('medium');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsCreating(true);
    setError(null);
    
    try {
      const response = await mergeService.createTask(
        taskName || t('videoMerger.createTask.taskNamePlaceholder'),
        {
          merge_mode: mergeMode,
          audio_handling: audioHandling,
          quality_preset: qualityPreset
        }
      );
      
      if (response.data && response.data.code === 10000) {
        onTaskCreated(response.data.data);
      } else {
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
            <label htmlFor="task-name" className="block text-sm font-medium text-gray-700 mb-1">
              {t('videoMerger.createTask.taskName')}
            </label>
            <input
              type="text"
              id="task-name"
              className="form-control"
              placeholder={t('videoMerger.createTask.taskNamePlaceholder')}
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
            />
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