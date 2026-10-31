import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="space-y-4 animate-pulse p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-72 bg-slate-200 rounded-xl"></div>
        <div className="h-72 bg-slate-200 rounded-xl"></div>
      </div>
      <div className="h-64 bg-slate-200 rounded-xl"></div>
    </div>
  );
};

export const ErrorBanner: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => {
  return (
    <div className="m-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800">
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div className="text-sm font-medium">{message}</div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
};
