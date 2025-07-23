import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import Button from '../UI/Button';
import Alert from '../UI/Alert';
import { watermarkService } from '../../services/api';

export default function FrameSelector({ taskUuid, onFrameSelected }) {
  const { t } = useTranslation('common');
  const [frames, setFrames] = useState([]);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchFrames();
  }, [taskUuid]);
  
  const fetchFrames = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await watermarkService.getVideoFrames(taskUuid);
      
      if (response.data && response.data.code === 10000) {
        setFrames(response.data.data.frames || []);
      } else {
        setError(response.data?.message || t('watermarkRemover.errors.framesLoadFailed'));
      }
    } catch (err) {
      setError(err.message || t('watermarkRemover.errors.framesLoadFailed'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFrameSelect = (index) => {
    setSelectedFrameIndex(index);
  };
  
  const handleConfirmSelection = async () => {
    if (selectedFrameIndex === null) return;
    
    const selectedFrame = frames[selectedFrameIndex];
    
    try {
      const response = await watermarkService.selectFrame(taskUuid, selectedFrame.frame_number);
      
      if (response.data && response.data.code === 10000) {
        onFrameSelected(response.data.data);
      } else {
        setError(response.data?.message || t('watermarkRemover.errors.frameSelectFailed'));
      }
    } catch (err) {
      setError(err.message || t('watermarkRemover.errors.frameSelectFailed'));
    }
  };
  
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">{t('watermarkRemover.frameSelector.title')}</h2>
        </div>
        <div className="card-body text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('watermarkRemover.frameSelector.loading')}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold">{t('watermarkRemover.frameSelector.title')}</h2>
      </div>
      <div className="card-body">
        {error && (
          <Alert 
            type="danger" 
            message={error} 
            onClose={() => setError(null)} 
          />
        )}
        
        <p className="mb-4 text-gray-600">
          {t('watermarkRemover.frameSelector.instruction')}
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {frames.map((frame, index) => (
            <div 
              key={frame.frame_number}
              className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${
                selectedFrameIndex === index 
                  ? 'border-primary ring-2 ring-primary ring-opacity-50' 
                  : 'border-transparent hover:border-gray-300'
              }`}
              onClick={() => handleFrameSelect(index)}
            >
              <img 
                src={frame.image_data} 
                alt={`Frame ${frame.frame_number}`}
                className="w-full h-auto"
              />
              {selectedFrameIndex === index && (
                <div className="absolute top-2 right-2 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-end mt-6">
          <Button
            onClick={handleConfirmSelection}
            disabled={selectedFrameIndex === null}
          >
            {t('watermarkRemover.frameSelector.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}