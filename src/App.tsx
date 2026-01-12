import { useState, useEffect, useMemo, ReactNode } from 'react';
import { Plus, Settings, Edit, Trash2, Film, X, Search, Menu, Moon, Sun, ChevronLeft, AlertTriangle } from 'lucide-react'; 
import ItemList from './components/ItemList';
import ItemForm from './components/ItemForm';
import StreamForm from './components/StreamForm';
import SubtitleForm from './components/SubtitleForm';
import SettingsPanel from './components/SettingsPanel';

export interface Item {
  id: number;
  stremio_id?: string;
  type: 'movie' | 'series';
  name: string;
  description?: string;
  poster?: string;
  streams: any[];
  subtitles: any[];
}

// Interface para o Modal de Confirmação
interface ConfirmModalState {
  isOpen: boolean;
  type: 'delete_item' | 'delete_stream' | 'delete_subtitle' | null;
  data: any;
  title: string;
  description: ReactNode;
}

// Componente de Modal de Confirmação (Bonito)
const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  description, 
  isLoading 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  description: ReactNode;
  isLoading?: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-700 transform transition-all scale-100">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{title}</h3>
          <div className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
            {description}
          </div>
          
          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-900/20 transition-all flex items-center gap-2"
            >
              {isLoading ? 'Apagando...' : 'Sim, Apagar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  // UI States
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'series'>('all');

  // Modals
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStreamModalOpen, setIsStreamModalOpen] = useState(false); // Modal do Stream

  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false, type: null, data: null, title: '', description: ''
  });

  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingStream, setEditingStream] = useState<any>(null);

  const [adminKey, setAdminKey] = useState(() => {
    return localStorage.getItem('mapyngua_admin_key') || import.meta.env.VITE_ADMIN_KEY || '';
  });

  const API_URL = 'https://apimapyngua.mapyngua.com.br/api';

  // Effects
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => { fetchItems(); }, [adminKey]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Bloqueio de Scroll do Fundo quando Modal abre
  useEffect(() => {
    const isAnyModalOpen = isItemFormOpen || isSettingsOpen || isStreamModalOpen || confirmModal.isOpen || !!editingItem;
    if (isAnyModalOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isItemFormOpen, isSettingsOpen, isStreamModalOpen, confirmModal.isOpen, editingItem]);

  const getHeaders = () => ({ 'Content-Type': 'application/json', 'x-admin-key': adminKey });

  // API Actions
  const handleSaveSettings = (newKey: string) => {
    setAdminKey(newKey);
    localStorage.setItem('mapyngua_admin_key', newKey);
    setIsSettingsOpen(false);
    setTimeout(() => fetchItems(), 100);
  };

  const fetchItems = async () => {
    if (!adminKey) return;
    try {
      const res = await fetch(`${API_URL}/items`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        if (selectedItem) {
          const updated = data.items.find((i: Item) => i.id === selectedItem.id);
          if (updated) setSelectedItem(updated);
        }
      }
    } catch (error) { console.error('Failed to fetch items', error); }
  };

  const handleAddItem = async (item: any) => {
    try {
      const res = await fetch(`${API_URL}/items`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(item) });
      if (res.ok) { fetchItems(); setIsItemFormOpen(false); }
    } catch (e) { console.error(e); }
  };

  const handleUpdateItem = async (itemData: any) => {
    if (!editingItem) return;
    try {
      const res = await fetch(`${API_URL}/items/${editingItem.id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(itemData) });
      if (res.ok) { fetchItems(); setEditingItem(null); }
    } catch (e) { console.error(e); }
  };

  // Delete Handlers
  const requestDeleteItem = (item: Item) => {
    setConfirmModal({
      isOpen: true, type: 'delete_item', data: item, title: 'Apagar Item?',
      description: <span>Você está prestes a apagar <strong>"{item.name}"</strong>.<br/><br/>Isso removerá permanentemente:<br/>• {item.streams?.length || 0} streams<br/>• {item.subtitles?.length || 0} legendas</span>
    });
  };

  const requestDeleteStream = (stream: any) => {
    setConfirmModal({
      isOpen: true, type: 'delete_stream', data: stream, title: 'Apagar Stream?',
      description: <span>Tem certeza que deseja apagar o stream <strong>"{stream.name || 'Sem nome'}"</strong>?</span>
    });
  };

  const requestDeleteSubtitle = (subtitle: any) => {
    setConfirmModal({
      isOpen: true, type: 'delete_subtitle', data: subtitle, title: 'Apagar Legenda?',
      description: `Deseja remover a legenda de idioma "${subtitle.lang}"?`
    });
  };

  const handleConfirmDelete = async () => {
    const { type, data } = confirmModal;
    if (!type || !data) return;
    try {
      let url = '';
      if (type === 'delete_item') url = `${API_URL}/items/${data.id}`;
      else if (type === 'delete_stream') url = `${API_URL}/streams/${data.id}`;
      else if (type === 'delete_subtitle') url = `${API_URL}/subtitles/${data.id}`;
      const res = await fetch(url, { method: 'DELETE', headers: getHeaders() });
      if (res.ok) {
        if (type === 'delete_item' && selectedItem?.id === data.id) setSelectedItem(null);
        await fetchItems();
        setConfirmModal({ ...confirmModal, isOpen: false });
      }
    } catch (e) { console.error(e); }
  };

  // Stream Actions
  const openStreamModal = (stream: any = null) => {
    setEditingStream(stream);
    setIsStreamModalOpen(true);
  };

  const handleAddStream = async (stream: any) => {
    if (!selectedItem) return;
    try {
      const res = await fetch(`${API_URL}/items/${selectedItem.id}/streams`, {
        method: 'POST', headers: getHeaders(), body: JSON.stringify(stream)
      });
      if (res.ok) { fetchItems(); setIsStreamModalOpen(false); }
    } catch (e) { console.error(e); }
  };

  const handleUpdateStream = async (streamData: any) => {
    if (!editingStream) return;
    try {
      const res = await fetch(`${API_URL}/streams/${editingStream.id}`, {
        method: 'PUT', headers: getHeaders(), body: JSON.stringify(streamData)
      });
      if (res.ok) { fetchItems(); setIsStreamModalOpen(false); setEditingStream(null); }
    } catch (e) { console.error(e); }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || item.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [items, searchTerm, filterType]);
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex text-slate-800 dark:text-slate-100 transition-colors duration-200 font-sans">
      
      {/* Mobile Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 w-[280px] lg:w-80 z-50 transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 space-y-4 bg-white dark:bg-slate-800 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h1 className="font-bold text-lg dark:text-white flex items-center gap-2"><Film className="text-blue-600 w-6 h-6" /> Painel Administrativo</h1>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><ChevronLeft className="w-6 h-6" /></button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"/>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
            {['all', 'movie', 'series'].map((type) => (
              <button key={type} onClick={() => setFilterType(type as any)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${filterType === type ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>{type === 'all' ? 'Todos' : type === 'movie' ? 'Filmes' : 'Séries'}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {filteredItems.map(item => (
            <div key={item.id} onClick={() => { setSelectedItem(item); if(window.innerWidth < 1024) setSidebarOpen(false); }} className={`p-3 rounded-xl cursor-pointer transition-all flex gap-3 group border ${selectedItem?.id === item.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
              <div className="w-10 h-14 bg-slate-200 dark:bg-slate-600 rounded-md overflow-hidden flex-shrink-0">{item.poster && <img src={item.poster} className="w-full h-full object-cover" />}</div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className={`font-semibold text-sm truncate ${selectedItem?.id === item.id ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>{item.name}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><span className="capitalize">{item.type === 'movie' ? 'Filmes' : 'Séries'}</span><span>•</span><span>{item.streams?.length || 0} streams</span></div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
           <button onClick={() => setIsItemFormOpen(true)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl flex items-center justify-center gap-2 transition-all font-semibold shadow-lg shadow-blue-900/20"><Plus className="w-5 h-5" /> Novo Item</button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-80' : 'ml-0'}`}>
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm lg:shadow-none">
          <div className="flex items-center gap-3 overflow-hidden">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 active:bg-slate-200 transition-colors">{isSidebarOpen ? <ChevronLeft className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
            <h2 className="font-bold text-slate-800 dark:text-white truncate text-sm sm:text-base">{selectedItem ? selectedItem.name : 'Biblioteca'}</h2>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
             <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">{darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 transition-colors"><Settings className="w-5 h-5" /></button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto overflow-x-hidden">
          {selectedItem ? (
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
                        <button onClick={() => setEditingItem(selectedItem)} className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg "><Edit className="w-5 h-5"/></button>
                        <button onClick={() => requestDeleteItem(selectedItem)} className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-lg "><Trash2 className="w-5 h-5"/></button>
                        <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full hidden sm:block"><X className="w-6 h-6 text-slate-400"/></button>
                      </div>
                  </div>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-full font-bold capitalize">{selectedItem.type}</span>
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-full font-mono">{selectedItem.stremio_id}</span>
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

                {/* Subtitles List */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Legendas</h3>
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <SubtitleForm itemId={selectedItem.id} onSubmit={() => {}} />
                  </div>
                   {selectedItem.subtitles && selectedItem.subtitles.length > 0 && (
                    <div className="grid gap-2">
                       {selectedItem.subtitles.map((sub: any) => (
                         <div key={sub.id} className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                               <span className="uppercase bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs">{sub.lang}</span>
                               {sub.label || 'Sem label'}
                            </span>
                            <button onClick={() => requestDeleteSubtitle(sub)} className="text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
             <div className="h-full">
               <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                  Biblioteca <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">({filteredItems.length})</span>
                </h2>
              </div>
              <ItemList items={filteredItems} onSelectItem={setSelectedItem} onDeleteItem={requestDeleteItem} onDeleteStream={requestDeleteStream} onDeleteSubtitle={requestDeleteSubtitle} onAddStream={(item) => { setSelectedItem(item); setTimeout(() => openStreamModal(null), 100); }} />
            </div>
          )}
        </main>
      </div>

      {/* --- MODALS --- */}
      
      {(isItemFormOpen || editingItem) && <ItemForm initialData={editingItem} onSubmit={editingItem ? handleUpdateItem : handleAddItem} onClose={() => { setIsItemFormOpen(false); setEditingItem(null); }} />}

      {/* MODAL DE STREAM COM SCROLL CORRETO */}
      {isStreamModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
             <StreamForm 
                key={editingStream ? editingStream.id : 'new-stream'}
                itemId={selectedItem.id}
                itemType={selectedItem.type}
                initialData={editingStream}
                onSubmit={editingStream ? handleUpdateStream : handleAddStream}
                onCancel={() => { setIsStreamModalOpen(false); setEditingStream(null); }}
              />
          </div>
        </div>
      )}

      {isSettingsOpen && <SettingsPanel onClose={() => setIsSettingsOpen(false)} adminKey={adminKey} onSave={handleSaveSettings}/>}
      <ConfirmationModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} onConfirm={handleConfirmDelete} title={confirmModal.title} description={confirmModal.description} />
    </div>
  );
}

export default App;