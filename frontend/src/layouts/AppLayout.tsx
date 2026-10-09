import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Compass, 
  UsersThree, 
  CalendarCheck, 
  Bell, 
  Gear, 
  SignOut, 
  Plus, 
  List, 
  X, 
  Sparkle,
  UserSwitch,
  ClockAfternoon,
  ShieldCheck,
  Check
} from '@phosphor-icons/react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { api } from '../services/api';
import { NotificationItem } from '../types';

export const AppLayout: React.FC = () => {
  const { user, logout, quickDemoLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000); // Polling fallback
      return () => clearInterval(interval);
    }
  }, [user]);

  async function loadNotifications() {
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      // quiet fallback
    }
  }

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {}
  };

  const navLinks = [
    { label: 'Overview', path: '/dashboard', icon: Compass },
    { label: 'My Groups', path: '/groups', icon: UsersThree },
    { label: 'My Events', path: '/events', icon: CalendarCheck },
    { label: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
    { label: 'Settings', path: '/settings', icon: Gear },
  ];

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#222D38] flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#FBF9F4] border-b border-[#D9D6CD] px-4 lg:px-8 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="lg:hidden p-2 text-[#65717A] hover:text-[#222D38] rounded-md"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={24} weight="bold" /> : <List size={24} weight="bold" />}
          </button>
          
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-md bg-[#294D68] text-white flex items-center justify-center font-serif text-lg font-bold">
              P
            </div>
            <div>
              <span className="font-heading font-bold text-lg tracking-tight text-[#222D38]">PlanWise</span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded bg-[#EAE7DF] text-[#65717A] font-medium">
                Demo Workspace
              </span>
            </div>
          </Link>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center space-x-3">
          <Link
            to="/events/new"
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#294D68] text-white text-sm font-medium hover:bg-[#1e384d] transition-colors shadow-sm"
          >
            <Plus size={16} weight="bold" />
            <span>New Event</span>
          </Link>

          {/* Demo User Switcher */}
          <div className="relative">
            <button
              onClick={() => { setUserMenuOpen(!userMenuOpen); setNotificationsOpen(false); }}
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-md bg-[#EAE7DF] border border-[#D9D6CD] hover:bg-[#dfdbd1] text-xs font-medium text-[#222D38] transition-colors"
              title="Switch user to test different budgets & votes"
            >
              <UserSwitch size={16} weight="bold" className="text-[#294D68]" />
              <span className="hidden md:inline font-medium">Switch Profile:</span>
              <span className="font-semibold text-[#294D68] truncate max-w-[90px]">{user?.name?.split(' ')[0]}</span>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-[#FBF9F4] border border-[#D9D6CD] rounded-md shadow-lg p-2 z-50">
                <div className="text-xs font-bold text-[#65717A] px-2 py-1 uppercase tracking-wider">
                  Test Personas (1-Click Switch)
                </div>
                <div className="space-y-1 mt-1">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      onClick={() => {
                        quickDemoLogin(acc.email);
                        setUserMenuOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-md text-xs transition-colors flex items-start justify-between ${
                        user?.email === acc.email ? 'bg-[#294D68]/10 font-bold border border-[#294D68]/20' : 'hover:bg-[#EAE7DF]'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-[#222D38] flex items-center space-x-1">
                          <span>{acc.name}</span>
                          {user?.email === acc.email && <Check size={14} weight="bold" className="text-[#294D68]" />}
                        </div>
                        <div className="text-[11px] text-[#65717A]">{acc.role}</div>
                        <div className="text-[10px] text-[#527C75] font-mono mt-0.5">{acc.budgetText}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="border-t border-[#D9D6CD] mt-2 pt-2">
                  <button
                    onClick={() => { logout(); navigate('/'); }}
                    className="w-full text-left px-2 py-1 text-xs text-[#A64F49] hover:bg-[#A64F49]/10 rounded flex items-center space-x-1.5"
                  >
                    <SignOut size={14} weight="bold" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => { setNotificationsOpen(!notificationsOpen); setUserMenuOpen(false); }}
              className="relative p-2 rounded-md text-[#65717A] hover:text-[#222D38] hover:bg-[#EAE7DF] transition-colors"
              aria-label="Notifications"
            >
              <Bell size={20} weight={unreadCount > 0 ? "fill" : "regular"} className={unreadCount > 0 ? "text-[#C17A43]" : ""} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#C17A43] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-[#FBF9F4] border border-[#D9D6CD] rounded-md shadow-xl p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-[#D9D6CD]">
                  <span className="font-heading font-bold text-sm text-[#222D38]">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-[#294D68] hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="mt-2 max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-[#65717A] text-center py-4">No recent notifications</p>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (n.link) navigate(n.link);
                          setNotificationsOpen(false);
                        }}
                        className={`p-2 rounded text-xs cursor-pointer border transition-colors ${
                          n.isRead ? 'bg-[#FBF9F4] border-transparent text-[#65717A]' : 'bg-[#EAE7DF] border-[#D9D6CD] text-[#222D38]'
                        }`}
                      >
                        <div className="font-semibold">{n.title}</div>
                        <div className="text-[11px] mt-0.5">{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-[#FBF9F4] border-r border-[#D9D6CD] p-4 justify-between">
          <div className="space-y-6">
            <div>
              <div className="text-[11px] font-bold text-[#65717A] uppercase tracking-wider mb-2 px-3">
                Workspace
              </div>
              <nav className="space-y-1">
                {navLinks.map(link => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path || (link.path !== '/dashboard' && location.pathname.startsWith(link.path));
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#294D68] text-white shadow-xs'
                          : 'text-[#65717A] hover:text-[#222D38] hover:bg-[#EAE7DF]'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon size={18} weight={isActive ? "bold" : "regular"} />
                        <span>{link.label}</span>
                      </div>
                      {link.badge ? (
                        <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[#C17A43] text-white font-bold">
                          {link.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Quick Demo Help Banner */}
            <div className="p-3 bg-[#EAE7DF] border border-[#D9D6CD] rounded-md text-xs space-y-1.5">
              <div className="font-heading font-bold text-[#222D38] flex items-center space-x-1.5">
                <ShieldCheck size={16} weight="bold" className="text-[#527C75]" />
                <span>Decision Intelligence</span>
              </div>
              <p className="text-[#65717A] text-[11px] leading-relaxed">
                PlanWise evaluates group votes, individual hard budgets, and travel trade-offs deterministically.
              </p>
            </div>
          </div>

          {/* Current user card footer */}
          <div className="border-t border-[#D9D6CD] pt-3 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 truncate">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full border border-[#D9D6CD]" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#294D68] text-white flex items-center justify-center font-bold text-xs">
                  {user?.name?.charAt(0)}
                </div>
              )}
              <div className="truncate">
                <div className="text-xs font-semibold text-[#222D38] truncate">{user?.name}</div>
                <div className="text-[11px] text-[#65717A] truncate">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="text-[#65717A] hover:text-[#A64F49] p-1"
              title="Sign Out"
            >
              <SignOut size={18} weight="bold" />
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-[#222D38]/50 flex">
            <div className="w-64 bg-[#FBF9F4] h-full p-4 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#D9D6CD]">
                  <span className="font-heading font-bold text-base text-[#222D38]">PlanWise Menu</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-[#65717A]">
                    <X size={20} weight="bold" />
                  </button>
                </div>
                <nav className="mt-4 space-y-1">
                  {navLinks.map(link => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-md text-sm text-[#222D38] hover:bg-[#EAE7DF]"
                      >
                        <div className="flex items-center space-x-3">
                          <Icon size={18} />
                          <span>{link.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                  <Link
                    to="/events/new"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm text-[#294D68] font-bold hover:bg-[#EAE7DF]"
                  >
                    <Plus size={18} weight="bold" />
                    <span>Create New Event</span>
                  </Link>
                </nav>
              </div>

              <button
                onClick={() => { logout(); navigate('/'); }}
                className="w-full text-left px-3 py-2 text-sm text-[#A64F49] hover:bg-[#A64F49]/10 rounded flex items-center space-x-2"
              >
                <SignOut size={18} weight="bold" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
