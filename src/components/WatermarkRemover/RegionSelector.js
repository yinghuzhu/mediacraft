import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Button from '../UI/Button';
import Alert from '../UI/Alert';
import { watermarkService } from '../../services/api';

export default function RegionSelector({ taskUuid, frameData, onRegionsSelected }) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [regions, setRegions] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRegion, setCurrentRegion] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  const [scale, setScale] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    console.log('RegionSelector received frameData:', frameData);
    if (frameData && frameData.frame_data) {
      console.log('Using real frame data');
      // 使用真实的帧图像数据
      const img = new Image();
      img.src = frameData.frame_data;
      img.onload = () => {
        console.log('Frame image loaded successfully');
        imageRef.current = img;
        setImageLoaded(true);
        initCanvas();
      };
      img.onerror = () => {
        console.error('Failed to load frame image');
        setError(t('watermarkRemover.errors.frameLoadFailed'));
      };
    } else if (frameData) {
      console.log('No frame_data available, creating placeholder');
      // 如果没有frame_data，创建占位符
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');

      // 绘制占位符
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#666';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Video Frame Preview', 400, 300);
      ctx.fillText(`Frame ${frameData.frame_number || 0}`, 400, 340);

      const img = new Image();
      img.src = canvas.toDataURL();
      img.onload = () => {
        imageRef.current = img;
        setImageLoaded(true);
        initCanvas();
      };
    }
  }, [frameData]);

  useEffect(() => {
    if (imageLoaded) {
      drawCanvas();
    }
  }, [regions, imageLoaded]);

  const initCanvas = () => {
    if (!canvasRef.current || !containerRef.current || !imageRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    const imgWidth = imageRef.current.width;
    const imgHeight = imageRef.current.height;

    // Calculate scale to fit image in container
    const newScale = containerWidth / imgWidth;
    setScale(newScale);

    // Set canvas dimensions
    canvasRef.current.width = imgWidth * newScale;
    canvasRef.current.height = imgHeight * newScale;

    drawCanvas();
  };

  const drawCanvas = () => {
    if (!canvasRef.current || !imageRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw image
    ctx.drawImage(
      imageRef.current,
      0,
      0,
      imageRef.current.width,
      imageRef.current.height,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    // Draw existing regions
    regions.forEach((region, index) => {
      ctx.strokeStyle = '#0d6efd';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        region.x * scale,
        region.y * scale,
        region.width * scale,
        region.height * scale
      );

      // Draw region number
      ctx.fillStyle = '#0d6efd';
      ctx.font = '14px Arial';
      ctx.fillText(
        (index + 1).toString(),
        (region.x + 5) * scale,
        (region.y + 15) * scale
      );
    });

    // Draw current region if drawing
    if (isDrawing && currentRegion) {
      ctx.strokeStyle = '#dc3545';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        currentRegion.x * scale,
        currentRegion.y * scale,
        currentRegion.width * scale,
        currentRegion.height * scale
      );
    }
  };

  const getCanvasCoordinates = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    };
  };

  const handleMouseDown = (e) => {
    if (!imageLoaded) return;

    const { x, y } = getCanvasCoordinates(e);
    setIsDrawing(true);
    setCurrentRegion({
      x: Math.round(x),
      y: Math.round(y),
      width: 0,
      height: 0
    });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !currentRegion || !imageLoaded) return;

    const { x, y } = getCanvasCoordinates(e);

    setCurrentRegion(prev => ({
      ...prev,
      width: Math.round(x - prev.x),
      height: Math.round(y - prev.y)
    }));

    drawCanvas();
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentRegion || !imageLoaded) return;

    // Only add region if it has positive width and height
    if (currentRegion.width > 0 && currentRegion.height > 0) {
      setRegions([...regions, { ...currentRegion }]);
    }

    setIsDrawing(false);
    setCurrentRegion(null);
  };

  const handleRemoveRegion = (index) => {
    const newRegions = [...regions];
    newRegions.splice(index, 1);
    setRegions(newRegions);
  };

  const handleSubmitRegions = async () => {
    if (regions.length === 0) {
      setError(t('watermarkRemover.regionSelector.noRegions'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await watermarkService.selectRegions(taskUuid, regions);

      if (response.data && response.data.success) {
        // 显示成功提示
        setSuccess(true);
        setError(null);

        // 1秒后跳转到任务列表
        setTimeout(() => {
          router.push('/tasks');
        }, 1500);

        // 仍然调用回调以保持兼容性
        if (onRegionsSelected) {
          onRegionsSelected({
            task_id: response.data.task_id,
            regions: response.data.regions,
            message: response.data.message
          });
        }
      } else {
        setError(response.data?.message || response.data?.error || t('watermarkRemover.errors.regionsSubmitFailed'));
      }
    } catch (err) {
      setError(err.message || t('watermarkRemover.errors.regionsSubmitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold">{t('watermarkRemover.regionSelector.title')}</h2>
      </div>
      <div className="card-body">
        {error && (
          <Alert
            type="danger"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {success && (
          <Alert
            type="success"
            message={t('watermarkRemover.processing.taskSubmitted') || "任务已提交成功！正在跳转到任务列表..."}
            onClose={() => setSuccess(false)}
          />
        )}

        <p className="mb-4 text-gray-600">
          {t('watermarkRemover.regionSelector.instruction')}
        </p>

        <div
          ref={containerRef}
          className="relative border rounded-lg overflow-hidden mb-4"
        >
          <canvas
            ref={canvasRef}
            className="block w-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />

          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">{t('watermarkRemover.regionSelector.selectedRegions')}</h3>

          {regions.length === 0 ? (
            <p className="text-gray-500">{t('watermarkRemover.regionSelector.noRegionsSelected')}</p>
          ) : (
            <div className="space-y-2">
              {regions.map((region, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span>
                    {t('watermarkRemover.regionSelector.region')} {index + 1}:
                    X={region.x}, Y={region.y}, W={region.width}, H={region.height}
                  </span>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleRemoveRegion(index)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSubmitRegions}
            disabled={regions.length === 0 || isSubmitting}
            loading={isSubmitting}
          >
            {t('watermarkRemover.regionSelector.submit')}
          </Button>
        </div>
      </div>
    </div>
  );
}