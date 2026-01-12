import { Film, Tv, Trash2, Plus, Link, FileText } from 'lucide-react';
// CORREÇÃO: Importando Item do App
import type { Item } from '../App';

interface ItemListProps {
  items: Item[];
  onSelectItem: (item: Item) => void;
  onDeleteItem: (id: number) => void;
  onDeleteStream: (streamId: number) => void;
  onDeleteSubtitle: (subtitleId: number) => void;
  onAddStream: (item: Item) => void;
}

export default function ItemList({
  items,
  onSelectItem,
  onDeleteItem,
  onDeleteStream,
  onDeleteSubtitle,
  onAddStream
}: ItemListProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
        <div className="text-slate-400 mb-4">
          <Film className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-slate-700 mb-2">Nenhum item encontrado</h3>
        <p className="text-slate-500">Adicione filmes ou séries para começar</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
      {items.map((item) => (
        <div 
            key={item.id} 
            className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer border border-transparent hover:border-blue-200"
            // CORREÇÃO: Adicionando onClick para usar onSelectItem e remover erro de "não lido"
            onClick={() => onSelectItem(item)}
        >
          <div className="flex gap-4 p-4">
            {item.poster ? (
              <img
                src={item.poster}
                alt={item.name}
                className="w-24 h-36 object-cover rounded-lg flex-shrink-0"
              />
            ) : (
              <div className="w-24 h-36 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                {item.type === 'movie' ? (
                  <Film className="w-8 h-8 text-slate-400" />
                ) : (
                  <Tv className="w-8 h-8 text-slate-400" />
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-slate-800 truncate">{item.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded">
                      {item.type === 'movie' ? <Film className="w-3 h-3" /> : <Tv className="w-3 h-3" />}
                      {item.type === 'movie' ? 'Filme' : 'Série'}
                    </span>
                    <span className="text-xs text-slate-500">ID: {item.stremio_id}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Deletar item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {item.description && (
                <p className="text-sm text-slate-600 line-clamp-2 mb-3">{item.description}</p>
              )}
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Link className="w-4 h-4" />
                  <span>{item.streams.length} stream{item.streams.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <FileText className="w-4 h-4" />
                  <span>{item.subtitles.length} legenda{item.subtitles.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="mt-3">
                <button
                  onClick={(e) => { e.stopPropagation(); onAddStream(item); }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Stream/Legenda
                </button>
              </div>
              
              {(item.streams.length > 0 || item.subtitles.length > 0) && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2" onClick={(e) => e.stopPropagation()}>
                  {/* CORREÇÃO: Adicionado tipo 'any' para evitar erro implicit any */}
                  {item.streams.map((stream: any) => (
                    <div key={stream.id} className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-700 font-medium truncate">
                            {stream.name || 'Stream sem nome'}
                          </span>
                          {stream.magnet_hash && (
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                              Torrent
                            </span>
                          )}
                        </div>
                        {stream.description && (
                          <p className="text-slate-500 truncate ml-5">{stream.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => onDeleteStream(stream.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                        title="Deletar stream"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {/* CORREÇÃO: Adicionado tipo 'any' para evitar erro implicit any */}
                  {item.subtitles.map((subtitle: any) => (
                    <div key={subtitle.id} className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-700 font-medium">
                            {subtitle.label || subtitle.lang.toUpperCase()}
                          </span>
                          <span className="text-slate-500">({subtitle.lang})</span>
                        </div>
                      </div>
                      <button
                        onClick={() => onDeleteSubtitle(subtitle.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                        title="Deletar legenda"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}