import { useState, useEffect } from 'react';

export default function Alert({ type = 'info', message, onClose, autoClose = false, duration = 5000 }) {
  const [visible, setVisible] = useState(true);
  
  useEffect(() => {
    if (autoClose && visible) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, visible, duration, onClose]);
  
  if (!visible) return null;
  
  const alertClasses = {
    success: 'alert-success',
    danger: 'alert-danger',
    warning: 'alert-warning',
    info: 'alert-info',
  };
  
  const iconClasses = {
    success: 'bi-check-circle-fill',
    danger: 'bi-exclamation-circle-fill',
    warning: 'bi-exclamation-triangle-fill',
    info: 'bi-info-circle-fill',
  };
  
  return (
    <div className={`alert ${alertClasses[type] || 'alert-info'}`} role="alert">
      <div className="flex items-center">
        <i className={`bi ${iconClasses[type] || 'bi-info-circle-fill'} mr-2`}></i>
        <div className="flex-grow">{message}</div>
        <button 
          type="button" 
          className="text-gray-500 hover:text-gray-700"
          onClick={() => {
            setVisible(false);
            if (onClose) onClose();
          }}
          aria-label="Close"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    </div>
  );
}