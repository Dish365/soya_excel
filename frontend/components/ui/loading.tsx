interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'branded';
}

export function Loading({ message = 'Loading...', size = 'md', variant = 'default' }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  if (variant === 'branded') {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="relative">
          {/* Soya Excel branded loading animation */}
          <div className={`${sizeClasses[size]} border-4 border-gray-200 rounded-full`}>
            <div className={`${sizeClasses[size]} border-4 border-green-600 border-t-transparent rounded-full animate-spin absolute inset-0`}></div>
          </div>
          {/* Yellow accent dot */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
        </div>
        {message && (
          <p className={`mt-4 text-gray-600 font-medium ${textSizes[size]}`}>
            {message}
          </p>
        )}
        {/* Brand colors indicator */}
        <div className="flex items-center gap-2 mt-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-black rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`${sizeClasses[size]} border-4 border-gray-200 border-t-green-600 rounded-full animate-spin`}></div>
      {message && (
        <p className={`mt-4 text-gray-600 font-medium ${textSizes[size]}`}>
          {message}
        </p>
      )}
    </div>
  );
}

// Full screen loading component
export function FullScreenLoading({ message = 'Loading Soya Excel...', variant = 'branded' }: Omit<LoadingProps, 'size'>) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-yellow-50">
      <div className="text-center">
        {variant === 'branded' ? (
          <>
            <div className="relative mb-6">
              <div className="h-20 w-20 border-4 border-gray-200 rounded-full">
                <div className="h-20 w-20 border-4 border-green-600 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
              </div>
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Soya Excel</h2>
            <p className="text-gray-600 mb-4">Management System</p>
            <div className="flex justify-center items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-black rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </>
        ) : (
          <div className="h-20 w-20 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
        )}
        <p className="text-lg text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
}

// Inline loading component
export function InlineLoading({ size = 'sm' }: Omit<LoadingProps, 'message' | 'variant'>) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`${sizeClasses[size]} border-2 border-gray-200 border-t-green-600 rounded-full animate-spin`}></div>
  );
}

// Button loading component
export function ButtonLoading({ size = 'sm' }: Omit<LoadingProps, 'message' | 'variant'>) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <div className={`${sizeClasses[size]} border-2 border-white border-t-transparent rounded-full animate-spin`}></div>
  );
} 