import { useState, useEffect } from 'react';
import { Button } from '../../components/common/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Label } from '../../components/common/Label';
import { useAuth } from '../../context/AuthContext';
import { Plus, Search, Clock, UserPlus, Settings, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../services/api';

export function ProjectList() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', status: 'ACTIVE' });

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');

  // Manager Options
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [manageProjectData, setManageProjectData] = useState(null);

  useEffect(() => {
    fetchProjects();
    if (user?.role === 'Manager') {
      fetchUsers();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.data);
    } catch (error) {
      toast.error('Failed to load projects');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setAllUsers(response.data.data);
    } catch (error) {
      console.error('Failed to load users for dropdown');
    }
  };

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProject.name) return toast.error('Name is required');
    
    try {
      await api.post('/projects', newProject);
      fetchProjects();
      setIsModalOpen(false);
      setNewProject({ name: '', description: '', status: 'ACTIVE' });
      toast.success('Project created successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !selectedProjectId) return toast.error('Please select a user');
    try {
      await api.post(`/projects/${selectedProjectId}/members`, { userId: Number(selectedUserId) });
      toast.success('Member added successfully!');
      setIsMemberModalOpen(false);
      setSelectedUserId('');
      fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add member');
    }
  };

  const handleUpdateProjectStatus = async (e) => {
    const newStatus = e.target.value;
    try {
      await api.put(`/projects/${manageProjectData.id}`, { status: newStatus });
      toast.success('Project status updated');
      setManageProjectData({ ...manageProjectData, status: newStatus });
      fetchProjects();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this project? This will also delete all associated tasks.')) return;
    try {
      await api.delete(`/projects/${manageProjectData.id}`);
      toast.success('Project deleted successfully');
      setIsManageModalOpen(false);
      setManageProjectData(null);
      fetchProjects();
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
      case 'ACTIVE': return <Badge variant="info">Active</Badge>;
      case 'ON_HOLD': return <Badge variant="warning">On Hold</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Projects</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Manage your team's projects</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <Input 
              placeholder="Search projects..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {user?.role === 'Manager' && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map(project => (
          <Card key={project.id} className="hover:border-[var(--color-primary)] transition-colors cursor-pointer group flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg group-hover:text-[var(--color-primary)] transition-colors">
                  {project.name}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {project.description}
                </CardDescription>
              </div>
              {user?.role === 'Manager' && (
                <div className="flex gap-1 -mr-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-[var(--color-primary)]"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProjectId(project.id);
                      setIsMemberModalOpen(true);
                    }}
                    title="Add Member"
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    onClick={(e) => {
                      e.stopPropagation();
                      setManageProjectData(project);
                      setIsManageModalOpen(true);
                    }}
                    title="Manage Project"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-end">
              <div className="mt-4 flex items-center justify-between">
                {getStatusBadge(project.status)}
              </div>
            </CardContent>
            <CardFooter className="pt-4 border-t border-[var(--color-border)] flex justify-between items-center text-sm text-[var(--color-text-muted)] mt-auto">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {format(new Date(project.createdAt), 'MMM d, yyyy')}
              </div>
              <div className="flex -space-x-2">
                {project.members && project.members.slice(0, 3).map(member => (
                  <img 
                    key={member.user.id}
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.user.name)}&background=random`} 
                    alt={member.user.name}
                    title={member.user.name}
                    className="w-6 h-6 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)]"
                  />
                ))}
                {project.members && project.members.length > 3 && (
                  <div className="w-6 h-6 rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] flex items-center justify-center text-[10px] font-medium z-10">
                    +{project.members.length - 3}
                  </div>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Project">
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Project Name</Label>
            <Input 
              id="title" 
              placeholder="e.g. Website Redesign" 
              value={newProject.name}
              onChange={(e) => setNewProject({...newProject, name: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input 
              id="description" 
              placeholder="Brief description of the project" 
              value={newProject.description}
              onChange={(e) => setNewProject({...newProject, description: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="w-full h-10 px-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              value={newProject.status}
              onChange={(e) => setNewProject({...newProject, status: e.target.value})}
            >
              <option value="ACTIVE" className="text-black dark:text-white bg-white dark:bg-slate-900">Active</option>
              <option value="ON_HOLD" className="text-black dark:text-white bg-white dark:bg-slate-900">On Hold</option>
              <option value="COMPLETED" className="text-black dark:text-white bg-white dark:bg-slate-900">Completed</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Project</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isMemberModalOpen} onClose={() => setIsMemberModalOpen(false)} title="Add Member to Project">
        <form onSubmit={handleAddMember} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userSelect">Select User</Label>
            <select
              id="userSelect"
              className="w-full h-10 px-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
            >
              <option value="" disabled className="text-black dark:text-white bg-white dark:bg-slate-900">Select an employee</option>
              {allUsers.map(u => (
                <option key={u.id} value={u.id} className="text-black dark:text-white bg-white dark:bg-slate-900">{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsMemberModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Member</Button>
          </div>
        </form>
      </Modal>

      {/* Manage Project Modal for Managers */}
      {manageProjectData && (
        <Modal isOpen={isManageModalOpen} onClose={() => {setIsManageModalOpen(false); setManageProjectData(null);}} title="Manage Project">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">{manageProjectData.name}</h3>
              <p className="text-[var(--color-text-muted)] text-sm">{manageProjectData.description || 'No description provided.'}</p>
            </div>
            
            <div className="space-y-2">
              <Label>Update Status</Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                value={manageProjectData.status}
                onChange={handleUpdateProjectStatus}
              >
                <option value="ACTIVE" className="text-black dark:text-white bg-white dark:bg-slate-900">Active</option>
                <option value="ON_HOLD" className="text-black dark:text-white bg-white dark:bg-slate-900">On Hold</option>
                <option value="COMPLETED" className="text-black dark:text-white bg-white dark:bg-slate-900">Completed</option>
              </select>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[var(--color-border)]">
              <Button 
                variant="outline" 
                className="text-[var(--color-destructive)] border-[var(--color-destructive)] hover:bg-[var(--color-destructive)] hover:text-white"
                onClick={handleDeleteProject}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete Project
              </Button>
              <Button onClick={() => {setIsManageModalOpen(false); setManageProjectData(null);}}>Done</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
