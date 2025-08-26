import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import Button from '../UI/Button';
import Alert from '../UI/Alert';
import { watermarkService } from '../../services/api';

export default function UploadSection({ onUploadSuccess }) {
  const { t } = useTranslation('common');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
  const maxFileSize = 500 * 1024 * 1024; // 500MB
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };
  
  const validateAndSetFile = (selectedFile) => {
    setError(null);
    
    if (!selectedFile) return;
    
    if (!allowedTypes.includes(selectedFile.type)) {
      setError(t('watermarkRemover.errors.unsupportedFormat'));
      return;
    }
    
    if (selectedFile.size > maxFileSize) {
      setError(t('watermarkRemover.errors.fileTooLarge'));
      return;
    }
    
    setFile(selectedFile);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };
  
  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      const response = await watermarkService.uploadVideo(file, (progress) => {
        setUploadProgress(progress);
      });
      
      if (response.data && response.data.task_id) {
        // 后端返回格式: { task_id, status, message }
        onUploadSuccess({
          task_uuid: response.data.task_id,
          task_id: response.data.task_id,
          status: response.data.status,
          message: response.data.message
        });
      } else {
        setError(response.data?.message || response.data?.error || t('watermarkRemover.errors.uploadFailed'));
      }
    } catch (err) {
      setError(err.message || t('watermarkRemover.errors.uploadFailed'));
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold">{t('watermarkRemover.upload.title')}</h2>
      </div>
      <div className="card-body">
        {error && (
          <Alert 
            type="danger" 
            message={error} 
            onClose={() => setError(null)} 
          />
        )}
        
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragActive ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-primary hover:bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input').click()}
        >
          <input 
            type="file" 
            id="file-input" 
            className="hidden" 
            accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska" 
            onChange={handleFileChange} 
          />
          
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-12 w-12 mx-auto text-gray-400 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
            />
          </svg>
          
          <p className="mb-2 text-sm text-gray-500">
            {file 
              ? file.name 
              : t('watermarkRemover.upload.dragDrop')}
          </p>
          <p className="text-xs text-gray-500">
            {t('watermarkRemover.upload.supportedFormats')}
          </p>
        </div>
        
        {file && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{file.name}</span>
              <span className="text-sm text-gray-500">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
            
            {isUploading && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
            
            <div className="flex justify-end mt-4">
              <Button 
                variant="outline" 
                className="mr-2"
                onClick={() => setFile(null)}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleUpload}
                loading={isUploading}
                disabled={isUploading}
              >
                {t('common.upload')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}