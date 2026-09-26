import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<div>LoginPage Placeholder</div>} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<div>DashboardPage Placeholder</div>} />
          <Route path="/tickets/*" element={<div>Tickets Placeholder</div>} />
          <Route path="/admin/*" element={<div>Admin Placeholder</div>} />
          <Route path="/metrics" element={<div>MetricsPage Placeholder</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;
