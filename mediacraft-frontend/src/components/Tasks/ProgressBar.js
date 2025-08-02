export default function ProgressBar({ percentage = 0, size = 'md' }) {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const normalizedPercentage = Math.max(0, Math.min(100, percentage));

  return (
    <div className="flex items-center">
      <div className={`w-16 bg-gray-200 rounded-full ${sizeClasses[size]} mr-2`}>
        <div 
          className={`bg-primary ${sizeClasses[size]} rounded-full transition-all duration-300`}
          style={{ width: `${normalizedPercentage}%` }}
        ></div>
      </div>
      <span className="text-sm text-gray-600 min-w-[3rem]">
        {normalizedPercentage}%
      </span>
    </div>
  );
}