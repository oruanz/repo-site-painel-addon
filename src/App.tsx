import { useState, useEffect } from 'react';
import { Plus, Settings, Edit, Trash2, Film, X } from 'lucide-react'; 
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

function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingStream, setEditingStream] = useState<any>(null);

  const [adminKey, setAdminKey] = useState(() => {
    return localStorage.getItem('mapyngua_admin_key') || import.meta.env.VITE_ADMIN_KEY || '';
  });

  const API_URL = 'https://apimapyngua.mapyngua.com.br/api';

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'x-admin-key': adminKey
  });

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
    } catch (error) {
      console.error('Failed to fetch items', error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [adminKey]);

  // --- HANDLERS ---

  const handleAddItem = async (item: any) => {
    try {
      const res = await fetch(`${API_URL}/items`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(item)
      });
      if (res.ok) {
        fetchItems();
        setIsFormOpen(false);
      } else {
        alert('Erro ao criar item.');
      }
    } catch (e) { console.error(e); }
  };

  const handleUpdateItem = async (itemData: any) => {
    if (!editingItem) return;
    try {
      const res = await fetch(`${API_URL}/items/${editingItem.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(itemData)
      });
      if (res.ok) {
        fetchItems();
        setEditingItem(null);
      } else {
        alert('Erro ao atualizar item');
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Tem certeza? Isso apaga todos os streams e legendas deste item.')) return;
    try {
      await fetch(`${API_URL}/items/${id}`, { method: 'DELETE', headers: getHeaders() });
      if (selectedItem?.id === id) setSelectedItem(null);
      fetchItems();
    } catch (e) { console.error(e); }
  };

  const handleAddStream = async (stream: any) => {
    if (!selectedItem) return;
    try {
      const res = await fetch(`${API_URL}/items/${selectedItem.id}/streams`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(stream)
      });
      if (res.ok) fetchItems();
    } catch (e) { console.error(e); }
  };

  const handleUpdateStream = async (streamData: any) => {
    if (!editingStream) return;
    try {
      const res = await fetch(`${API_URL}/streams/${editingStream.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(streamData)
      });
      if (res.ok) {
        fetchItems();
        setEditingStream(null);
      } else {
        alert('Erro ao atualizar stream');
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteStream = async (id: number) => {
    if (!confirm('Apagar este stream?')) return;
    try {
      await fetch(`${API_URL}/streams/${id}`, { method: 'DELETE', headers: getHeaders() });
      fetchItems();
    } catch (e) { console.error(e); }
  };

  const handleDeleteSubtitle = async (id: number) => {
    if (!confirm('Apagar esta legenda?')) return;
    try {
      await fetch(`${API_URL}/subtitles/${id}`, { method: 'DELETE', headers: getHeaders() });
      fetchItems();
    } catch (e) { console.error(e); }
  };
  
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar / Lista */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-screen fixed left-0 top-0 z-10">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h1 className="font-bold text-slate-800">Minha Biblioteca</h1>
          <div className="flex gap-2">
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg">
              <Settings className="w-5 h-5 text-slate-600" />
            </button>
            <button onClick={() => setIsFormOpen(true)} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {items.map(item => (
            <div 
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors flex gap-3 ${selectedItem?.id === item.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}`}
            >
              <div className="w-12 h-16 bg-slate-200 rounded overflow-hidden flex-shrink-0">
                {item.poster ? <img src={item.poster} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full bg-slate-200"><Film className="text-slate-400" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-slate-800 truncate">{item.name}</h3>
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setEditingItem(item); }} className="p-1 hover:bg-blue-100 rounded text-blue-600">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }} className="p-1 hover:bg-red-100 rounded text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1 uppercase">{item.type} • {item.streams?.length || 0} streams</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-80 flex-1 p-8">
        {selectedItem ? (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header do Item */}
            <div className="flex gap-6 items-start bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="w-32 h-48 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                {selectedItem.poster ? <img src={selectedItem.poster} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full"><Film size={32} className="text-slate-400"/></div>}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">{selectedItem.name}</h1>
                    <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6 text-slate-400"/></button>
                </div>
                <div className="flex gap-2 mb-4">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full font-medium capitalize">{selectedItem.type}</span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full font-mono">{selectedItem.stremio_id}</span>
                </div>
                <p className="text-slate-600 leading-relaxed">{selectedItem.description || 'Sem descrição.'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Lista Streams */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800 flex justify-between items-center">
                  Streams Disponíveis <span className="text-sm font-normal text-slate-500">{selectedItem.streams?.length || 0} total</span>
                </h2>
                <div className="space-y-3">
                  {selectedItem.streams?.map((stream: any) => (
                    <div key={stream.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-slate-800 flex items-center gap-2">
                            {stream.name || 'Sem nome'}
                            {stream.season && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded">S{stream.season} E{stream.episode}</span>}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">{stream.description}</p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingStream(stream)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteStream(stream.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="text-xs font-mono bg-slate-50 p-2 rounded text-slate-600 truncate">
                        {stream.url || `MAGNET: ${stream.magnet_hash?.substring(0, 30)}...`}
                      </div>
                    </div>
                  ))}
                  {(!selectedItem.streams || selectedItem.streams.length === 0) && <p className="text-slate-500 text-center py-8">Nenhum stream.</p>}
                </div>
              </div>

              {/* Formulários */}
              <div className="space-y-6">
                <StreamForm 
                  // --- AQUI ESTÁ A CORREÇÃO PRINCIPAL ---
                  // Usamos o ID do stream sendo editado como chave. 
                  // Se for null, usamos 'new'. Isso força o React a limpar os inputs.
                  key={editingStream ? editingStream.id : 'new-stream'}
                  itemId={selectedItem.id}
                  itemType={selectedItem.type}
                  initialData={editingStream}
                  onSubmit={editingStream ? handleUpdateStream : handleAddStream}
                  onCancel={editingStream ? () => setEditingStream(null) : undefined}
                />
                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Adicionar Legenda</h3>
                  <SubtitleForm itemId={selectedItem.id} onSubmit={() => {}} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Todos os Itens</h2>
            <ItemList 
                items={items} 
                onSelectItem={setSelectedItem}
                onDeleteItem={handleDeleteItem}
                onDeleteStream={handleDeleteStream}
                onDeleteSubtitle={handleDeleteSubtitle}
                onAddStream={(item) => setSelectedItem(item)}
            />
          </div>
        )}
      </div>

      {(isFormOpen || editingItem) && (
        <ItemForm 
          initialData={editingItem}
          onSubmit={editingItem ? handleUpdateItem : handleAddItem} 
          onClose={() => { setIsFormOpen(false); setEditingItem(null); }} 
        />
      )}

      {isSettingsOpen && <SettingsPanel onClose={() => setIsSettingsOpen(false)} adminKey={adminKey} onSave={handleSaveSettings} setAdminKey={handleSaveSettings}/>}
    </div>
  );
}

export default App;