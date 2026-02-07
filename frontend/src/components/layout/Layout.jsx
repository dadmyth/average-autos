import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Layout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/inventory', label: 'Inventory' },
    { to: '/sales', label: 'Sales' },
    { to: '/settings', label: 'Settings' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Dark navbar */}
      <nav className="bg-gray-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/">
                  <img src="/logo.svg" alt="Average Autos" className="h-10 w-auto invert" />
                </Link>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
                {navLinks.map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive(to)
                        ? 'border-white text-white'
                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-400 mr-4 text-sm">Hello, {user?.username}</span>
              <button
                onClick={handleLogout}
                className="bg-gray-700 text-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-600 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
