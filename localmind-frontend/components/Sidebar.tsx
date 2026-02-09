import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, Database, Hexagon, Sun, Moon, Plus } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  onNewChat?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onNewChat
}) => {
  const { theme, toggleTheme } = useTheme();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200 text-sm font-medium ${
      isActive 
        ? 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white' 
        : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900'
    }`;

  return (
    <div className="h-14 w-full bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 flex-shrink-0 transition-colors duration-300 z-20">
      
      {/* Left Section: Logo & Nav */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-black dark:bg-white rounded-md flex items-center justify-center shadow-sm">
            <Hexagon className="w-3.5 h-3.5 text-white dark:text-black" />
          </div>
          <h1 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight hidden sm:block">Local Mind</h1>
        </div>

        <nav className="flex items-center gap-1">
          <NavLink to="/" className={linkClass}>
            <MessageSquare className="w-4 h-4" />
            <span>Chat</span>
          </NavLink>
          <NavLink to="/knowledge" className={linkClass}>
            <Database className="w-4 h-4" />
            <span>Knowledge</span>
          </NavLink>
        </nav>
      </div>

      {/* Right Section: Actions */}
      <div className="flex items-center gap-3">
        {onNewChat && (
           <button 
             onClick={onNewChat}
             className="hidden sm:flex items-center gap-2 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm"
           >
             <Plus className="w-3.5 h-3.5" />
             New Chat
           </button>
        )}
        <div className="w-px h-4 bg-gray-200 dark:bg-gray-800 mx-1"></div>
        <button 
          onClick={toggleTheme}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
        >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};