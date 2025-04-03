import React, { useState, useEffect } from 'react';
import { Bug, Plus, AlertTriangle, AlertCircle, CheckCircle2, Pencil, Trash2, ChevronRight, ChevronLeft, LogOut, Inbox, X, GripVertical, ChevronDown, History } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

type Priority = 'high' | 'medium' | 'low';
type Status = 'pending' | 'in_progress' | 'completed';
type IssueType = 'problem' | 'bug' | 'feature';

interface System {
  id: string;
  name: string;
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
}

interface IssueHistory {
  id: string;
  issue_id: string;
  status: Status;
  changed_at: string;
  changed_by: string;
  profiles?: Profile;
}

type Issue = {
  id: string;
  module: string;
  description: string;
  priority: Priority;
  status: Status;
  type: IssueType;
  created_at: string;
  updated_at?: string;
  user_id: string;
  profiles?: Profile;
  history?: IssueHistory[];
};

type Column = {
  id: Status;
  title: string;
};

const columns: Column[] = [
  { id: 'pending', title: 'Pendentes' },
  { id: 'in_progress', title: 'Corrigindo' },
  { id: 'completed', title: 'Corrigidos' }
];

const statusTransitions = {
  next: {
    pending: 'in_progress',
    in_progress: 'completed',
    completed: 'pending'
  },
  prev: {
    pending: 'completed',
    in_progress: 'pending',
    completed: 'in_progress'
  }
} as const;

export function Dashboard() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showDescriptionModal, setShowDescriptionModal] = useState<Issue | null>(null);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [newIssue, setNewIssue] = useState({
    module: '',
    description: '',
    priority: 'medium' as Priority,
    type: 'problem' as IssueType
  });
  const [userFullName, setUserFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState<Issue | null>(null);

  useEffect(() => {
    fetchSystems();
    getCurrentUser();
    fetchIssues();
  }, []);

  async function getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        
        if (profile?.full_name) {
          setUserFullName(profile.full_name);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
    }
  }

  async function fetchSystems() {
    try {
      const { data, error } = await supabase
        .from('systems')
        .select('*')
        .order('name');

      if (error) throw error;
      setSystems(data || []);
    } catch (error) {
      console.error('Erro ao buscar sistemas:', error);
    }
  }

  async function fetchIssues() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('issues')
        .select(`
          *,
          profiles!inner (
            id,
            full_name,
            email
          ),
          history:issue_history (
            id,
            status,
            changed_at,
            changed_by,
            profiles (
              full_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      console.error('Erro ao buscar issues:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        toast.error('Usuário não autenticado');
        return;
      }

      if (editingIssue) {
        const { error } = await supabase
          .from('issues')
          .update({
            module: newIssue.module,
            description: newIssue.description,
            priority: newIssue.priority,
            type: newIssue.type,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingIssue.id);

        if (error) throw error;
        toast.success('Problema atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('issues')
          .insert([{
            module: newIssue.module,
            description: newIssue.description,
            priority: newIssue.priority,
            type: newIssue.type,
            status: 'pending',
            user_id: user.id
          }]);

        if (error) throw error;
        toast.success('Problema criado com sucesso!');
      }

      setShowModal(false);
      setNewIssue({ module: '', description: '', priority: 'medium', type: 'problem' });
      setEditingIssue(null);
      fetchIssues();
    } catch (error) {
      toast.error('Erro ao salvar o problema');
      console.error('Erro ao salvar:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (issue: Issue) => {
    setEditingIssue(issue);
    setNewIssue({
      module: issue.module,
      description: issue.description,
      priority: issue.priority,
      type: issue.type
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('issues')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Problema excluído com sucesso!');
      setShowDeleteModal(null);
      fetchIssues();
    } catch (error) {
      toast.error('Erro ao excluir o problema');
      console.error('Erro ao deletar:', error);
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = async (result: DropResult) => {
    setIsDragging(false);
    
    if (!result.destination) return;

    const { draggableId, source, destination } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId as Status;

    try {
      const { error } = await supabase
        .from('issues')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', draggableId);

      if (error) throw error;
      
      // Immediately update local state
      setIssues(prevIssues => 
        prevIssues.map(issue => 
          issue.id === draggableId ? { ...issue, status: newStatus } : issue
        )
      );
      
      // Fetch fresh data to get updated history
      await fetchIssues();
      
      toast.success('Status atualizado com sucesso!');
    } catch (error) {
      // Revert local state on error
      setIssues(prevIssues => 
        prevIssues.map(issue => 
          issue.id === draggableId ? { ...issue, status: source.droppableId as Status } : issue
        )
      );
      toast.error('Erro ao atualizar o status');
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleStatusChange = async (issue: Issue, direction: 'next' | 'prev') => {
    const newStatus = direction === 'next' 
      ? statusTransitions.next[issue.status]
      : statusTransitions.prev[issue.status];

    try {
      const { error } = await supabase
        .from('issues')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', issue.id);

      if (error) throw error;

      // Immediately update local state
      setIssues(prevIssues => 
        prevIssues.map(i => 
          i.id === issue.id ? { ...i, status: newStatus } : i
        )
      );

      // Fetch fresh data to get updated history
      await fetchIssues();

      toast.success('Status atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar o status');
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer logout');
      console.error('Erro ao fazer logout:', error);
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-5 h-5" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5" />;
      case 'low':
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: IssueType) => {
    switch (type) {
      case 'problem':
        return 'Problema';
      case 'bug':
        return 'Bug';
      case 'feature':
        return 'Nova Funcionalidade';
      default:
        return type;
    }
  };

  const getStatusLabel = (status: Status) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'in_progress':
        return 'Em Andamento';
      case 'completed':
        return 'Concluído';
      default:
        return status;
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    try {
      if (!dateTimeString) return 'Data não disponível';
      
      // Criar um objeto Date com o fuso horário de São Paulo
      const date = new Date(dateTimeString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/Sao_Paulo'
      }).format(date);
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Bug className="w-10 h-10 text-indigo-500" />
              <h1 className="text-3xl font-bold text-white logo-text">nexo-fix</h1>
            </div>
            <span className="text-gray-400">|</span>
            <span className="text-gray-300">Olá, {userFullName}</span>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <button
                onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Adicionar
                <ChevronDown className="w-4 h-4" />
              </button>
              {showTypeDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-1 z-50">
                  <button
                    onClick={() => {
                      setEditingIssue(null);
                      setNewIssue({ ...newIssue, type: 'problem' });
                      setShowModal(true);
                      setShowTypeDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white"
                  >
                    Problema
                  </button>
                  <button
                    onClick={() => {
                      setEditingIssue(null);
                      setNewIssue({ ...newIssue, type: 'bug' });
                      setShowModal(true);
                      setShowTypeDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white"
                  >
                    Bug
                  </button>
                  <button
                    onClick={() => {
                      setEditingIssue(null);
                      setNewIssue({ ...newIssue, type: 'feature' });
                      setShowModal(true);
                      setShowTypeDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white"
                  >
                    Nova Funcionalidade
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Carregando problemas...</p>
          </div>
        )}

        {!loading && issues.length === 0 && (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <Inbox className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-300 mb-2">Nenhum problema encontrado</h3>
            <p className="text-gray-400 mb-6">Comece criando um novo problema clicando no botão acima.</p>
            <button
              onClick={() => {
                setEditingIssue(null);
                setNewIssue({ module: '', description: '', priority: 'medium', type: 'problem' });
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Criar Problema
            </button>
          </div>
        )}

        {!loading && issues.length > 0 && (
          <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-3 gap-6">
              {columns.map(column => (
                <div 
                  key={column.id} 
                  className={`bg-gray-800 rounded-lg p-4 transition-colors ${
                    isDragging ? 'ring-2 ring-indigo-500/50' : ''
                  }`}
                >
                  <h2 className="text-lg font-semibold mb-4">{column.title}</h2>
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-4 min-h-[200px] rounded-lg transition-colors ${
                          snapshot.isDraggingOver ? 'bg-gray-700/50' : ''
                        }`}
                      >
                        {issues
                          .filter(issue => issue.status === column.id)
                          .map((issue, index) => (
                            <Draggable
                              key={issue.id}
                              draggableId={issue.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`bg-gray-700 rounded-lg p-4 shadow-sm transition-transform relative group ${
                                    snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-500' : ''
                                  }`}
                                >
                                  <div
                                    {...provided.dragHandleProps}
                                    className="absolute -top-3 -right-3 p-2 rounded-lg bg-gray-600 text-gray-400 hover:bg-gray-500 transition-colors cursor-grab active:cursor-grabbing z-10"
                                    title="Arrastar"
                                  >
                                    <GripVertical className="w-4 h-4" />
                                  </div>

                                  <div className="flex justify-between items-start mb-3 mt-2">
                                    <div className="font-medium">{issue.module}</div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => setShowHistoryModal(issue)}
                                        className="p-1 rounded-lg bg-gray-600 text-gray-400 hover:bg-gray-500"
                                        title="Histórico"
                                      >
                                        <History className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleEdit(issue)}
                                        className="p-1 rounded-lg bg-gray-600 text-gray-400 hover:bg-gray-500"
                                        title="Editar"
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => setShowDeleteModal(issue.id)}
                                        className="p-1 rounded-lg bg-gray-600 text-gray-400 hover:bg-gray-500"
                                        title="Excluir"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleStatusChange(issue, 'prev')}
                                        className={`p-1 rounded-lg ${
                                          issue.status === 'pending'
                                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                            : 'bg-gray-600 text-gray-400 hover:bg-gray-500'
                                        }`}
                                        title="Status anterior"
                                        disabled={issue.status === 'pending'}
                                      >
                                        <ChevronLeft className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleStatusChange(issue, 'next')}
                                        className={`p-1 rounded-lg ${
                                          issue.status === 'completed'
                                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                            : 'bg-gray-600 text-gray-400 hover:bg-gray-500'
                                        }`}
                                        title="Próximo status"
                                        disabled={issue.status === 'completed'}
                                      >
                                        <ChevronRight className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  <div
                                    onClick={() => setShowDescriptionModal(issue)}
                                    className="text-gray-300 text-sm mb-3 line-clamp-2 cursor-pointer hover:text-gray-200"
                                  >
                                    {issue.description}
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between text-sm">
                                      <div className="flex items-center gap-4">
                                        <div className={`flex items-center gap-1 ${getPriorityColor(issue.priority)}`}>
                                          {getPriorityIcon(issue.priority)}
                                          <span>
                                            {issue.priority === 'high' ? 'Alta' : issue.priority === 'medium' ? 'Média' : 'Baixa'}
                                          </span>
                                        </div>
                                        <div className="text-gray-400">{getTypeLabel(issue.type)}</div>
                                      </div>
                                      <div className="text-gray-400">{issue.profiles?.full_name}</div>
                                    </div>
                                    <div className="text-xs text-gray-500 italic">
                                      Atualizado em: {formatDateTime(issue.updated_at || issue.created_at)}
                                    </div>
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
              ))}
            </div>
          </DragDropContext>
        )}

        {showModal && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingIssue(null);
                  setNewIssue({ module: '', description: '', priority: 'medium', type: 'problem' });
                }}
                className="absolute top-4 right-4 p-1 rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-xl font-bold mb-4">
                {editingIssue ? 'Editar' : 'Novo'} {getTypeLabel(newIssue.type)}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Sistema</label>
                  <select
                    value={newIssue.module}
                    onChange={(e) => setNewIssue({ ...newIssue, module: e.target.value })}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2"
                    required
                  >
                    <option value="">Selecione um sistema</option>
                    {systems.map((system) => (
                      <option key={system.id} value={system.name}>
                        {system.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <textarea
                    value={newIssue.description}
                    onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2"
                    rows={3}
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Prioridade</label>
                  <select
                    value={newIssue.priority}
                    onChange={(e) => setNewIssue({ ...newIssue, priority: e.target.value as Priority })}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2"
                  >
                    <option value="high">Alta</option>
                    <option value="medium">Média</option>
                    <option value="low">Baixa</option>
                  </select>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed relative"
                  >
                    {isCreating ? (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        </div>
                        <span className="opacity-0">{editingIssue ? 'Salvar' : 'Criar'}</span>
                      </>
                    ) : (
                      editingIssue ? 'Salvar' : 'Criar'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingIssue(null);
                      setNewIssue({ module: '', description: '', priority: 'medium', type: 'problem' });
                    }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Confirmar Exclusão</h2>
              <p className="text-gray-300 mb-6">
                Tem certeza que deseja excluir este problema? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleDelete(showDeleteModal)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                >
                  Excluir
                </button>
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {showDescriptionModal && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div 
              className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold mb-1">{showDescriptionModal.module}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{showDescriptionModal.profiles?.full_name}</span>
                    <div className={`flex items-center gap-1 ${getPriorityColor(showDescriptionModal.priority)}`}>
                      {getPriorityIcon(showDescriptionModal.priority)}
                      <span>
                        {showDescriptionModal.priority === 'high' ? 'Alta' : showDescriptionModal.priority === 'medium' ? 'Média' : 'Baixa'}
                      </span>
                    </div>
                    <span>{getTypeLabel(showDescriptionModal.type)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowDescriptionModal(null)}
                  className="p-1 rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <p className="text-gray-300 whitespace-pre-wrap">{showDescriptionModal.description}</p>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowDescriptionModal(null);
                    handleEdit(showDescriptionModal);
                  }}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => setShowDescriptionModal(null)}
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  <X className="w-4 h-4" />
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {showHistoryModal && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div 
              className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold mb-1">Histórico de Alterações</h2>
                  <p className="text-gray-400">{showHistoryModal.module}</p>
                </div>
                <button
                  onClick={() => setShowHistoryModal(null)}
                  className="p-1 rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <div className="space-y-4">
                  {showHistoryModal.history?.sort((a, b) => 
                    new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
                  ).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Status alterado para:</span>
                        <span className="font-medium text-white">{getStatusLabel(entry.status)}</span>
                      </div>
                      <div className="text-gray-500">
                        {formatDateTime(entry.changed_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowHistoryModal(null)}
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  <X className="w-4 h-4" />
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}