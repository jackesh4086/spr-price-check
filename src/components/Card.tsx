interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export function Card({ children, className = '', onClick, selected }: CardProps) {
  const base = 'bg-white rounded-xl border transition-all duration-200';
  const interactive = onClick ? 'cursor-pointer hover:shadow-lg hover:border-blue-300' : '';
  const selectedStyle = selected ? 'border-blue-500 ring-2 ring-blue-500 shadow-md' : 'border-gray-200';

  return (
    <div
      className={`${base} ${interactive} ${selectedStyle} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  );
}

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex items-center justify-center">
      <div className={`${sizes[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`} />
    </div>
  );
}

export function ErrorBox({ message, onRetry, retryAfter }: { message: string; onRetry?: () => void; retryAfter?: number }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="flex-1">
          <p className="text-red-700 text-sm">{message}</p>
          {retryAfter && <p className="text-red-500 text-xs mt-1">Try again in {retryAfter} seconds</p>}
          {onRetry && !retryAfter && (
            <button onClick={onRetry} className="text-red-600 text-sm font-medium hover:text-red-700 mt-2">
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
