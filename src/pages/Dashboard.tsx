import React, { useState, useEffect } from 'react';
import { Bug, Plus, AlertTriangle, AlertCircle, CheckCircle2, Pencil, Trash2, Check, ArrowUpDown, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

type Priority = 'high' | 'medium' | 'low';
type Status = 'pending' | 'completed';
type SortField = 'priority' | 'date' | 'status';
type SortOrder = 'asc' | 'desc';

type Issue = {
  id: string;
  module: string;
  description: string;
  priority: Priority;
  status: Status;
  created_at: string;
};

export function Dashboard() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [newIssue, setNewIssue] = useState({
    module: '',
    description: '',
    priority: 'medium' as Priority
  });

  // Filtros
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');

  // Ordenação
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    fetchIssues();
  }, [filterPriority, filterStatus, sortField, sortOrder]);

  async function fetchIssues() {
    try {
      let query = supabase.from('issues').select('*');

      // Aplicar filtros
      if (filterPriority !== 'all') {
        query = query.eq('priority', filterPriority);
      }
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      // Aplicar ordenação
      switch (sortField) {
        case 'priority':
          query = query.order('priority', { ascending: sortOrder === 'asc' });
          break;
        case 'date':
          query = query.order('created_at', { ascending: sortOrder === 'asc' });
          break;
        case 'status':
          query = query.order('status', { ascending: sortOrder === 'asc' });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      toast.error('Erro ao carregar os problemas');
      console.error('Erro ao buscar issues:', error);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      if (!userId) {
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
            user_id: userId
          }]);

        if (error) throw error;
        toast.success('Problema criado com sucesso!');
      }

      setShowModal(false);
      setNewIssue({ module: '', description: '', priority: 'medium' });
      setEditingIssue(null);
      fetchIssues();
    } catch (error) {
      toast.error('Erro ao salvar o problema');
      console.error('Erro ao salvar:', error);
    }
  };

  const handleEdit = (issue: Issue) => {
    setEditingIssue(issue);
    setNewIssue({
      module: issue.module,
      description: issue.description,
      priority: issue.priority
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
      fetchIssues();
    } catch (error) {
      toast.error('Erro ao excluir o problema');
      console.error('Erro ao deletar:', error);
    }
  };

  const handleComplete = async (id: string, currentStatus: Status) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      const { error } = await supabase
        .from('issues')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Problema marcado como ${newStatus === 'completed' ? 'concluído' : 'pendente'}!`);
      fetchIssues();
    } catch (error) {
      toast.error('Erro ao atualizar o status');
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
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

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Bug className="w-10 h-10 text-indigo-500" />
            <h1 className="text-3xl font-bold text-white logo-text">nexo-fix</h1>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setEditingIssue(null);
                setNewIssue({ module: '', description: '', priority: 'medium' });
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Novo Problema
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Prioridade</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as Priority | 'all')}
                className="bg-gray-700 text-white rounded-lg px-3 py-2"
              >
                <option value="all">Todas</option>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as Status | 'all')}
                className="bg-gray-700 text-white rounded-lg px-3 py-2"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendente</option>
                <option value="completed">Concluído</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid de Issues */}
        <div className="grid gap-4">
          {/* Cabeçalho */}
          <div className="grid grid-cols-[1fr,2fr,100px,100px] gap-4 bg-gray-800 p-4 rounded-lg">
            <div>Módulo</div>
            <div>Descrição</div>
            <button
              onClick={() => handleSort('priority')}
              className="flex items-center gap-2 hover:text-indigo-400"
            >
              Prioridade
              <ArrowUpDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSort('status')}
              className="flex items-center gap-2 hover:text-indigo-400"
            >
              Status
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* Issues */}
          {issues.map((issue) => (
            <div
              key={issue.id}
              className={`grid grid-cols-[1fr,2fr,100px,100px] gap-4 bg-gray-800 p-4 rounded-lg items-center ${
                issue.status === 'completed' ? 'opacity-50' : ''
              }`}
            >
              <div>{issue.module}</div>
              <div>{issue.description}</div>
              <div className={`flex items-center gap-2 ${getPriorityColor(issue.priority)}`}>
                {getPriorityIcon(issue.priority)}
                {issue.priority === 'high' ? 'Alta' : issue.priority === 'medium' ? 'Média' : 'Baixa'}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleComplete(issue.id, issue.status)}
                  className={`p-1 rounded-lg transition-colors ${
                    issue.status === 'completed'
                      ? 'bg-green-500/20 text-green-500'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                  title={issue.status === 'completed' ? 'Marcar como pendente' : 'Marcar como concluído'}
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit(issue)}
                  className="p-1 rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(issue.id)}
                  className="p-1 rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal de Criação/Edição */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {editingIssue ? 'Editar Problema' : 'Novo Problema'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Módulo</label>
                  <input
                    type="text"
                    value={newIssue.module}
                    onChange={(e) => setNewIssue({ ...newIssue, module: e.target.value })}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2"
                    required
                  />
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
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                  >
                    {editingIssue ? 'Salvar' : 'Criar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingIssue(null);
                      setNewIssue({ module: '', description: '', priority: 'medium' });
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
      </div>
    </div>
  );
}