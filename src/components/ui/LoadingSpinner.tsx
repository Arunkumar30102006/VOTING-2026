
import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="relative w-24 h-24">
        {/* Outer Ring */}
        <div className="absolute inset-0 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
        
        {/* Middle Ring */}
        <div className="absolute inset-2 border-4 border-l-transparent border-purple-500 rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>
        
        {/* Inner Ring */}
        <div className="absolute inset-4 border-4 border-r-transparent border-pink-500 rounded-full animate-[spin_2s_linear_infinite]"></div>
        
        {/* Center Dot */}
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-pink-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
