import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion } from 'framer-motion';
import { ROUTES } from '../../constants';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.title = 'Access Restricted - Desk';
  }, []);

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6 bg-slate-50">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 sm:p-10 text-center"
      >
        {/* Visual Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-6 shadow-2xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 mb-3">
          Access Restricted
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
          Permission Required
        </h1>

        <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
          You do not have administrative privileges to access{' '}
          <span className="font-mono text-2xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 break-all">
            {location.pathname}
          </span>
          . Please contact your organization administrator if you need access.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

          <button
            type="button"
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs shadow-indigo-100 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Go to Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default UnauthorizedPage;
