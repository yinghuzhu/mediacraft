import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '../components/Layout/Layout';
import UploadSection from '../components/WatermarkRemover/UploadSection';
import FrameSelector from '../components/WatermarkRemover/FrameSelector';
import RegionSelector from '../components/WatermarkRemover/RegionSelector';
import ProcessingStatus from '../components/WatermarkRemover/ProcessingStatus';

export default function WatermarkRemover() {
  const { t } = useTranslation('common');
  const [currentStep, setCurrentStep] = useState('upload');
  const [taskData, setTaskData] = useState(null);
  const [frameData, setFrameData] = useState(null);
  
  const handleUploadSuccess = (data) => {
    setTaskData(data);
    setCurrentStep('frame-select');
  };
  
  const handleFrameSelected = (data) => {
    setFrameData(data);
    setCurrentStep('region-select');
  };
  
  const handleRegionsSelected = () => {
    setCurrentStep('processing');
  };
  
  const renderStepIndicator = () => {
    const steps = [
      { id: 'upload', label: t('watermarkRemover.steps.upload') },
      { id: 'frame-select', label: t('watermarkRemover.steps.frameSelect') },
      { id: 'region-select', label: t('watermarkRemover.steps.regionSelect') },
      { id: 'processing', label: t('watermarkRemover.steps.processing') },
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
                    : steps.indexOf({ id: currentStep }) > index 
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
                className={`flex-grow h-0.5 mx-2 ${
                  steps.indexOf(steps.find(s => s.id === currentStep)) > index 
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
      title={t('watermarkRemover.title')}
      description={t('watermarkRemover.description')}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">
            {t('watermarkRemover.title')}
          </h1>
          
          <p className="text-gray-600 mb-8 text-center">
            {t('watermarkRemover.description')}
          </p>
          
          {renderStepIndicator()}
          
          {currentStep === 'upload' && (
            <UploadSection onUploadSuccess={handleUploadSuccess} />
          )}
          
          {currentStep === 'frame-select' && taskData && (
            <FrameSelector 
              taskUuid={taskData.task_uuid} 
              onFrameSelected={handleFrameSelected} 
            />
          )}
          
          {currentStep === 'region-select' && taskData && frameData && (
            <RegionSelector 
              taskUuid={taskData.task_uuid}
              frameData={frameData}
              onRegionsSelected={handleRegionsSelected}
            />
          )}
          
          {currentStep === 'processing' && taskData && (
            <ProcessingStatus taskUuid={taskData.task_uuid} />
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