import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, CheckSquare, Clock, AlertTriangle, Users, Calendar, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format, differenceInDays } from 'date-fns';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

export function Overview() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [dueTasks, setDueTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user.role]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const endpoint = user.role === 'Manager' ? '/dashboard/manager' : '/dashboard/user';
      
      const [statsRes, tasksRes] = await Promise.all([
        api.get(endpoint),
        api.get('/tasks')
      ]);
      
      setStats(statsRes.data.data);
      
      // Process tasks for "Due Soon" list
      const tasks = tasksRes.data.data;
      const pending = tasks.filter(t => t.status !== 'COMPLETED');
      // Sort by due date ascending
      pending.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      setDueTasks(pending.slice(0, 5)); // Top 5 due soon/overdue tasks

    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return <div className="p-8 text-center text-[var(--color-text-muted)]">Loading dashboard...</div>;
  }

  // Data for Pie Chart
  const taskProgressData = [
    { name: 'Completed', value: stats.completedTasks, color: '#10b981' },
    { name: 'Pending', value: stats.pendingTasks - stats.overdueTasks, color: '#f59e0b' },
    { name: 'Overdue', value: stats.overdueTasks, color: '#ef4444' },
  ].filter(item => item.value > 0);

  if (taskProgressData.length === 0) {
    taskProgressData.push({ name: 'No Tasks', value: 1, color: '#94a3b8' });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            Welcome back, {user?.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Here's what's happening with your projects today.
          </p>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {user.role === 'Manager' && (
           <Card>
           <CardHeader className="flex flex-row items-center justify-between pb-2">
             <CardTitle className="text-sm font-medium text-[var(--color-text-muted)]">
               Total Users
             </CardTitle>
             <Users className="h-4 w-4 text-[var(--color-primary)]" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-[var(--color-text)]">{stats.totalUsers}</div>
           </CardContent>
         </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-text-muted)]">
              {user.role === 'Manager' ? 'Total Projects' : 'Joined Projects'}
            </CardTitle>
            <Briefcase className="h-4 w-4 text-[var(--color-primary)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--color-text)]">
              {user.role === 'Manager' ? stats.totalProjects : stats.joinedProjects}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-text-muted)]">
              Total Tasks
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-[var(--color-primary)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--color-text)]">{stats.totalTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-text-muted)]">
              Pending Tasks
            </CardTitle>
            <Clock className="h-4 w-4 text-[var(--color-warning)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--color-text)]">{stats.pendingTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-text-muted)]">
              Overdue Tasks
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-[var(--color-destructive)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--color-text)]">{stats.overdueTasks}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle>Task Progress</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={taskProgressData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {taskProgressData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip />
                 <Legend verticalAlign="bottom" height={36}/>
               </PieChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Due Soon & Overdue Tasks</CardTitle>
            <Link to="/tasks" className="text-sm text-[var(--color-primary)] hover:underline flex items-center">
              View all <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            {dueTasks.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] py-8">
                 <CheckSquare className="w-12 h-12 mb-3 opacity-20" />
                 <p>All caught up! No pending tasks.</p>
               </div>
            ) : (
              <div className="space-y-4">
                {dueTasks.map(task => {
                  const daysLeft = differenceInDays(new Date(task.dueDate), new Date());
                  const isOverdue = daysLeft < 0;
                  
                  return (
                    <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-primary)] transition-colors">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-sm text-[var(--color-text)]">{task.title}</span>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-[var(--color-text-muted)]">{task.project?.name}</span>
                          <span className="text-[var(--color-border)]">•</span>
                          <span className={isOverdue ? 'text-[var(--color-destructive)] font-semibold' : 'text-[var(--color-warning)]'}>
                            {isOverdue ? `Overdue by ${Math.abs(daysLeft)} days` : daysLeft === 0 ? 'Due Today' : `Due in ${daysLeft} days`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {user.role === 'Manager' && (
                          <img 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignedTo?.name || 'User')}&background=random`} 
                            alt={task.assignedTo?.name} 
                            title={`Assigned to: ${task.assignedTo?.name}`}
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <Badge variant={task.priority === 'HIGH' ? 'destructive' : task.priority === 'LOW' ? 'info' : 'warning'} className="text-[10px] py-0 px-2">
                          {task.priority || 'MEDIUM'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
