import React from 'react';
import { cn } from '../../utils';
import { LOGO_URL } from '../../config';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className, showText = true }) => {
  const sizeMap = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-32 w-32',
  };

  const textSizeMap = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <img
        src={LOGO_URL}
        alt="Zygotrix AI"
        className={cn(sizeMap[size], 'object-cover')}
      />
      {showText && (
        <span className={cn('font-medium text-gray-600 dark:text-gray-300', textSizeMap[size])}>
          Zygotrix AI
        </span>
      )}
    </div>
  );
};
