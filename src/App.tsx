import { useState, useEffect, useMemo, ReactNode } from 'react';
import { Plus, Settings, Edit, Trash2, Film, X, Search, Menu, Moon, Sun, ChevronLeft, ChevronRight, AlertTriangle, MonitorPlay, Key, AlertCircle, Tv, Play, Library, Loader2 } from 'lucide-react'; 
import ItemForm from './components/ItemForm';
import StreamForm from './components/StreamForm';
import SettingsPanel from './components/SettingsPanel';
import ConfigList from './components/ConfigList'; 
import { api } from './services/api'; 

// --- CONSTANTES ---
const ITEMS_PER_PAGE = 18; // Quantidade de cards por página

// --- INTERFACES ---
export interface Item {
  id: number;
  stremio_id?: string;
  type: 'movie' | 'series';
  name: string;
  description?: string;
  poster?: string;
  needs_fix?: boolean; 
  streams: any[];
  subtitles: any[];
}

interface ConfirmModalState {
  isOpen: boolean;
  type: 'delete_item' | 'delete_stream' | 'delete_subtitle' | null;
  data: any;
  title: string;
  description: ReactNode;
}

// --- CONFIRMATION MODAL ---
const ConfirmationModal = ({ 
  isOpen, onClose, onConfirm, title, description, isLoading 
}: { 
  isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; description: ReactNode; isLoading?: boolean;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{title}</h3>
          <div className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">{description}</div>
          <div className="flex gap-3 justify-center">
            <button onClick={onClose} disabled={isLoading} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancelar</button>
            <button onClick={onConfirm} disabled={isLoading} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-900/20 transition-all flex items-center gap-2">{isLoading ? 'Apagando...' : 'Sim, Apagar'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- APP COMPONENT ---
function App() {
  // --- NAVIGATION STATE ---
  const [currentView, setCurrentView] = useState<'library' | 'configs'>('library');

  // --- DATA STATES ---
  const [items, setItems] = useState<Item[]>([]);
  const [configs, setConfigs] = useState<any[]>([]); 
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  // --- LOADING & PAGINATION STATES ---
  const [isLoading, setIsLoading] = useState(true); // Começa carregando
  const [currentPage, setCurrentPage] = useState(1);

  // UI States
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'series' | 'flagged'>('all');

  // Modals
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStreamModalOpen, setIsStreamModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({ isOpen: false, type: null, data: null, title: '', description: '' });

  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingStream, setEditingStream] = useState<any>(null);

  const [adminKey, setAdminKey] = useState(() => localStorage.getItem('ADMIN_KEY') || import.meta.env.VITE_ADMIN_KEY || '');
  const [rdKey, setRdKey] = useState(() => localStorage.getItem('RD_KEY') || '');

  // --- EFFECTS ---
  useEffect(() => {
    if (darkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [darkMode]);

  useEffect(() => { 
    if (adminKey) {
        fetchItems(); 
        fetchConfigs();
    } else {
        setIsLoading(false); // Se não tem chave, para o loading pra mostrar o setup
    }
  }, [adminKey]);

  useEffect(() => {
    const handleResize = () => { if (window.innerWidth < 1024) setSidebarOpen(false); else setSidebarOpen(true); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const isAnyModalOpen = isItemFormOpen || isSettingsOpen || isStreamModalOpen || confirmModal.isOpen || !!editingItem;
    document.body.style.overflow = isAnyModalOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isItemFormOpen, isSettingsOpen, isStreamModalOpen, confirmModal.isOpen, editingItem]);

  // Resetar página quando filtrar ou buscar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  // --- API ACTIONS (GLOBAL) ---
  const handleSaveSettings = (keys: { adminKey: string; rdKey: string }) => {
    const { adminKey: newAdminKey, rdKey: newRdKey } = keys;
    setAdminKey(newAdminKey); localStorage.setItem('ADMIN_KEY', newAdminKey);
    setRdKey(newRdKey); localStorage.setItem('RD_KEY', newRdKey);
    setIsSettingsOpen(false);
    if (newAdminKey) setTimeout(() => { fetchItems(); fetchConfigs(); }, 100);
  };

  // --- API ACTIONS (ITEMS) ---
  const fetchItems = async () => {
    if (!adminKey) return;
    setIsLoading(true); // Inicia loading
    try {
      const data = await api.items.list();
      setItems(data.items);
      if (selectedItem) { 
        const updated = data.items.find((i: Item) => i.id === selectedItem.id); 
        if (updated) setSelectedItem(updated); 
      }
    } catch (error) { 
        console.error('Falha ao buscar itens', error); 
    } finally {
        setIsLoading(false); // Para loading
    }
  };

  const handleAddItem = async (item: any) => {
    try {
      await api.items.create(item);
      fetchItems(); 
      setIsItemFormOpen(false);
    } catch (e) { console.error(e); alert('Erro ao adicionar item.'); }
  };

  const handleUpdateItem = async (itemData: any) => {
    if (!editingItem) return;
    try {
      await api.items.update(editingItem.id, itemData);
      fetchItems(); 
      setEditingItem(null);
    } catch (e) { console.error(e); alert('Erro ao atualizar item.'); }
  };

  const handleToggleFlag = async (item: Item) => {
    const newValue = !item.needs_fix;
    const updatedItem = { ...item, needs_fix: newValue };
    setItems(prev => prev.map(i => i.id === item.id ? updatedItem : i));
    if (selectedItem?.id === item.id) setSelectedItem(updatedItem);

    try {
        await api.items.update(item.id, { needs_fix: newValue });
    } catch (e) {
        console.error("Erro ao marcar flag", e);
        alert("Erro ao salvar status de pendência.");
        setItems(prev => prev.map(i => i.id === item.id ? item : i));
        if (selectedItem?.id === item.id) setSelectedItem(item);
    }
  };

  // --- API ACTIONS (CONFIGS) ---
  const fetchConfigs = async () => {
    if (!adminKey) return;
    try {
      const data = await api.configs.list();
      setConfigs(data.configs);
    } catch (e) { console.error(e); }
  };

  const handleCreateConfig = async (token: string) => {
    try { await api.configs.create(token); fetchConfigs(); } catch(e) { console.error(e); alert('Erro ao criar configuração.'); }
  };

  const handleUpdateConfig = async (id: number, token: string) => {
    try { await api.configs.update(id, token); fetchConfigs(); } catch(e) { console.error(e); alert('Erro ao atualizar configuração.'); }
  };

  const handleDeleteConfig = async (id: number) => {
    if(!confirm('Apagar este código?')) return;
    try { await api.configs.delete(id); fetchConfigs(); } catch(e) { console.error(e); alert('Erro ao apagar configuração.'); }
  };

  // --- DELETE HANDLERS ---
  const requestDeleteItem = (itemOrId: Item | number) => {
    let item: Item | undefined;
    if (typeof itemOrId === 'number') { item = items.find(i => i.id === itemOrId); } else { item = itemOrId; }
    if (!item) return;

    setConfirmModal({
      isOpen: true, 
      type: 'delete_item', 
      data: item, 
      title: 'Apagar Item?',
      description: (
        <span>Você está prestes a apagar <strong>"{item.name}"</strong>.<br/><br/>Isso removerá permanentemente:<br/>• {item.streams?.length || 0} streams<br/>• {item.subtitles?.length || 0} legendas</span>
      )
    });
  };

  const requestDeleteStream = (stream: any) => {
    setConfirmModal({ isOpen: true, type: 'delete_stream', data: stream, title: 'Apagar Stream?', description: <span>Tem certeza que deseja apagar o stream <strong>"{stream.name || 'Sem nome'}"</strong>?</span> });
  };

//  const requestDeleteSubtitle = (subtitle: any) => {
//    setConfirmModal({ isOpen: true, type: 'delete_subtitle', data: subtitle, title: 'Apagar Legenda?', description: `Deseja remover a legenda de idioma "${subtitle.lang}"?` });
//  };

  const handleConfirmDelete = async () => {
    const { type, data } = confirmModal;
    if (!type || !data) return;
    
    try {
      if (type === 'delete_item') { await api.items.delete(data.id); if (selectedItem?.id === data.id) setSelectedItem(null); } 
      else if (type === 'delete_stream') { await api.streams.delete(data.id); } 
      else if (type === 'delete_subtitle') { await api.subtitles.delete(data.id); }
      
      await fetchItems();
      setConfirmModal({ ...confirmModal, isOpen: false });
    } catch (e) { console.error(e); alert('Erro ao apagar.'); }
  };

  // --- STREAM ACTIONS ---
  const openStreamModal = (stream: any = null) => { setEditingStream(stream); setIsStreamModalOpen(true); };

  const handleAddStream = async (stream: any) => {
    if (!selectedItem) return;
    try { await api.streams.create(selectedItem.id, stream); fetchItems(); setIsStreamModalOpen(false); } catch (e) { console.error(e); alert('Erro ao adicionar stream'); }
  };

  const handleUpdateStream = async (streamData: any) => {
    if (!editingStream) return;
    try { await api.streams.update(editingStream.id, streamData); fetchItems(); setIsStreamModalOpen(false); setEditingStream(null); } catch (e) { console.error(e); alert('Erro ao atualizar stream'); }
  };

  // --- FILTRO E PAGINAÇÃO ---
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = item.name.toLowerCase().includes(term) || 
                            (item.stremio_id && item.stremio_id.toLowerCase().includes(term));
      
      let matchesType = true;
      if (filterType === 'flagged') {
          matchesType = !!item.needs_fix;
      } else if (filterType !== 'all') {
          matchesType = item.type === filterType;
      }
      
      return matchesSearch && matchesType;
    });
  }, [items, searchTerm, filterType]);

  // Cálculo da Paginação
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

  // --- ESTATÍSTICAS ---
  const stats = useMemo(() => {
    return {
        totalTitles: items.length,
        movies: items.filter(i => i.type === 'movie').length,
        series: items.filter(i => i.type === 'series').length,
        totalStreams: items.reduce((acc, curr) => acc + (curr.streams?.length || 0), 0)
    };
  }, [items]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex text-slate-800 dark:text-slate-100 transition-colors duration-200 font-sans">
      
      {/* Mobile Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* --- SIDEBAR --- */}
      <aside className={`fixed top-0 left-0 h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 w-[280px] lg:w-80 z-50 transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-4 bg-white dark:bg-slate-800 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h1 className="font-bold text-lg dark:text-white flex items-center gap-2"><Film className="text-blue-600 w-6 h-6" /> Painel Administrativo</h1>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><ChevronLeft className="w-6 h-6" /></button>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
             <button onClick={() => setCurrentView('library')} className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${currentView === 'library' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                <MonitorPlay className="w-4 h-4" /> Biblioteca
             </button>
             <button onClick={() => { setCurrentView('configs'); fetchConfigs(); }} className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${currentView === 'configs' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
                <Key className="w-4 h-4" /> Setup
             </button>
          </div>

          {currentView === 'library' && (
            <>
                <div className="relative animate-in fade-in slide-in-from-top-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Nome ou ID (tt...)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"/>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl animate-in fade-in slide-in-from-top-2 gap-1 overflow-x-auto">
                    {['all', 'movie', 'series'].map((type) => (
                        <button key={type} onClick={() => setFilterType(type as any)} className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all capitalize whitespace-nowrap ${filterType === type ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>{type === 'all' ? 'Todos' : type === 'movie' ? 'Filmes' : 'Séries'}</button>
                    ))}
                    <button onClick={() => setFilterType('flagged')} className={`flex items-center justify-center gap-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all ${filterType === 'flagged' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 shadow-sm ring-1 ring-orange-200 dark:ring-orange-800' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                        <AlertCircle className="w-3 h-3" />
                    </button>
                </div>
            </>
          )}
        </div>
        
        {/* Lista da Sidebar (Opcional: Pode ser paginada também, mas mantive o scroll para acesso rápido) */}
        {currentView === 'library' && (
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
                {isLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-400"/></div>
                ) : (
                    filteredItems.slice(0, 50).map(item => ( // Mostra apenas os primeiros 50 na sidebar para não travar
                        <div key={item.id} onClick={() => { setSelectedItem(item); if(window.innerWidth < 1024) setSidebarOpen(false); }} className={`relative p-3 rounded-xl cursor-pointer transition-all flex gap-3 group border ${selectedItem?.id === item.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                            {item.needs_fix && (
                                <div className="absolute right-2 top-2">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                </div>
                            )}
                            <div className="w-10 h-14 bg-slate-200 dark:bg-slate-600 rounded-md overflow-hidden flex-shrink-0">{item.poster && <img src={item.poster} className="w-full h-full object-cover" />}</div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <h3 className={`font-semibold text-sm truncate pr-2 ${selectedItem?.id === item.id ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>{item.name}</h3>
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><span className="capitalize">{item.type === 'movie' ? 'Filmes' : 'Séries'}</span><span>•</span><span>{item.streams?.length || 0} streams</span></div>
                            </div>
                        </div>
                    ))
                )}
                {filteredItems.length > 50 && !isLoading && <div className="text-center text-xs text-slate-400 py-2">Use a busca para ver mais...</div>}
            </div>
        )}

        {currentView === 'configs' && (
             <div className="flex-1 p-6 flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 animate-in fade-in">
                <Key className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm">Gerencie chaves de acesso no painel principal.</p>
             </div>
        )}

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
           {currentView === 'library' && (
               <button onClick={() => setIsItemFormOpen(true)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl flex items-center justify-center gap-2 transition-all font-semibold shadow-lg shadow-blue-900/20"><Plus className="w-5 h-5" /> Novo Item</button>
           )}
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-80' : 'ml-0'}`}>
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm lg:shadow-none">
          <div className="flex items-center gap-3 overflow-hidden">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 active:bg-slate-200 transition-colors">{isSidebarOpen ? <ChevronLeft className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
            <h2 className="font-bold text-slate-800 dark:text-white truncate text-sm sm:text-base">
                {currentView === 'configs' ? 'Gerenciar Acessos' : (selectedItem ? selectedItem.name : 'Dashboard')}
            </h2>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
             <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">{darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors"><Settings className="w-5 h-5" /></button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto overflow-x-hidden">
          
          {/* TELA DE LOADING INICIAL */}
          {isLoading && !items.length && (
            <div className="h-full flex flex-col items-center justify-center animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mb-6 animate-pulse">
                    <Library className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="font-medium">Carregando sua biblioteca...</span>
                </div>
            </div>
          )}

          {!isLoading && currentView === 'configs' && (
             <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                <ConfigList configs={configs} onDelete={handleDeleteConfig} onUpdate={handleUpdateConfig} onCreate={handleCreateConfig} onRefresh={fetchConfigs} />
             </div>
          )}

          {!isLoading && currentView === 'library' && (
             <>
                {selectedItem ? (
                    /* --- VIEW DE DETALHES DO ITEM (SELECIONADO) --- */
                    <div className="max-w-5xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in duration-300">
                        {/* Item Header */}
                        <div className="flex flex-col sm:flex-row gap-6 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="w-40 h-60 mx-auto sm:mx-0 sm:w-32 sm:h-48 bg-slate-200 dark:bg-slate-700 rounded-2xl overflow-hidden flex-shrink-0 shadow-md">
                            {selectedItem.poster ? <img src={selectedItem.poster} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full"><Film size={32} className="text-slate-400"/></div>}
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4 mb-4">
                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight">{selectedItem.name}</h1>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleToggleFlag(selectedItem)} 
                                        className={`p-2 rounded-lg transition-colors ${
                                            selectedItem.needs_fix 
                                                ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 ring-1 ring-orange-200 dark:ring-orange-800' 
                                                : 'bg-slate-50 text-slate-400 dark:bg-blue-900/10 dark:text-slate-500 hover:bg-orange-50 hover:text-orange-400'
                                        }`}
                                        title={selectedItem.needs_fix ? "Remover marcação de pendência" : "Marcar como pendente/atenção"}
                                    >
                                        <AlertCircle className="w-5 h-5" />
                                    </button>

                                    <button onClick={() => setEditingItem(selectedItem)} className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50"><Edit className="w-5 h-5"/></button>
                                    <button onClick={() => requestDeleteItem(selectedItem)} className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50"><Trash2 className="w-5 h-5"/></button>
                                    <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full hidden sm:block"><X className="w-6 h-6 text-slate-400"/></button>
                                </div>
                            </div>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-full font-bold capitalize">{selectedItem.type === 'movie' ? 'Filmes' : 'Séries'}</span>
                                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-full font-mono">{selectedItem.stremio_id}</span>
                                {selectedItem.needs_fix && (
                                    <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm rounded-full font-bold flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> Atenção
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm sm:text-base max-w-2xl">{selectedItem.description || 'Sem descrição.'}</p>
                        </div>
                        </div>

                        {/* Streams List */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">Streams <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-1 rounded-full">{selectedItem.streams?.length || 0}</span></h2>
                            <button onClick={() => openStreamModal(null)} className="text-sm bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"><Plus className="w-4 h-4" /> Adicionar</button>
                            </div>
                            <div className="space-y-3">
                            {selectedItem.streams?.map((stream: any) => (
                                <div key={stream.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-3 gap-3">
                                    <div className="min-w-0">
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 flex-wrap text-sm sm:text-base">
                                        {stream.name || 'Sem nome'}
                                        {stream.season && <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs px-2 py-0.5 rounded whitespace-nowrap font-mono">S{stream.season} E{stream.episode}</span>}
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{stream.description}</p>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                    <button onClick={() => openStreamModal(stream)} className="text-blue-500 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg"><Edit className="w-4 h-4" /></button>
                                    <button onClick={() => requestDeleteStream(stream)} className="text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <div className="text-[10px] sm:text-xs font-mono bg-slate-50 dark:bg-slate-900 p-2 rounded-lg text-slate-500 dark:text-slate-400 truncate border border-slate-100 dark:border-slate-700 select-all">{stream.url || `magnet:?xt=urn:btih:${stream.magnet_hash}`}</div>
                                </div>
                            ))}
                            </div>
                        </div>
                        </div>
                    </div>
                ) : (
                    /* --- TELA PRINCIPAL (DASHBOARD) --- */
                    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
                        
                        {/* 1. Logo e Título Centralizado */}
                        <div className="flex flex-col items-center justify-center py-4">
                            <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4 text-white">
                                <Library className="w-8 h-8" />
                            </div>
                            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">MapynguaLib</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gerenciador de Conteúdo</p>
                        </div>

                        {/* 2. Cards de Estatísticas */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl"><Film className="w-6 h-6"/></div>
                                <div><p className="text-2xl font-bold dark:text-white">{stats.totalTitles}</p><p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Títulos</p></div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl"><Film className="w-6 h-6"/></div>
                                <div><p className="text-2xl font-bold dark:text-white">{stats.movies}</p><p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Filmes</p></div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl"><Tv className="w-6 h-6"/></div>
                                <div><p className="text-2xl font-bold dark:text-white">{stats.series}</p><p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Séries</p></div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl"><Play className="w-6 h-6"/></div>
                                <div><p className="text-2xl font-bold dark:text-white">{stats.totalStreams}</p><p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Streams</p></div>
                            </div>
                        </div>

                        {/* 3. Barra de Ferramentas Principal (Busca + Novo Item) */}
                        <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-20">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por nome ou ID (tt...)" 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                                />
                            </div>
                            <button onClick={() => setIsItemFormOpen(true)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-transform active:scale-95 whitespace-nowrap">
                                <Plus className="w-5 h-5" /> Novo Item
                            </button>
                        </div>

                        {/* 4. Grid de Itens (PAGINADA) */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6 min-h-[400px] content-start">
                            {paginatedItems.map(item => (
                                <div 
                                    key={item.id} 
                                    onClick={() => setSelectedItem(item)}
                                    className={`group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative ${
                                        item.needs_fix ? 'border-orange-400 dark:border-orange-500 ring-1 ring-orange-400' : 'border-slate-200 dark:border-slate-700'
                                    }`}
                                >
                                    <div className="aspect-[2/3] bg-slate-200 dark:bg-slate-700 relative overflow-hidden">
                                        {item.poster ? (
                                            <img src={item.poster} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400"><Film className="w-10 h-10" /></div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        
                                        <div className="absolute top-2 left-2">
                                             <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-md bg-black/50 text-white backdrop-blur-md border border-white/10">
                                                {item.type === 'movie' ? 'Filme' : 'Série'}
                                             </span>
                                        </div>

                                        {item.needs_fix && (
                                            <div className="absolute top-2 right-2 z-10">
                                                <div className="bg-orange-500 text-white p-1.5 rounded-full shadow-lg shadow-orange-900/40 animate-pulse">
                                                    <AlertCircle className="w-4 h-4" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="p-4">
                                        <h3 className="font-bold text-slate-800 dark:text-white truncate mb-1" title={item.name}>{item.name}</h3>
                                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                            <span className="font-mono">{item.stremio_id || 'ID N/A'}</span>
                                            <div className="flex items-center gap-1">
                                                <Play className="w-3 h-3" /> {item.streams?.length || 0}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredItems.length === 0 && (
                                <div className="col-span-full py-20 text-center text-slate-400">
                                    <div className="bg-slate-100 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-8 h-8 opacity-50"/>
                                    </div>
                                    <p>Nenhum item encontrado.</p>
                                </div>
                            )}
                        </div>

                        {/* 5. Controles de Paginação (Footer) */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mt-4">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 flex items-center gap-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" /> Anterior
                                </button>
                                
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                    Página <strong className="text-slate-800 dark:text-white">{currentPage}</strong> de {totalPages}
                                </span>

                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 flex items-center gap-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Próxima <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
             </>
          )}
        </main>
      </div>

      {(isItemFormOpen || editingItem) && <ItemForm initialData={editingItem} onSubmit={editingItem ? handleUpdateItem : handleAddItem} onClose={() => { setIsItemFormOpen(false); setEditingItem(null); }} />}

      {isStreamModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
             <StreamForm key={editingStream ? editingStream.id : 'new-stream'} itemId={selectedItem.id} itemType={selectedItem.type} initialData={editingStream} onSubmit={editingStream ? handleUpdateStream : handleAddStream} onCancel={() => { setIsStreamModalOpen(false); setEditingStream(null); }} />
          </div>
        </div>
      )}

      {isSettingsOpen && <SettingsPanel onClose={() => setIsSettingsOpen(false)} adminKey={adminKey} rdKey={rdKey} onSave={handleSaveSettings} />}
      <ConfirmationModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} onConfirm={handleConfirmDelete} title={confirmModal.title} description={confirmModal.description} />
    </div>
  );
}

export default App;