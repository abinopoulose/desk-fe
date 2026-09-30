import { ROUTES } from '../../constants';
import type { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router';

interface PageErrorBoundaryProps {
  children: ReactNode;
}

export const PageErrorBoundary: React.FC<PageErrorBoundaryProps> = ({ children }) => {
  const navigate = useNavigate();

  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-red-100 p-4 rounded-full mb-6">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Page Error</h1>
          <p className="text-slate-600 mb-8 max-w-md">
            We encountered an unexpected error while rendering this page. The issue has been logged.
          </p>
          <div className="bg-white border border-slate-200 rounded-lg p-4 mb-8 text-left max-w-2xl w-full overflow-auto">
            <p className="text-sm font-mono text-red-600">{error.message}</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={() => {
                reset();
                navigate(ROUTES.DASHBOARD);
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition-colors"
            >
              <Home className="w-4 h-4" />
              Go Home
            </button>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};
