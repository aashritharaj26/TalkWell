import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Sun, Moon, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Mood Tracker', href: '/mood-tracker' },
    { name: 'Journal', href: '/journal' },
    { name: 'AI Chat', href: '/chat' },
    { name: 'Mood Calendar', href: '/calendar' },
    { name: 'Mood Reports', href: '/reports' },
    { name: 'Resources', href: '/resources' },
    { name: 'About', href: '/about' },
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <nav className="bg-white dark:bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  TalkWell AI
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              {user ? (
                <button
                  onClick={handleLogout}
                  className="ml-4 p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              ) : (
                <Link
                  to="/login"
                  className="ml-4 px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Login
                </Link>
              )}
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  className="block px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
