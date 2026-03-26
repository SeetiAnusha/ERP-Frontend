import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ActionButtonProps {
  onClick: () => void;
  icon: LucideIcon;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  icon: Icon,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = ''
}) => {
  const baseClasses = 'flex items-center gap-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  const disabledClasses = disabled || loading 
    ? 'opacity-50 cursor-not-allowed' 
    : 'shadow-lg';

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.05 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabledClasses}
        ${className}
      `}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
      ) : (
        <Icon size={iconSizes[size]} />
      )}
      {children}
    </motion.button>
  );
};

export default ActionButton;