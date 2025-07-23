import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import Button from '../UI/Button';
import { mergeService } from '../../services/api';

export default function ProcessingStatus({ taskUuid }) {
  const { t } = useTranslation('common');
  const [status, setStatus] = useState({
    status: 'processing',
    progress_percentage: 0,
    error_message: null,
    task_name: ''
  });
  const [isPolling, setIsPolling] = useState(true);
  
  useEffect(() => {
    let interval;
    
    if (isPolling) {
      // Initial check
      checkStatus();
      
      // Start polling
      interval = setInterval(checkStatus, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPolling, taskUuid]);
  
  const checkStatus = async () => {
    try {
      const response = await mergeService.getTaskStatus(taskUuid);
      
      if (response.data && response.data.code === 10000) {
        const newStatus = response.data.data;
        setStatus(newStatus);
        
        // Stop polling if processing is complete or failed
        if (newStatus.status === 'completed' || newStatus.status === 'failed') {
          setIsPolling(false);
        }
      }
    } catch (err) {
      console.error('Failed to check status:', err);
    }
  };
  
  const getStatusText = () => {
    switch (status.status) {
      case 'processing':
        return t('videoMerger.processing.inProgress');
      case 'completed':
        return t('videoMerger.processing.completed');
      case 'failed':
        return t('videoMerger.processing.failed');
      default:
        return t('videoMerger.processing.unknown');
    }
  };
  
  const handleDownload = () => {
    const downloadUrl = mergeService.getDownloadUrl(taskUuid);
    window.open(downloadUrl, '_blank');
  };
  
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold">{t('videoMerger.processing.title')}</h2>
      </div>
      <div className="card-body">
        <div className="text-center py-6">
          {status.task_name && (
            <h3 className="text-xl font-medium mb-4">{status.task_name}</h3>
          )}
          
          {status.status === 'processing' ? (
            <>
              <div className="mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </div>
              <h3 className="text-lg font-medium mb-2">{getStatusText()}</h3>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 max-w-md mx-auto">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: `${status.progress_percentage}%` }}
                ></div>
              </div>
              <p className="text-gray-600">{status.progress_percentage}%</p>
            </>
          ) : status.status === 'completed' ? (
            <>
              <div className="mb-4 text-success">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-4">{getStatusText()}</h3>
              <Button onClick={handleDownload}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t('videoMerger.processing.download')}
              </Button>
            </>
          ) : (
            <>
              <div className="mb-4 text-danger">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">{getStatusText()}</h3>
              {status.error_message && (
                <p className="text-danger mb-4">{status.error_message}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}