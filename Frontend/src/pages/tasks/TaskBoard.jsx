import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Label } from '../../components/common/Label';
import { Plus, MoreHorizontal, Calendar, MessageSquare, AlertCircle, Edit, Trash2, Filter } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const formatBoardData = (tasksFromApi) => {
  const data = {
    columns: {
      'TODO': { id: 'TODO', title: 'To Do', taskIds: [] },
      'IN_PROGRESS': { id: 'IN_PROGRESS', title: 'In Progress', taskIds: [] },
      'COMPLETED': { id: 'COMPLETED', title: 'Completed', taskIds: [] },
    },
    tasks: {},
    columnOrder: ['TODO', 'IN_PROGRESS', 'COMPLETED'],
  };

  tasksFromApi.forEach(task => {
    data.tasks[task.id.toString()] = {
      id: task.id.toString(),
      content: task.title,
      description: task.description,
      priority: task.priority || 'MEDIUM',
      comments: 0,
      date: format(new Date(task.dueDate || new Date()), 'MMM dd'),
      fullDate: task.dueDate,
      createdAt: task.createdAt,
      assigneeName: task.assignedTo?.name || 'Unknown',
      assigneeId: task.assignedToId,
      projectName: task.project?.name || 'Unknown',
      projectId: task.projectId,
      status: task.status
    };
    if (data.columns[task.status]) {
      data.columns[task.status].taskIds.push(task.id.toString());
    } else {
      data.columns['TODO'].taskIds.push(task.id.toString());
    }
  });

  return data;
};

const PriorityBadge = ({ priority }) => {
  const variants = {
    HIGH: 'destructive',
    MEDIUM: 'warning',
    LOW: 'info',
  };
  return <Badge variant={variants[priority] || 'default'} className="text-[10px] py-0">{priority}</Badge>;
};

export function TaskBoard() {
  const { user } = useAuth();
  const [rawTasks, setRawTasks] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filtering
  const [filterProject, setFilterProject] = useState('ALL');
  const [filterAssignee, setFilterAssignee] = useState('ALL');

  // Projects and Users for Manager Add Task Form and Filters
  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // New Task Form State
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '', projectId: '', assignedToId: '', priority: 'MEDIUM' });

  // Manager Edit Task State
  const [editTaskData, setEditTaskData] = useState({ description: '', dueDate: '', priority: 'MEDIUM' });
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    fetchTasks();
    if (user?.role === 'Manager') {
      fetchProjects();
      fetchUsers();
    }
  }, [user]);

  useEffect(() => {
    if (rawTasks.length > 0) {
      let filtered = rawTasks;
      if (filterProject !== 'ALL') {
        filtered = filtered.filter(t => t.projectId === Number(filterProject));
      }
      if (filterAssignee !== 'ALL') {
        filtered = filtered.filter(t => t.assignedToId === Number(filterAssignee));
      }
      setData(formatBoardData(filtered));
    } else {
      setData(formatBoardData([]));
    }
  }, [rawTasks, filterProject, filterAssignee]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tasks');
      setRawTasks(response.data.data);
    } catch (error) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.data);
    } catch (error) {
      console.error('Failed to fetch projects');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setAllUsers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch users');
    }
  };

  const onDragEnd = async (result) => {
    if (user?.role === 'Manager') {
      toast.error('Managers cannot update task status via drag and drop');
      return;
    }

    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const startColumn = data.columns[source.droppableId];
    const finishColumn = data.columns[destination.droppableId];

    if (startColumn === finishColumn) {
      const newTaskIds = Array.from(startColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = { ...startColumn, taskIds: newTaskIds };
      setData({ ...data, columns: { ...data.columns, [newColumn.id]: newColumn } });
      return;
    }

    const startTaskIds = Array.from(startColumn.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStart = { ...startColumn, taskIds: startTaskIds };

    const finishTaskIds = Array.from(finishColumn.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinish = { ...finishColumn, taskIds: finishTaskIds };

    setData({
      ...data,
      columns: { ...data.columns, [newStart.id]: newStart, [newFinish.id]: newFinish },
    });

    try {
      await api.patch(`/tasks/${draggableId}/status`, { status: finishColumn.id });
      toast.success('Task status updated');
      // Update raw tasks in background so filters keep working
      const updatedRaw = rawTasks.map(t => t.id === Number(draggableId) ? { ...t, status: finishColumn.id } : t);
      setRawTasks(updatedRaw);
    } catch (error) {
      toast.error('Failed to update task status');
      fetchTasks();
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.dueDate || !newTask.projectId || !newTask.assignedToId) {
      return toast.error('All fields are required');
    }
    
    try {
      await api.post('/tasks', {
        ...newTask,
        projectId: Number(newTask.projectId),
        assignedToId: Number(newTask.assignedToId),
        dueDate: new Date(newTask.dueDate).toISOString()
      });
      setIsModalOpen(false);
      setNewTask({ title: '', description: '', dueDate: '', projectId: '', assignedToId: '', priority: 'MEDIUM' });
      toast.success('Task created successfully');
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create task');
    }
  };

  const handleUpdateStatusFromModal = async (e) => {
    const newStatus = e.target.value;
    try {
      await api.patch(`/tasks/${selectedTask.id}/status`, { status: newStatus });
      toast.success('Status updated');
      setSelectedTask({ ...selectedTask, status: newStatus });
      fetchTasks();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this task?')) return;
    try {
      await api.delete(`/tasks/${selectedTask.id}`);
      toast.success('Task deleted successfully');
      setSelectedTask(null);
      fetchTasks();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleSaveEditTask = async () => {
    try {
      await api.put(`/tasks/${selectedTask.id}`, {
        description: editTaskData.description,
        dueDate: new Date(editTaskData.dueDate).toISOString(),
        priority: editTaskData.priority
      });
      toast.success('Task updated successfully');
      setIsEditMode(false);
      setSelectedTask(null);
      fetchTasks();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const openTaskModal = (task) => {
    setSelectedTask(task);
    setIsEditMode(false);
    setEditTaskData({
      description: task.description || '',
      dueDate: new Date(task.fullDate).toISOString().split('T')[0],
      priority: task.priority || 'MEDIUM'
    });
  };

  const selectedProjectObj = projects.find(p => p.id === Number(newTask.projectId));
  const availableMembers = selectedProjectObj ? selectedProjectObj.members : [];

  if (loading || !data) return <div className="p-8 text-center text-muted-foreground">Loading board...</div>;

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Board</h1>
          <p className="text-muted-foreground mt-1">Manage tasks using Kanban view.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Filters */}
          <div className="flex items-center gap-2 bg-[var(--color-bg)] border border-[var(--color-border)] px-3 py-1.5 rounded-md">
            <Filter className="w-4 h-4 text-[var(--color-text-muted)]" />
            <select
              className="bg-transparent text-sm text-[var(--color-text)] focus:outline-none"
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
            >
              <option value="ALL" className="text-black dark:text-white bg-white dark:bg-slate-900">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id} className="text-black dark:text-white bg-white dark:bg-slate-900">{p.name}</option>
              ))}
            </select>
          </div>
          {user?.role === 'Manager' && (
            <div className="flex items-center gap-2 bg-[var(--color-bg)] border border-[var(--color-border)] px-3 py-1.5 rounded-md">
              <Filter className="w-4 h-4 text-[var(--color-text-muted)]" />
              <select
                className="bg-transparent text-sm text-[var(--color-text)] focus:outline-none"
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
              >
                <option value="ALL" className="text-black dark:text-white bg-white dark:bg-slate-900">All Assignees</option>
                {allUsers.map(u => (
                  <option key={u.id} value={u.id} className="text-black dark:text-white bg-white dark:bg-slate-900">{u.name}</option>
                ))}
              </select>
            </div>
          )}

          {user?.role === 'Manager' && (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Task
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 h-full items-start">
            {data.columnOrder.map((columnId) => {
              const column = data.columns[columnId];
              const tasks = column.taskIds.map((taskId) => data.tasks[taskId]);

              return (
                <div key={column.id} className="w-[350px] shrink-0 flex flex-col max-h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{column.title} <span className="text-muted-foreground font-normal ml-2">{tasks.length}</span></h3>
                    <button className="text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <Droppable droppableId={column.id} isDropDisabled={user?.role === 'Manager'}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 rounded-xl p-3 min-h-[150px] transition-colors ${
                          snapshot.isDraggingOver ? 'bg-secondary/50 border-dashed border-2 border-primary/50' : 'bg-muted/30 border-2 border-transparent'
                        }`}
                      >
                        {tasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={user?.role === 'Manager'}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => openTaskModal(task)}
                                className={`mb-3 rounded-lg border bg-[var(--color-card)] p-4 shadow-sm transition-all cursor-pointer hover:border-[var(--color-primary)] ${
                                  snapshot.isDragging ? 'shadow-lg ring-2 ring-primary scale-[1.02]' : 'hover:shadow-md'
                                }`}
                                style={{ ...provided.draggableProps.style }}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <Badge variant="outline" className="text-xs bg-[var(--color-bg)]">
                                    {task.projectName}
                                  </Badge>
                                  <PriorityBadge priority={task.priority} />
                                </div>
                                <p className="text-sm font-medium mb-4 text-[var(--color-text)]">{task.content}</p>
                                <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                                  <div className="flex items-center gap-3">
                                    <span className={`flex items-center gap-1 ${new Date(task.fullDate) < new Date() && task.status !== 'COMPLETED' ? 'text-[var(--color-destructive)] font-bold' : ''}`}>
                                      <Calendar className="h-3 w-3"/> {task.date}
                                    </span>
                                  </div>
                                  <img 
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(task.assigneeName)}&background=random`} 
                                    alt="Assignee" 
                                    title={`Assigned to: ${task.assigneeName}`}
                                    className="h-6 w-6 rounded-full border border-[var(--color-border)]" 
                                  />
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Create Task Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Task">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectId">Project</Label>
            <select
              id="projectId"
              className="w-full h-10 px-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              value={newTask.projectId}
              onChange={(e) => setNewTask({...newTask, projectId: e.target.value, assignedToId: ''})}
              required
            >
              <option value="" disabled className="text-black dark:text-white bg-white dark:bg-slate-900">Select a Project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id} className="text-black dark:text-white bg-white dark:bg-slate-900">{p.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input 
              id="title" 
              placeholder="e.g. Design API" 
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input 
              id="description" 
              placeholder="Task details" 
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignedToId">Assign To</Label>
              <select
                id="assignedToId"
                className="w-full h-10 px-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50"
                value={newTask.assignedToId}
                onChange={(e) => setNewTask({...newTask, assignedToId: e.target.value})}
                required
                disabled={!newTask.projectId}
              >
                <option value="" disabled className="text-black dark:text-white bg-white dark:bg-slate-900">Select an Employee</option>
                {availableMembers.map(m => (
                  <option key={m.user.id} value={m.user.id} className="text-black dark:text-white bg-white dark:bg-slate-900">{m.user.name}</option>
                ))}
              </select>
              {!newTask.projectId && <p className="text-[10px] text-[var(--color-warning)] mt-1"><AlertCircle className="w-3 h-3 inline mr-1"/>Select project first</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                className="w-full h-10 px-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                value={newTask.priority}
                onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
              >
                <option value="LOW" className="text-black dark:text-white bg-white dark:bg-slate-900">Low</option>
                <option value="MEDIUM" className="text-black dark:text-white bg-white dark:bg-slate-900">Medium</option>
                <option value="HIGH" className="text-black dark:text-white bg-white dark:bg-slate-900">High</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input 
              id="dueDate" 
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Task</Button>
          </div>
        </form>
      </Modal>

      {/* Task Details / Edit Modal */}
      {selectedTask && (
        <Modal isOpen={!!selectedTask} onClose={() => { setSelectedTask(null); setIsEditMode(false); }} title={isEditMode ? "Edit Task" : "Task Details"}>
          <div className="space-y-6">
            {!isEditMode ? (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">{selectedTask.content}</h3>
                    <div className="flex gap-2 items-center mb-4">
                      <Badge variant="outline">{selectedTask.projectName}</Badge>
                      <PriorityBadge priority={selectedTask.priority} />
                    </div>
                  </div>
                  {user?.role === 'Manager' && (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setIsEditMode(true)} title="Edit Task">
                        <Edit className="w-4 h-4 text-[var(--color-primary)]" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={handleDeleteTask} title="Delete Task">
                        <Trash2 className="w-4 h-4 text-[var(--color-destructive)]" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-[var(--color-text-muted)] text-sm bg-[var(--color-bg)] p-3 rounded-md border border-[var(--color-border)] min-h-[60px]">
                  {selectedTask.description || 'No description provided.'}
                </p>
                
                <div className="grid grid-cols-2 gap-4 border-y border-[var(--color-border)] py-4">
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Assignee</p>
                    <div className="flex items-center gap-2">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedTask.assigneeName)}&background=random`} 
                        alt={selectedTask.assigneeName} 
                        className="h-6 w-6 rounded-full border border-[var(--color-border)]"
                      />
                      <span className="text-sm font-medium">{selectedTask.assigneeName}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Due Date</p>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" />
                      <span className={new Date(selectedTask.fullDate) < new Date() && selectedTask.status !== 'COMPLETED' ? 'text-[var(--color-destructive)]' : ''}>
                        {format(new Date(selectedTask.fullDate), 'PPP')}
                      </span>
                    </div>
                  </div>
                </div>

                {user?.role === 'User' && (
                  <div className="space-y-2">
                    <Label>Update Status</Label>
                    <select
                      className="w-full h-10 px-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      value={selectedTask.status}
                      onChange={handleUpdateStatusFromModal}
                    >
                      <option value="TODO" className="text-black dark:text-white bg-white dark:bg-slate-900">To Do</option>
                      <option value="IN_PROGRESS" className="text-black dark:text-white bg-white dark:bg-slate-900">In Progress</option>
                      <option value="COMPLETED" className="text-black dark:text-white bg-white dark:bg-slate-900">Completed</option>
                    </select>
                  </div>
                )}
                {user?.role === 'Manager' && (
                   <div className="space-y-2">
                     <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Current Status</p>
                     <Badge variant="secondary">{selectedTask.status.replace('_', ' ')}</Badge>
                   </div>
                )}
              </>
            ) : (
              /* Edit Mode for Manager */
              <div className="space-y-4">
                 <div className="space-y-2">
                  <Label>Description</Label>
                  <textarea 
                    className="w-full p-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    rows="3"
                    value={editTaskData.description}
                    onChange={(e) => setEditTaskData({...editTaskData, description: e.target.value})}
                  />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input 
                      type="date"
                      value={editTaskData.dueDate}
                      onChange={(e) => setEditTaskData({...editTaskData, dueDate: e.target.value})}
                      required
                    />
                   </div>
                   <div className="space-y-2">
                    <Label>Priority</Label>
                    <select
                      className="w-full h-10 px-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      value={editTaskData.priority}
                      onChange={(e) => setEditTaskData({...editTaskData, priority: e.target.value})}
                    >
                      <option value="LOW" className="text-black dark:text-white bg-white dark:bg-slate-900">Low</option>
                      <option value="MEDIUM" className="text-black dark:text-white bg-white dark:bg-slate-900">Medium</option>
                      <option value="HIGH" className="text-black dark:text-white bg-white dark:bg-slate-900">High</option>
                    </select>
                   </div>
                 </div>
                 <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
                  <Button variant="outline" onClick={() => setIsEditMode(false)}>Cancel Edit</Button>
                  <Button onClick={handleSaveEditTask}>Save Changes</Button>
                 </div>
              </div>
            )}
            
            {!isEditMode && (
              <div className="flex justify-end pt-2">
                <Button onClick={() => setSelectedTask(null)}>Close</Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
