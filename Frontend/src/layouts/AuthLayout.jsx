import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckSquare } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export function AuthLayout() {
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (loading) {
    return null; // or a spinner
  }

  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background relative">
      {/* Theme toggle for auth pages */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-10 p-2 text-muted-foreground hover:bg-accent rounded-full"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      {/* Left side - Form */}
      <div className="flex items-center justify-center p-8 sm:p-12 lg:p-16 relative">
        <div className="w-full max-w-[400px] space-y-6">
          <Outlet />
        </div>
      </div>

      {/* Right side - Image/Branding */}
      <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-muted/30 border-l relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-background z-0" />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/20 blur-3xl" />

        <div className="relative z-10 text-center space-y-6 max-w-md">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-background rounded-2xl shadow-xl shadow-primary/10 border">
              <CheckSquare className="h-16 w-16 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Manage tasks like a pro.</h1>
          <p className="text-lg text-muted-foreground">
            A complete suite for managing your projects, teams, and daily tasks with elegant simplicity.
          </p>
          

        </div>
      </div>
    </div>
  );
}
