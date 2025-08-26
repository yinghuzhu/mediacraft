import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import Button from '../UI/Button';
import Alert from '../UI/Alert';
import { videoMergerService } from '../../services/api';

export default function UploadSection({ taskUuid, onVideoUploaded }) {
  const { t } = useTranslation('common');
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
  const maxFileSize = 500 * 1024 * 1024; // 500MB
  const maxFiles = 10;
  
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    validateAndSetFiles(selectedFiles);
  };
  
  const validateAndSetFiles = (selectedFiles) => {
    setError(null);
    
    if (!selectedFiles.length) return;
    
    const validFiles = [];
    const errors = [];
    
    selectedFiles.forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: ${t('videoMerger.errors.unsupportedFormat')}`);
        return;
      }
      
      if (file.size > maxFileSize) {
        errors.push(`${file.name}: ${t('videoMerger.errors.fileTooLarge')}`);
        return;
      }
      
      validFiles.push(file);
    });
    
    if (validFiles.length + files.length > maxFiles) {
      errors.push(t('videoMerger.errors.maxVideosReached'));
      validFiles.splice(maxFiles - files.length);
    }
    
    if (errors.length) {
      setError(errors.join('\n'));
    }
    
    if (validFiles.length) {
      setFiles([...files, ...validFiles]);
    }
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
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndSetFiles(droppedFiles);
  };
  
  const handleRemoveFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };
  
  const handleUpload = async () => {
    if (!files.length) return;
    
    setIsUploading(true);
    setError(null);
    setCurrentFileIndex(0);
    
    try {
      for (let i = 0; i < files.length; i++) {
        setCurrentFileIndex(i);
        setUploadProgress(0);
        
        const response = await videoMergerService.uploadVideo(
          taskUuid, 
          files[i],
          (progress) => {
            setUploadProgress(progress);
          }
        );
        
        console.log('Upload response:', response);
        
        // 检查响应格式：后端返回 {success: true, data: {...}}
        if (response.data && response.data.success) {
          // Successfully uploaded
          if (i === files.length - 1) {
            // 所有文件上传完成，进入下一步
            onVideoUploaded();
          }
        } else {
          console.error('Upload failed:', response);
          setError(`${files[i].name}: ${response.data?.message || t('videoMerger.errors.uploadFailed')}`);
          break;
        }
      }
    } catch (err) {
      setError(err.message || t('videoMerger.errors.uploadFailed'));
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold">{t('videoMerger.upload.title')}</h2>
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
          } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && document.getElementById('file-input').click()}
        >
          <input 
            type="file" 
            id="file-input" 
            className="hidden" 
            accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska" 
            onChange={handleFileChange} 
            multiple
            disabled={isUploading}
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
            {t('videoMerger.upload.dragDrop')}
          </p>
          <p className="text-xs text-gray-500">
            {t('videoMerger.upload.supportedFormats')}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {t('videoMerger.upload.maxVideos')}
          </p>
        </div>
        
        {files.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Selected Videos ({files.length}/{maxFiles})</h3>
            
            <div className="space-y-2 mb-4">
              {files.map((file, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between bg-gray-50 p-2 rounded"
                >
                  <div className="flex items-center">
                    <span className="mr-2 text-gray-500">{index + 1}.</span>
                    <span className="truncate max-w-xs">{file.name}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                  
                  {isUploading && currentFileIndex === index ? (
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleRemoveFile(index)}
                      disabled={isUploading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-end">
              <Button
                variant="outline"
                className="mr-2"
                onClick={() => setFiles([])}
                disabled={isUploading}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleUpload}
                loading={isUploading}
                disabled={isUploading || files.length === 0}
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