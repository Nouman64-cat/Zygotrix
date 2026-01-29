import React from 'react';
import { cn } from '../../utils';
import { LOGO_URL } from '../../config';
import { useAuth } from '../../contexts';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className, showText = true }) => {
  const { user } = useAuth();
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
        <div className="flex items-center gap-2">
          <span className={cn('font-medium text-gray-600 dark:text-gray-300', textSizeMap[size])}>
            Zygotrix AI
          </span>
          {/* PRO Badge integrated into Logo */}
          {user?.subscription_status === 'pro' && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full border shadow-sm",
              "bg-gray-900 border-emerald-500/30",
              size === 'sm' ? 'scale-75' : ''
            )}>
              <span className="text-emerald-500">★</span>
              <span className="text-[10px] font-bold tracking-wide text-emerald-400">PRO</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
