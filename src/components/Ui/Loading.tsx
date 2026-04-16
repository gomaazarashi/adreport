interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Loading({
  message = 'データを読み込み中...',
  size = 'md',
}: LoadingProps) {
  const spinnerSize = {
    sm: 'h-6 w-6 border-3',
    md: 'h-8 w-8 border-4',
    lg: 'h-12 w-12 border-4',
  };

  const messageSizeClass = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="inline-block">
          <div className="animate-spin">
            <div
              className={`${spinnerSize[size]} border-blue-500 border-t-transparent rounded-full`}
            ></div>
          </div>
        </div>
        <p className={`mt-4 text-gray-600 ${messageSizeClass[size]}`}>
          {message}
        </p>
      </div>
    </div>
  );
}
