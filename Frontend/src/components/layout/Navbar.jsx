import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Menu as MenuIcon, Sun as SunIcon, Moon as MoonIcon, LogOut as LogOutIcon, Bell as BellIcon, AlertTriangle as AlertTriangleIcon, UserPlus as UserPlusIcon, Check as CheckIcon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import api from '../../services/api';

export function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/projects')
      ]);

      const tasks = tasksRes.data.data;
      const projects = projectsRes.data.data;
      
      const newNotifs = [];

      // Task deadline notifications (1-2 days left)
      tasks.forEach(task => {
        if (task.status !== 'COMPLETED') {
          const daysLeft = differenceInDays(new Date(task.dueDate), new Date());
          if (daysLeft >= 0 && daysLeft <= 2) {
            newNotifs.push({
              id: `task-${task.id}`,
              type: 'warning',
              message: `Task "${task.title}" is due in ${daysLeft === 0 ? 'today' : daysLeft + ' day(s)'}!`,
              time: new Date(task.dueDate)
            });
          } else if (daysLeft < 0) {
            newNotifs.push({
              id: `task-overdue-${task.id}`,
              type: 'danger',
              message: `Task "${task.title}" is overdue!`,
              time: new Date(task.dueDate)
            });
          }
        }
      });

      // Project added notifications (for User role)
      if (user?.role === 'User') {
        projects.forEach(project => {
          const myMembership = project.members?.find(m => m.userId === user.id);
          if (myMembership && myMembership.createdAt) {
            newNotifs.push({
              id: `proj-${project.id}`,
              type: 'info',
              message: `You have been added to project "${project.name}"`,
              time: new Date(myMembership.createdAt)
            });
          }
        });
      }

      // Sort by time descending
      newNotifs.sort((a, b) => b.time - a.time);
      setNotifications(newNotifs);

    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const handleNotifClick = () => {
    if (!notificationsOpen) {
      fetchNotifications();
    }
    setNotificationsOpen(!notificationsOpen);
    setDropdownOpen(false);
  };

  const handleProfileClick = () => {
    setDropdownOpen(!dropdownOpen);
    setNotificationsOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b bg-background/95 backdrop-blur px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="text-muted-foreground hover:text-foreground lg:hidden p-2 -ml-2 rounded-md hover:bg-accent"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold tracking-tight lg:hidden">TaskMaster</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground rounded-full transition-colors"
        >
          {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </button>

        <div className="relative" ref={notifRef}>
          <button 
            onClick={handleNotifClick}
            className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground rounded-full transition-colors relative"
          >
            <BellIcon className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive"></span>
            )}
          </button>
          
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 max-h-[400px] overflow-y-auto rounded-md border bg-[var(--color-card)] text-[var(--color-text)] shadow-lg animate-in fade-in zoom-in-95">
              <div className="px-4 py-3 border-b border-[var(--color-border)] flex justify-between items-center sticky top-0 bg-[var(--color-card)] z-10">
                <h3 className="font-semibold text-sm">Notifications ({notifications.length})</h3>
                {notifications.length > 0 && (
                  <button onClick={() => setNotifications([])} className="text-xs text-[var(--color-primary)] hover:underline">
                    Clear all
                  </button>
                )}
              </div>
              <div className="py-1">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-[var(--color-text-muted)] flex flex-col items-center">
                    <CheckIcon className="h-8 w-8 text-green-500 mb-2 opacity-50" />
                    You're all caught up!
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className="px-4 py-3 border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)] transition-colors">
                      <div className="flex gap-3 items-start">
                        {notif.type === 'warning' || notif.type === 'danger' ? (
                          <AlertTriangleIcon className={`h-5 w-5 shrink-0 ${notif.type === 'danger' ? 'text-[var(--color-destructive)]' : 'text-[var(--color-warning)]'}`} />
                        ) : (
                          <UserPlusIcon className="h-5 w-5 shrink-0 text-[var(--color-info)]" />
                        )}
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-tight">{notif.message}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {format(notif.time, 'PPp')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={handleProfileClick}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-accent transition-colors"
          >
            <img src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`} alt="User" className="h-8 w-8 rounded-full border border-[var(--color-border)]" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md border bg-[var(--color-card)] text-[var(--color-text)] shadow-md animate-in fade-in zoom-in-95">
              <div className="px-4 py-3 border-b border-[var(--color-border)]">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 truncate">{user?.email}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 rounded-sm px-3 py-2 text-sm text-[var(--color-destructive)] hover:bg-[var(--color-destructive)] hover:text-white transition-colors"
                >
                  <LogOutIcon className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
