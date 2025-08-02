import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '../components/Layout/Layout';
import CreateTaskSection from '../components/VideoMerger/CreateTaskSection';
import UploadSection from '../components/VideoMerger/UploadSection';
import EditSegmentsSection from '../components/VideoMerger/EditSegmentsSection';
import ProcessingStatus from '../components/VideoMerger/ProcessingStatus';

export default function VideoMerger() {
  const { t } = useTranslation('common');
  const [currentStep, setCurrentStep] = useState('create-task');
  const [taskData, setTaskData] = useState(null);
  
  const handleTaskCreated = (data) => {
    setTaskData(data);
    setCurrentStep('upload');
  };
  
  const handleVideoUploaded = (updatedTaskData) => {
    // 更新任务数据（如果有的话）
    if (updatedTaskData) {
      setTaskData(updatedTaskData);
    }
    setCurrentStep('edit-segments');
  };
  
  const handleStartMerge = () => {
    setCurrentStep('processing');
  };
  
  const renderStepIndicator = () => {
    const steps = [
      { id: 'create-task', label: t('videoMerger.steps.createTask') },
      { id: 'upload', label: t('videoMerger.steps.uploadVideos') },
      { id: 'edit-segments', label: t('videoMerger.steps.editSegments') },
      { id: 'processing', label: t('videoMerger.steps.processing') },
    ];
    
    return (
      <div className="flex justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex flex-col items-center ${index > 0 ? 'ml-8' : ''}`}>
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === step.id 
                    ? 'bg-primary text-white' 
                    : steps.findIndex(s => s.id === currentStep) > index 
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              <span className="text-sm mt-1">{step.label}</span>
            </div>
            
            {index < steps.length - 1 && (
              <div 
                className={`flex-grow h-0.5 w-8 mx-2 ${
                  steps.findIndex(s => s.id === currentStep) > index 
                    ? 'bg-green-500' 
                    : 'bg-gray-200'
                }`}
              ></div>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <Layout
      title={t('videoMerger.title')}
      description={t('videoMerger.description')}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">
            {t('videoMerger.title')}
          </h1>
          
          <p className="text-gray-600 mb-8 text-center">
            {t('videoMerger.description')}
          </p>
          
          {renderStepIndicator()}
          
          {currentStep === 'create-task' && (
            <CreateTaskSection onTaskCreated={handleTaskCreated} />
          )}
          
          {currentStep === 'upload' && taskData && (
            <UploadSection 
              taskUuid={taskData.taskId}
              onVideoUploaded={handleVideoUploaded} 
            />
          )}
          
          {currentStep === 'edit-segments' && taskData && (
            <EditSegmentsSection 
              taskUuid={taskData.taskId}
              onStartMerge={handleStartMerge}
            />
          )}
          
          {currentStep === 'processing' && taskData && (
            <ProcessingStatus taskUuid={taskData.taskId} />
          )}
        </div>
      </div>
    </Layout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}