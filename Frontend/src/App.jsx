import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';

import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Overview as DashboardOverview } from './pages/dashboard/Overview';
import { ProjectList } from './pages/projects/ProjectList';
import { TaskBoard } from './pages/tasks/TaskBoard';
import { TeamList } from './pages/teams/TeamList';
import { UserManagement } from './pages/users/UserManagement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected Dashboard Routes */}
        <Route element={<DashboardLayout />}>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardOverview />} />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/tasks" element={<TaskBoard />} />
            <Route path="/teams" element={<TeamList />} />
          </Route>

          {/* Manager Only Routes */}
          <Route element={<ProtectedRoute allowedRoles={['Manager']} />}>
            <Route path="/users" element={<UserManagement />} />
          </Route>
        </Route>

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Catch all 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
