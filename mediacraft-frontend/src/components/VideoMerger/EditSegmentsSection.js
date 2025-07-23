import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'next-i18next';
import Button from '../UI/Button';
import Alert from '../UI/Alert';
import { mergeService } from '../../services/api';
import Sortable from 'sortablejs';

export default function EditSegmentsSection({ taskUuid, onStartMerge }) {
  const { t } = useTranslation('common');
  const [taskData, setTaskData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  
  const sortableContainerRef = useRef(null);
  const sortableInstance = useRef(null);
  
  useEffect(() => {
    fetchTaskData();
  }, [taskUuid]);
  
  useEffect(() => {
    if (taskData && taskData.items && taskData.items.length > 0) {
      initSortable();
    }
    
    return () => {
      if (sortableInstance.current) {
        sortableInstance.current.destroy();
      }
    };
  }, [taskData]);
  
  const fetchTaskData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await mergeService.getTask(taskUuid);
      
      if (response.data && response.data.code === 10000) {
        setTaskData(response.data.data);
      } else {
        setError(response.data?.message || t('common.error'));
      }
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const initSortable = () => {
    try {
      if (sortableContainerRef.current) {
        if (sortableInstance.current) {
          sortableInstance.current.destroy();
        }
        
        sortableInstance.current = new Sortable(sortableContainerRef.current, {
          animation: 150,
          handle: '.drag-handle',
          ghostClass: 'bg-gray-100',
          onEnd: handleSortEnd
        });
      }
    } catch (err) {
      console.error('Failed to initialize sortable:', err);
    }
  };
  
  const handleSortEnd = async (evt) => {
    if (!taskData || !taskData.items) return;
    
    const newOrder = Array.from(sortableContainerRef.current.children)
      .map(el => el.dataset.itemId);
    
    try {
      const response = await mergeService.reorderItems(taskUuid, newOrder);
      
      if (response.data && response.data.code === 10000) {
        // Update local state with new order
        setTaskData(prev => ({
          ...prev,
          items: response.data.data.items
        }));
      } else {
        setError(response.data?.message || t('common.error'));
        // Refresh to get correct order
        fetchTaskData();
      }
    } catch (err) {
      setError(err.message || t('common.error'));
      // Refresh to get correct order
      fetchTaskData();
    }
  };
  
  const handleTimeUpdate = async (itemId, startTime, endTime) => {
    setError(null);
    
    // Validate time values
    if (startTime >= endTime) {
      setError(t('videoMerger.errors.invalidTimeSegment'));
      return;
    }
    
    try {
      const response = await mergeService.updateItem(taskUuid, itemId, {
        start_time: startTime,
        end_time: endTime
      });
      
      if (response.data && response.data.code === 10000) {
        // Update local state
        setTaskData(prev => ({
          ...prev,
          items: prev.items.map(item => 
            item.item_id === itemId ? response.data.data : item
          )
        }));
      } else {
        setError(response.data?.message || t('common.error'));
      }
    } catch (err) {
      setError(err.message || t('common.error'));
    }
  };
  
  const handleDeleteItem = async (itemId) => {
    try {
      const response = await mergeService.deleteItem(taskUuid, itemId);
      
      if (response.data && response.data.code === 10000) {
        // Update local state
        setTaskData(prev => ({
          ...prev,
          items: prev.items.filter(item => item.item_id !== itemId)
        }));
      } else {
        setError(response.data?.message || t('common.error'));
      }
    } catch (err) {
      setError(err.message || t('common.error'));
    }
  };
  
  const handleStartMerge = async () => {
    setIsStarting(true);
    setError(null);
    
    try {
      const response = await mergeService.startMerge(taskUuid);
      
      if (response.data && response.data.code === 10000) {
        onStartMerge();
      } else {
        setError(response.data?.message || t('videoMerger.errors.startMergeFailed'));
      }
    } catch (err) {
      setError(err.message || t('videoMerger.errors.startMergeFailed'));
    } finally {
      setIsStarting(false);
    }
  };
  
  const calculateTotalDuration = () => {
    if (!taskData || !taskData.items) return 0;
    
    return taskData.items.reduce((total, item) => {
      const duration = item.segment_duration || 0;
      return total + duration;
    }, 0);
  };
  
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(1);
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    
    return `${remainingSeconds}s`;
  };
  
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">{t('videoMerger.editSegments.title')}</h2>
        </div>
        <div className="card-body text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }
  
  if (!taskData || !taskData.items || taskData.items.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">{t('videoMerger.editSegments.title')}</h2>
        </div>
        <div className="card-body text-center py-12">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 mx-auto text-gray-400 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
            />
          </svg>
          <p className="text-gray-600 mb-4">No videos have been uploaded yet.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold">{t('videoMerger.editSegments.title')}</h2>
      </div>
      <div className="card-body">
        {error && (
          <Alert 
            type="danger" 
            message={error} 
            onClose={() => setError(null)} 
          />
        )}
        
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex flex-wrap justify-between items-center">
            <div>
              <p className="font-medium">
                {t('videoMerger.editSegments.totalVideos')}: {taskData.items.length}
              </p>
              <p className="font-medium">
                {t('videoMerger.editSegments.totalDuration')}: {formatDuration(calculateTotalDuration())}
              </p>
            </div>
            <Button
              onClick={handleStartMerge}
              loading={isStarting}
              disabled={isStarting || taskData.items.length === 0}
              size="lg"
            >
              {t('videoMerger.editSegments.startMerging')}
            </Button>
          </div>
        </div>
        
        <div ref={sortableContainerRef} className="space-y-4">
          {taskData.items.map((item, index) => (
            <div 
              key={item.item_id} 
              data-item-id={item.item_id}
              className="border rounded-lg overflow-hidden bg-white"
            >
              <div className="p-4">
                <div className="flex items-center mb-3">
                  <div className="drag-handle cursor-move p-1 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium flex-grow truncate">
                    {index + 1}. {item.original_filename}
                  </h3>
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700 p-1"
                    onClick={() => handleDeleteItem(item.item_id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      {t('videoMerger.editSegments.duration')}: {formatDuration(item.video_duration || 0)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t('videoMerger.editSegments.resolution')}: {item.video_resolution || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      {t('videoMerger.editSegments.segment')}: {formatDuration(item.segment_duration || 0)}
                    </p>
                    <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                      {item.start_time || 0}s - {item.end_time || item.video_duration || 0}s
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 items-end">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('videoMerger.editSegments.startTime')}
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        defaultValue={(item.start_time || 0).toFixed(1)}
                        min="0"
                        max={(item.video_duration || 0) - 0.1}
                        step="0.1"
                        id={`start-time-${item.item_id}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('videoMerger.editSegments.endTime')}
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        defaultValue={(item.end_time || item.video_duration || 0).toFixed(1)}
                        min="0.1"
                        max={item.video_duration || 0}
                        step="0.1"
                        id={`end-time-${item.item_id}`}
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-grow"
                      onClick={() => {
                        const startInput = document.getElementById(`start-time-${item.item_id}`);
                        const endInput = document.getElementById(`end-time-${item.item_id}`);
                        
                        if (startInput && endInput) {
                          handleTimeUpdate(
                            item.item_id,
                            parseFloat(startInput.value),
                            parseFloat(endInput.value)
                          );
                        }
                      }}
                    >
                      {t('videoMerger.editSegments.update')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-grow"
                      onClick={() => {
                        handleTimeUpdate(item.item_id, 0, item.video_duration || 0);
                        
                        // Update input values
                        const startInput = document.getElementById(`start-time-${item.item_id}`);
                        const endInput = document.getElementById(`end-time-${item.item_id}`);
                        
                        if (startInput && endInput) {
                          startInput.value = "0.0";
                          endInput.value = (item.video_duration || 0).toFixed(1);
                        }
                      }}
                    >
                      {t('videoMerger.editSegments.reset')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}