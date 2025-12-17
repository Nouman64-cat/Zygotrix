import React from 'react';
import { cn } from '../../utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className, showText = true }) => {
  const sizeMap = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-24 w-24',
  };

  const textSizeMap = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={cn('flex items-center', className)}>
      <img
        src="/zygotrix-ai.png"
        alt="Zygotrix AI"
        className={cn(sizeMap[size], 'object-cover')}
      />
      {showText && (
        <span className={cn('font-semibold text-gray-900', textSizeMap[size])}>
          Zygotrix AI
        </span>
      )}
    </div>
  );
};
