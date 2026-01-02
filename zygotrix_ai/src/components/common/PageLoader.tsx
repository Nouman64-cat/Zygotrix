import React from 'react';
import { BiLoaderAlt } from 'react-icons/bi';

interface PageLoaderProps {
  message?: string;
}

/**
 * Minimal clean loader with spinner and text
 */
export const PageLoader: React.FC<PageLoaderProps> = ({ 
  message = 'Loading...' 
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-3">
      <BiLoaderAlt className="w-8 h-8 text-emerald-600 animate-spin" />
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {message}
      </p>
    </div>
  );
};

export default PageLoader;
