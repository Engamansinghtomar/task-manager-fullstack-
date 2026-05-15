import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { Users as UsersIcon, Settings, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export function TeamList() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      setProjects(response.data.data);
    } catch (error) {
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (projectId, userId) => {
    try {
      await api.delete(`/projects/${projectId}/members/${userId}`);
      toast.success('Member removed successfully');
      
      // Update local state
      const updatedProjects = projects.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            members: p.members.filter(m => m.user.id !== userId)
          };
        }
        return p;
      });
      setProjects(updatedProjects);
      
      // Update modal state if open
      if (selectedProject?.id === projectId) {
        setSelectedProject({
          ...selectedProject,
          members: selectedProject.members.filter(m => m.user.id !== userId)
        });
      }
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading teams...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground mt-1">Manage project teams and members.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card 
            key={project.id} 
            className="shadow-sm hover:border-[var(--color-primary)] transition-colors cursor-pointer group"
            onClick={() => setSelectedProject(project)}
          >
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2 group-hover:text-[var(--color-primary)] transition-colors">
                  <UsersIcon className="h-5 w-5 text-primary" /> {project.name}
                </CardTitle>
                <CardDescription className="line-clamp-2">{project.description || 'No description'}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {project.members && project.members.slice(0, 5).map((member) => (
                    <img
                      key={member.user.id}
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.user.name)}&background=random`}
                      alt={member.user.name}
                      title={member.user.name}
                      className="h-8 w-8 rounded-full border-2 border-background bg-muted"
                    />
                  ))}
                  {project.members && project.members.length > 5 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium z-10">
                      +{project.members.length - 5}
                    </div>
                  )}
                  {(!project.members || project.members.length === 0) && (
                    <span className="text-sm text-[var(--color-text-muted)] italic">No members yet</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {project.members ? project.members.length : 0} members
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {projects.length === 0 && (
          <div className="col-span-full p-8 text-center border-2 border-dashed border-[var(--color-border)] rounded-lg text-[var(--color-text-muted)]">
            No teams/projects available yet.
          </div>
        )}
      </div>

      <Modal isOpen={!!selectedProject} onClose={() => setSelectedProject(null)} title={`Team: ${selectedProject?.name}`}>
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-muted)] mb-4">{selectedProject?.description}</p>
          
          <h4 className="font-semibold mb-2">Members ({selectedProject?.members?.length || 0})</h4>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
            {selectedProject && (
              <div key={`creator-${selectedProject.createdBy?.id}`} className="flex items-center justify-between p-3 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProject.createdBy?.name || 'Manager')}&background=random`} 
                    alt={selectedProject.createdBy?.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-[var(--color-text)]">{selectedProject.createdBy?.name}</p>
                      <span className="px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] font-bold tracking-wide uppercase">Manager</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">{selectedProject.createdBy?.email}</p>
                  </div>
                </div>
              </div>
            )}
            {selectedProject?.members?.length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)] italic">No other members in this team.</p>
            )}
            {selectedProject?.members?.map(member => (
              <div key={member.user.id} className="flex items-center justify-between p-3 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]">
                <div className="flex items-center gap-3">
                  <img 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.user.name)}&background=random`} 
                    alt={member.user.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-[var(--color-text)]">{member.user.name}</p>
                      <span className="px-2 py-0.5 rounded-full bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)] text-[10px] font-bold tracking-wide uppercase">Employee</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">{member.user.email}</p>
                  </div>
                </div>
                {user?.role === 'Manager' && member.user.id !== selectedProject.createdById && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveMember(selectedProject.id, member.user.id);
                    }}
                    title="Remove from project"
                  >
                    <Trash2 className="w-4 h-4 text-[var(--color-destructive)]" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end pt-4 mt-4 border-t border-[var(--color-border)]">
            <Button onClick={() => setSelectedProject(null)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
