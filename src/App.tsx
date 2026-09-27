import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import { OrgChartPage } from './pages/org/OrgChartPage';
import { BrowseFoldersPage } from './pages/folders/BrowseFoldersPage';
import { TicketTypeAdminPage } from './pages/admin/TicketTypeAdminPage';
import { TicketTypeFormPage } from './pages/admin/TicketTypeFormPage';
import { TicketStatusManager } from './pages/admin/TicketStatusManager';
import { CreateTicketPage } from './pages/tickets/CreateTicketPage';

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<div>LoginPage Placeholder</div>} />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<div>DashboardPage Placeholder</div>} />
          <Route path="/browse" element={<BrowseFoldersPage />} />
          <Route path="/tickets/new" element={<CreateTicketPage />} />
          <Route path="/tickets/*" element={<div>Tickets Placeholder</div>} />
          <Route path="/admin/ticket-types" element={<TicketTypeAdminPage />} />
          <Route path="/admin/ticket-types/new" element={<TicketTypeFormPage />} />
          <Route path="/admin/ticket-types/:id/edit" element={<TicketTypeFormPage />} />
          <Route path="/admin/ticket-types/:id/statuses" element={<TicketStatusManager />} />
          <Route path="/admin/*" element={<div>Admin Placeholder</div>} />
          <Route path="/metrics" element={<div>MetricsPage Placeholder</div>} />
          <Route path="/org-chart" element={<OrgChartPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;
