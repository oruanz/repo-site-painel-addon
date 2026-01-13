import { useState } from 'react';
import { Trash2, Copy, ExternalLink, Key, Eye, EyeOff, Save, Plus, RefreshCw } from 'lucide-react'; // Adicionado RefreshCw

interface Config {
  id: number;
  code: string;
  debrid_token: string;
  created_at: string;
}

interface ConfigListProps {
  configs: Config[];
  onDelete: (id: number) => void;
  onUpdate: (id: number, token: string) => void;
  onCreate: (token: string) => void;
  onRefresh: () => void; // Nova prop para atualizar a lista
}

export default function ConfigList({ configs, onDelete, onUpdate, onCreate, onRefresh }: ConfigListProps) {
  const [showToken, setShowToken] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  
  const [isCreating, setIsCreating] = useState(false);
  const [newToken, setNewToken] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false); // Estado para animação de loading

const getInstallLink = (code: string) => {
    // Defina a URL da sua API aqui (ou puxe de uma variável de ambiente como import.meta.env.VITE_API_URL)
    const apiBaseUrl = 'https://apimapyngua.mapyngua.com.br';
    
    // Retorna: https://apimapyngua.mapyngua.com.br/manifest.json?setupCode=XXXX
    return `${apiBaseUrl}/manifest.json?setupCode=${code}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado para a área de transferência!');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToken.trim()) return;
    onCreate(newToken);
    setNewToken('');
    setIsCreating(false);
  };

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    onRefresh();
    // Remove a animação após 1 segundo para dar feedback visual
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header da Seção */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Gerenciar Setup Codes</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Códigos de acesso vinculados a tokens RealDebrid</p>
        </div>
        
        <div className="flex gap-2">
            {/* Botão de Refresh */}
            <button 
              onClick={handleRefreshClick}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 p-2.5 rounded-xl transition-colors shadow-sm"
              title="Atualizar Lista"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Botão Novo Código */}
            <button 
              onClick={() => setIsCreating(!isCreating)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-900/20 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" /> Novo Código
            </button>
        </div>
      </div>

      {/* Formulário de Criação */}
      {isCreating && (
        <form onSubmit={handleCreate} className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800 animate-in fade-in slide-in-from-top-4">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">Token do RealDebrid / Serviço</label>
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <div className="flex-1 w-full">
                <input 
                type="text" 
                value={newToken}
                onChange={(e) => setNewToken(e.target.value)}
                placeholder="Cole o token API aqui..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 ml-1">
                    Pegue sua API Key em: <a href="https://real-debrid.com/apitoken" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">https://real-debrid.com/apitoken</a>
                </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-900/20 transition-colors h-[50px] flex items-center">Salvar</button>
                <button type="button" onClick={() => setIsCreating(false)} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-3 rounded-xl font-bold transition-colors h-[50px] flex items-center">Cancelar</button>
            </div>
          </div>
        </form>
      )}

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {configs.map((config) => (
          <div key={config.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-300 dark:hover:border-blue-500 transition-all group">
            
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-mono font-bold text-lg">
                  {config.code.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-slate-800 dark:text-white tracking-wider">{config.code}</span>
                    <button onClick={() => copyToClipboard(config.code)} className="text-slate-400 hover:text-blue-500 transition-colors p-1 rounded"><Copy className="w-3 h-3" /></button>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Criado em: {new Date(config.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex gap-1">
                <button 
                  onClick={() => onDelete(config.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Apagar Código"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Token Field */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 mb-4 border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Token Vinculado</span>
                {editingId === config.id ? (
                   <button onClick={() => { onUpdate(config.id, editValue); setEditingId(null); }} className="text-xs font-bold text-green-600 hover:underline flex items-center gap-1"><Save className="w-3 h-3"/> Salvar</button>
                ) : (
                   <button onClick={() => { setEditingId(config.id); setEditValue(config.debrid_token); }} className="text-xs font-bold text-blue-600 hover:underline">Editar</button>
                )}
              </div>
              
              {editingId === config.id ? (
                 <div className="animate-in fade-in duration-200">
                    <input 
                        type="text" 
                        value={editValue} 
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm font-mono dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 ml-0.5">
                        Pegue sua API Key em: <a href="https://real-debrid.com/apitoken" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-bold">https://real-debrid.com/apitoken</a>
                    </p>
                 </div>
              ) : (
                <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-xs text-slate-600 dark:text-slate-300 truncate select-all">
                      {showToken === config.id ? config.debrid_token : '•'.repeat(Math.min(config.debrid_token.length, 24))}
                    </code>
                    <button onClick={() => setShowToken(showToken === config.id ? null : config.id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                        {showToken === config.id ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                    </button>
                </div>
              )}
            </div>

            {/* Install Link Action */}
            <button 
              onClick={() => copyToClipboard(getInstallLink(config.code))}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 border border-dashed border-slate-300 dark:border-slate-600 group-hover:border-blue-300 dark:group-hover:border-blue-500"
            >
              <ExternalLink className="w-4 h-4" /> Copiar Link de Instalação
            </button>

          </div>
        ))}
      </div>
      
      {configs.length === 0 && (
         <div className="text-center py-12 text-slate-400 dark:text-slate-600 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
            <Key className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="font-medium">Nenhum código de setup configurado.</p>
            <p className="text-sm mt-2">Clique em "Novo Código" para começar.</p>
         </div>
      )}
    </div>
  );
}