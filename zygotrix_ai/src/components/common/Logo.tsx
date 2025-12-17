import React from 'react';
import { cn } from '../../utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className, showText = true }) => {
  const sizeMap = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const textSizeMap = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <img
        src="/zygotrix-ai.png"
        alt="Zygotrix AI"
        className={cn(sizeMap[size], 'object-contain')}
      />
      {showText && (
        <span className={cn('font-semibold text-gray-900', textSizeMap[size])}>
          Zygotrix AI
        </span>
      )}
    </div>
  );
};
