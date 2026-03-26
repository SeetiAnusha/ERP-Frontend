import React from 'react';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow';
}

const Progress: React.FC<ProgressProps> = ({ 
  value, 
  max = 100, 
  className = '', 
  color = 'blue' 
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600'
  };

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div
        className={`h-2 rounded-full transition-all duration-300 ${colorClasses[color]}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

export default Progress;