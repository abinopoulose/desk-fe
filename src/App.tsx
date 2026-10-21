import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router';
import { ROUTES } from './constants';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { OrgSignupPage } from './pages/auth/OrgSignupPage';
import { SetPasswordPage } from './pages/auth/SetPasswordPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { BrowseFoldersPage } from './pages/folders/BrowseFoldersPage';
import { TicketTypeFormPage } from './pages/admin/TicketTypeFormPage';
import { TicketStatusManager } from './pages/admin/TicketStatusManager';
import { CreateTicketPage } from './pages/tickets/CreateTicketPage';
import { TicketDetailsPage } from './pages/tickets/TicketDetailsPage';
import { TicketListPage } from './pages/dashboard/TicketListPage';
import { MetricsDashboardPage } from './pages/metrics/MetricsDashboardPage';
import { PrivilegeGate } from './components/auth/PrivilegeGate';
import UserProfilePage from './pages/user/UserProfilePage';
import { DepartmentAdminPage } from './pages/admin/DepartmentAdminPage';
import { DepartmentTicketsPage } from './pages/departments/DepartmentTicketsPage';
import { DepartmentMembersPage } from './pages/departments/DepartmentMembersPage';
import { DepartmentMetricsPage } from './pages/departments/DepartmentMetricsPage';
import { RoleAdminPage } from './pages/admin/RoleAdminPage';
import { EmployeeManagementPage } from './pages/admin/EmployeeManagementPage';
import { PageErrorBoundary } from './components/errors/PageErrorBoundary';
import { NotFoundPage } from './pages/errors/NotFoundPage';
import { UnauthorizedPage } from './pages/errors/UnauthorizedPage';
import { useAuth } from './store/authStore';
import { getUserSlug } from './utils/userUtils';

function SettingsRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to={ROUTES.AUTH.LOGIN} replace />;
  return <Navigate to={`${ROUTES.USERS.PROFILE(getUserSlug(user))}?tab=sessions`} replace />;
}

function DepartmentRedirect() {
  const { departmentId } = useParams<{ departmentId: string }>();
  return <Navigate to={ROUTES.DEPARTMENT_DETAILS.TICKETS(departmentId || '')} replace />;
}

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <PageErrorBoundary>
        <Routes>
          <Route path={ROUTES.AUTH.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.AUTH.REGISTER} element={<OrgSignupPage />} />
          <Route path={ROUTES.AUTH.SET_PASSWORD} element={<SetPasswordPage />} />
          <Route path={ROUTES.AUTH.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            {/* Workspace Routes (Accessible to all authenticated firm members) */}
            <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            <Route path={ROUTES.DASHBOARD} element={<TicketListPage />} />
            <Route path={ROUTES.DEPARTMENTS} element={<Navigate to={ROUTES.DEPARTMENT_TICKETS} replace />} />
            <Route path={ROUTES.DEPARTMENT_TICKETS} element={<DepartmentTicketsPage />} />
            <Route path="/departments/:departmentId" element={<DepartmentRedirect />} />
            <Route path={ROUTES.DEPARTMENT_DETAILS.TICKETS_PATH} element={<DepartmentTicketsPage />} />
            <Route path={ROUTES.DEPARTMENT_DETAILS.MEMBERS_PATH} element={<DepartmentMembersPage />} />
            <Route path={ROUTES.DEPARTMENT_DETAILS.METRICS_PATH} element={<DepartmentMetricsPage />} />
            <Route path={ROUTES.SETTINGS} element={<SettingsRedirect />} />
            <Route path={ROUTES.TICKETS.NEW} element={<CreateTicketPage />} />
            <Route path={ROUTES.TICKETS.DETAILS_PATH} element={<TicketDetailsPage />} />
            <Route path={ROUTES.TICKETS.BASE} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            <Route path={ROUTES.ORG_CHART} element={<Navigate to="/admin/employees?view=tree" replace />} />
            <Route path={ROUTES.USERS.PROFILE_PATH} element={<UserProfilePage />} />

            {/* Administration Routes (Protected by PrivilegeGate) */}
            <Route path={ROUTES.ADMIN.TICKET_TYPES} element={<PrivilegeGate requiredPrivilege="TICKET_TYPE_EDIT" fallback={<UnauthorizedPage />}><BrowseFoldersPage isAdminMode={true} /></PrivilegeGate>} />
            <Route path={ROUTES.ADMIN.TICKET_TYPE_NEW} element={<PrivilegeGate requiredPrivilege="TICKET_TYPE_EDIT" fallback={<UnauthorizedPage />}><TicketTypeFormPage /></PrivilegeGate>} />
            <Route path={ROUTES.ADMIN.TICKET_TYPE_EDIT_PATH} element={<PrivilegeGate requiredPrivilege="TICKET_TYPE_EDIT" fallback={<UnauthorizedPage />}><TicketTypeFormPage /></PrivilegeGate>} />
            <Route path={ROUTES.ADMIN.TICKET_STATUSES_PATH} element={<PrivilegeGate requiredPrivilege="TICKET_TYPE_EDIT" fallback={<UnauthorizedPage />}><TicketStatusManager /></PrivilegeGate>} />
            <Route path={ROUTES.ADMIN.DEPARTMENTS} element={<PrivilegeGate requiredPrivilege="DEPARTMENT_EDIT" fallback={<UnauthorizedPage />}><DepartmentAdminPage /></PrivilegeGate>} />
            <Route path={ROUTES.ADMIN.ROLES} element={<PrivilegeGate requiredPrivilege="ROLE_EDIT" fallback={<UnauthorizedPage />}><RoleAdminPage /></PrivilegeGate>} />
            <Route path={ROUTES.ADMIN.EMPLOYEES} element={<PrivilegeGate requiredPrivilege="USER_EDIT" fallback={<UnauthorizedPage />}><EmployeeManagementPage /></PrivilegeGate>} />
            <Route path={ROUTES.METRICS} element={<PrivilegeGate requiredPrivilege="DEPARTMENT_EDIT" fallback={<UnauthorizedPage />}><MetricsDashboardPage /></PrivilegeGate>} />

            {isAuthenticated && <Route path="*" element={<NotFoundPage />} />}
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </PageErrorBoundary>
    </BrowserRouter>
  )
}

export default App;
