import type { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface SectionErrorBoundaryProps {
  children: ReactNode;
  sectionName?: string;
}

export const SectionErrorBoundary: React.FC<SectionErrorBoundaryProps> = ({ children, sectionName = 'this section' }) => {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="p-6 bg-white border border-red-200 rounded-xl shadow-sm flex flex-col items-center justify-center text-center min-h-[200px]">
          <div className="bg-red-50 p-3 rounded-full mb-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Failed to load {sectionName}</h3>
          <p className="text-xs text-slate-500 mb-4 max-w-sm">
            {error.message}
          </p>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-50 text-red-700 hover:bg-red-100 rounded-md transition-colors font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};
