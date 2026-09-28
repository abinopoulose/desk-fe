import { Outlet, Link } from 'react-router';
import { useAuth } from '../../store/authStore';

export function AppLayout() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Desk App</h1>
        </div>
        <nav className="p-4 flex flex-col gap-2">
          <Link to="/dashboard" className="text-blue-600 hover:underline">Dashboard</Link>
          <Link to="/tickets" className="text-blue-600 hover:underline">Tickets</Link>
          <Link to="/metrics" className="text-blue-600 hover:underline">Metrics</Link>
          <Link to="/admin" className="text-blue-600 hover:underline">Admin</Link>
          {user && (
            <Link to={`/users/${user.id}`} className="text-blue-600 hover:underline">
              My Profile
            </Link>
          )}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Header</h2>
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }} 
            className="text-red-500"
          >
            Logout
          </button>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
