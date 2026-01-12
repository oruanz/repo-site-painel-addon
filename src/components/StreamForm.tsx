import React, { useState, useEffect } from 'react';
import { Link, Hash, X } from 'lucide-react';

interface StreamFormProps {
  itemId?: number;
  itemType: 'movie' | 'series';
  initialData?: any;
  onSubmit: (stream: any) => void;
  onCancel?: () => void;
}

export default function StreamForm({ itemId: _itemId, itemType, initialData, onSubmit, onCancel }: StreamFormProps) {
  // LOG 1: Verificar quando o componente é montado ou renderizado
  console.log(`[StreamForm] Renderizado. itemType: ${itemType}, ID do Stream:`, initialData?.id || 'Novo');

  const [streamType, setStreamType] = useState<'url' | 'torrent'>('torrent');
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [magnetHash, setMagnetHash] = useState('');
  const [fileIndex, setFileIndex] = useState('');
  const [season, setSeason] = useState('');
  const [episode, setEpisode] = useState('');

  useEffect(() => {
    console.group('[StreamForm] useEffect - Atualizando Dados');
    console.log('Recebido initialData:', initialData);

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
        // Converte para string para o input
        const safeIndex = initialData.file_index !== null && initialData.file_index !== undefined ? String(initialData.file_index) : '';
        setFileIndex(safeIndex);
        setUrl('');
      }

      // LOG 2: Verificar a conversão de Season/Episode
      const rawSeason = initialData.season;
      const rawEpisode = initialData.episode;
      console.log('Season Bruta:', rawSeason, 'Type:', typeof rawSeason);
      console.log('Episode Bruto:', rawEpisode, 'Type:', typeof rawEpisode);

      const safeSeason = (rawSeason !== null && rawSeason !== undefined) ? String(rawSeason) : '';
      const safeEpisode = (rawEpisode !== null && rawEpisode !== undefined) ? String(rawEpisode) : '';
      
      console.log('Season Convertida (State):', safeSeason);
      console.log('Episode Convertido (State):', safeEpisode);

      setSeason(safeSeason);
      setEpisode(safeEpisode);
    } else {
      console.log('Modo Criação (Resetando campos)');
      setName('');
      setDescription('');
      setUrl('');
      setMagnetHash('');
      setFileIndex('');
      setSeason('');
      setEpisode('');
      setStreamType('torrent');
    }
    console.groupEnd();
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

    // LOG 3: O que está sendo enviado
    console.log('[StreamForm] Enviando objeto:', stream);
    onSubmit(stream);
  };

  const isEditing = !!initialData;

  return (
    <div className={`border border-slate-200 rounded-xl p-4 ${isEditing ? 'bg-slate-50 border-blue-200' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800">
          {isEditing ? 'Editar Stream' : `Adicionar Stream ${itemType === 'series' ? '(Episódio)' : ''}`}
        </h3>
        {onCancel && (
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {itemType === 'series' && (
          <div className="flex gap-4 p-3 bg-white rounded-lg border border-slate-200">
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-1">Temporada (S)</label>
              <input 
                type="number" 
                min="1"
                value={season} 
                onChange={(e) => setSeason(e.target.value)} 
                placeholder="1" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required 
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-1">Episódio (E)</label>
              <input 
                type="number" 
                min="1"
                value={episode} 
                onChange={(e) => setEpisode(e.target.value)} 
                placeholder="1" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required 
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Fonte</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStreamType('torrent')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                streamType === 'torrent'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Hash className="w-4 h-4" />
              Torrent
            </button>
            <button
              type="button"
              onClick={() => setStreamType('url')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                streamType === 'url'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Link className="w-4 h-4" />
              URL Direta
            </button>
          </div>
        </div>

        {streamType === 'torrent' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Hash do Torrent *</label>
              <input
                type="text"
                value={magnetHash}
                onChange={(e) => setMagnetHash(e.target.value)}
                placeholder="abc123def456..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Índice do Arquivo</label>
              <input
                type="number"
                value={fileIndex}
                onChange={(e) => setFileIndex(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">URL do Stream *</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={itemType === 'series' ? "Ex: S01E01 - 1080p" : "Ex: 1080p BluRay"}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Dual Audio"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <button
          type="submit"
          className={`w-full px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium ${isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {isEditing ? 'Salvar Alterações' : 'Adicionar Stream'}
        </button>
      </form>
    </div>
  );
}