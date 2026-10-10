import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion } from 'framer-motion';
import { useAuth } from '../../store/authStore';
import { ROUTES } from '../../constants';
import { ArrowRight, Home, Compass } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => {
    document.title = '404 - Page Not Found';
  }, []);

  const handleAction = () => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD);
    } else {
      navigate(ROUTES.AUTH.LOGIN);
    }
  };

  return (
    <div
      className={`min-h-[80vh] flex items-center justify-center p-6 ${
        isAuthenticated ? 'bg-slate-50' : 'bg-slate-50 min-h-screen'
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 sm:p-10 text-center"
      >
        {/* Visual Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100/80 text-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-2xs">
          <Compass className="w-8 h-8" />
        </div>

        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 mb-3">
          404 Not Found
        </span>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
          Page Not Found
        </h1>

        <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
          The page you requested{' '}
          <span className="font-mono text-2xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 break-all">
            {location.pathname}
          </span>{' '}
          could not be found or may have been relocated.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleAction}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Home className="w-4 h-4" />
            {isAuthenticated ? 'Go to Dashboard' : 'Back to Login'}
          </button>

          {isAuthenticated && (
            <button
              type="button"
              onClick={() => navigate(ROUTES.TICKETS.NEW)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs transition-colors"
            >
              <span>Service Catalog</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
