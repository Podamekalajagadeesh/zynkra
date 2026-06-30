import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { api } from '../../lib/api';
import { useToast } from '../../hooks/useToast';

interface TodoItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  assignee?: {
    id: string;
    username: string;
    avatar?: string;
  };
  creator: {
    id: string;
    username: string;
    avatar?: string;
  };
}

interface GroupMember {
  id: string;
  username: string;
  avatar?: string;
}

interface GroupTodoListProps {
  groupId: string;
}

export function GroupTodoList({ groupId }: GroupTodoListProps) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    dueDate: '',
    assigneeId: '',
  });
  const { addToast } = useToast();

  useEffect(() => {
    loadTodos();
    loadMembers();
  }, [groupId]);

  const loadTodos = async () => {
    try {
      const response = await api.get(`/groups/${groupId}/todo-items`);
      setTodos(response.data);
    } catch (error) {
      addToast({ title: 'Error', description: 'Failed to load todo items', type: 'error' });
    }
  };

  const loadMembers = async () => {
    try {
      const response = await api.get(`/groups/${groupId}/members`);
      setMembers(response.data);
    } catch (error) {
      console.error('Failed to load group members');
    }
  };

  const handleCreateTodo = async () => {
    try {
      await api.post(`/groups/${groupId}/todo-items`, {
        ...newTodo,
        dueDate: newTodo.dueDate ? new Date(newTodo.dueDate).toISOString() : undefined,
      });
      setIsDialogOpen(false);
      setNewTodo({ title: '', description: '', dueDate: '', assigneeId: '' });
      loadTodos();
      addToast({ title: 'Success', description: 'Todo item created', type: 'success' });
    } catch (error) {
      addToast({ title: 'Error', description: 'Failed to create todo item', type: 'error' });
    }
  };

  const toggleTodoComplete = async (todo: TodoItem) => {
    try {
      await api.put(`/groups/todo-items/${todo.id}`, {
        completed: !todo.completed,
      });
      loadTodos();
    } catch (error) {
      addToast({ title: 'Error', description: 'Failed to update todo item', type: 'error' });
    }
  };

  const deleteTodo = async (todoId: string) => {
    try {
      await api.delete(`/groups/todo-items/${todoId}`);
      loadTodos();
      addToast({ title: 'Success', description: 'Todo item deleted', type: 'success' });
    } catch (error) {
      addToast({ title: 'Error', description: 'Failed to delete todo item', type: 'error' });
    }
  };

  const pendingTodos = todos.filter(todo => !todo.completed);
  const completedTodos = todos.filter(todo => todo.completed);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Group To-Do List</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Todo Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newTodo.title}
                  onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newTodo.description}
                  onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={newTodo.dueDate}
                    onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignee">Assign To</Label>
                  <Select value={newTodo.assigneeId} onValueChange={(value) => setNewTodo({ ...newTodo, assigneeId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map(member => (
                        <SelectItem key={member.id} value={member.id}>{member.username}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCreateTodo} className="w-full">Create Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Pending Tasks ({pendingTodos.length})</h4>
        {pendingTodos.map(todo => (
          <Card key={todo.id}>
            <CardHeader className="py-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={() => toggleTodoComplete(todo)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{todo.title}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => deleteTodo(todo.id)} className="h-8 px-2 text-destructive">
                      Delete
                    </Button>
                  </div>
                  {todo.description && <CardDescription className="text-xs">{todo.description}</CardDescription>}
                  <div className="flex gap-2 mt-1">
                    {todo.dueDate && (
                      <CardDescription className="text-xs">
                        📅 {format(new Date(todo.dueDate), 'MMM d, h:mm a')}
                      </CardDescription>
                    )}
                    {todo.assignee && (
                      <CardDescription className="text-xs">
                        👤 {todo.assignee.username}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {completedTodos.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Completed Tasks ({completedTodos.length})</h4>
          {completedTodos.map(todo => (
            <Card key={todo.id} className="opacity-60">
              <CardHeader className="py-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={() => toggleTodoComplete(todo)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium line-through">{todo.title}</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => deleteTodo(todo.id)} className="h-8 px-2 text-destructive">
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}