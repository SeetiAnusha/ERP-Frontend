import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'warning' | 'error' | 'success';
}

interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ 
  children, 
  className = '', 
  variant = 'default' 
}) => {
  const variantClasses = {
    default: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800'
  };

  return (
    <div className={`relative w-full rounded-lg border p-4 ${variantClasses[variant]} ${className}`}>
      <div className="flex items-start space-x-3">
        {children}
      </div>
    </div>
  );
};

export const AlertDescription: React.FC<AlertDescriptionProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`text-sm ${className}`}>
      {children}
    </div>
  );
};

export default Alert;