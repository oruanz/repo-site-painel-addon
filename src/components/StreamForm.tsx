import React, { useState, useEffect } from 'react';
import { Link, Hash, X, Save } from 'lucide-react';

interface StreamFormProps {
  itemId?: number;
  itemType: 'movie' | 'series';
  initialData?: any;
  onSubmit: (stream: any) => void;
  onCancel?: () => void;
}

export default function StreamForm({ itemId: _itemId, itemType, initialData, onSubmit, onCancel }: StreamFormProps) {
  const [streamType, setStreamType] = useState<'url' | 'torrent'>('torrent');
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [magnetHash, setMagnetHash] = useState('');
  const [fileIndex, setFileIndex] = useState('');
  const [season, setSeason] = useState('');
  const [episode, setEpisode] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      
      if (initialData.url && !initialData.magnet_hash) {
        setStreamType('url');
        setUrl(initialData.url);
        setMagnetHash('');
        setFileIndex('');
      } else {
        setStreamType('torrent');
        setMagnetHash(initialData.magnet_hash || '');
        const safeIndex = initialData.file_index !== null && initialData.file_index !== undefined ? String(initialData.file_index) : '';
        setFileIndex(safeIndex);
        setUrl('');
      }

      const safeSeason = (initialData.season !== null && initialData.season !== undefined) ? String(initialData.season) : '';
      const safeEpisode = (initialData.episode !== null && initialData.episode !== undefined) ? String(initialData.episode) : '';
      setSeason(safeSeason);
      setEpisode(safeEpisode);
    } else {
      setName('');
      setDescription('');
      setUrl('');
      setMagnetHash('');
      setFileIndex('');
      setSeason('');
      setEpisode('');
      setStreamType('torrent');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const stream: any = {
      name: name || null,
      description: description || null,
      season: null,
      episode: null
    };

    if (itemType === 'series') {
      stream.season = season === '' ? null : Number(season);
      stream.episode = episode === '' ? null : Number(episode);
    }

    if (streamType === 'url') {
      stream.url = url;
      stream.magnet_hash = null; 
      stream.file_index = null;
    } else {
      stream.magnet_hash = magnetHash;
      stream.url = null;
      if (fileIndex !== '') {
        stream.file_index = Number(fileIndex);
      }
    }
    onSubmit(stream);
  };

  const isEditing = !!initialData;

  return (
    // ROOT: Ocupa todo o espaço do Modal e define flex-col para organizar Header, Body e Footer
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 min-h-0">
      
      {/* HEADER FIXO (flex-none) */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex-none bg-white dark:bg-slate-800">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">
          {isEditing ? 'Editar Stream' : `Novo Stream ${itemType === 'series' ? '(Episódio)' : ''}`}
        </h3>
        {onCancel && (
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* FORMULÁRIO FLEXÍVEL (flex-1) */}
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        
        {/* CORPO DO FORM COM SCROLL (overflow-y-auto) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {itemType === 'series' && (
            <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Temporada (S)</label>
                <input 
                  type="number" 
                  min="1"
                  value={season} 
                  onChange={(e) => setSeason(e.target.value)} 
                  placeholder="1" 
                  className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-center font-mono font-bold"
                  required 
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Episódio (E)</label>
                <input 
                  type="number" 
                  min="1"
                  value={episode} 
                  onChange={(e) => setEpisode(e.target.value)} 
                  placeholder="1" 
                  className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-center font-mono font-bold"
                  required 
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fonte do Conteúdo</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStreamType('torrent')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
                  streamType === 'torrent'
                    ? 'bg-green-600 text-white border-green-600 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                }`}
              >
                <Hash className="w-4 h-4" />
                Torrent
              </button>
              <button
                type="button"
                onClick={() => setStreamType('url')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
                  streamType === 'url'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                }`}
              >
                <Link className="w-4 h-4" />
                URL Direta
              </button>
            </div>
          </div>

          {streamType === 'torrent' ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Info Hash *</label>
                <input
                  type="text"
                  value={magnetHash}
                  onChange={(e) => setMagnetHash(e.target.value)}
                  placeholder="Ex: 5b326031e6706c740..."
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Índice do Arquivo (File Index)</label>
                <input
                  type="number"
                  value={fileIndex}
                  onChange={(e) => setFileIndex(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm dark:text-white"
                />
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">URL do Vídeo *</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://exemplo.com/video.mp4"
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm dark:text-white"
                required
              />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nome do Stream</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={itemType === 'series' ? "Ex: S01E01 - 1080p" : "Ex: 4K HDR"}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Descrição</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Dublado / Legendado"
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-white"
              />
            </div>
          </div>
          
          <div className="h-4"></div> {/* Espaço extra para scroll */}
        </div>

        {/* RODAPÉ FIXO (flex-none) - Botão sempre visível */}
        <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-none z-10">
            <button
            type="submit"
            className={`w-full px-4 py-3.5 text-white rounded-xl transition-transform active:scale-95 font-bold flex items-center justify-center gap-2 shadow-lg ${
                isEditing 
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20' 
                : 'bg-green-600 hover:bg-green-700 shadow-green-900/20'
            }`}
            >
            <Save className="w-5 h-5" />
            {isEditing ? 'Salvar Alterações' : 'Adicionar Stream'}
            </button>
        </div>
      </form>
    </div>
  );
}