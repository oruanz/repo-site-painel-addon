import { Film, Tv, Trash2, Plus, Link, FileText } from 'lucide-react';
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDeleteStream,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDeleteSubtitle,
  onAddStream
}: ItemListProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm p-8 sm:p-12 text-center border border-slate-200 dark:border-slate-700">
        <div className="text-slate-300 dark:text-slate-600 mb-4">
          <Film className="w-16 h-16 mx-auto stroke-1" />
        </div>
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">Sua biblioteca está vazia</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Use o botão "Novo Item" na barra lateral para começar.</p>
      </div>
    );
  }

  return (
    // GRID RESPONSIVA: 1 col (mobile), 2 cols (tablet), 2 cols (desktop), 3 cols (large)
    <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
      {items.map((item) => (
        <div 
            key={item.id} 
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 group relative overflow-hidden"
            onClick={() => onSelectItem(item)}
        >
          <div className="flex gap-4 p-4">
            {/* Poster */}
            <div className="w-24 h-36 bg-slate-200 dark:bg-slate-700 rounded-xl flex-shrink-0 overflow-hidden shadow-inner">
              {item.poster ? (
                <img src={item.poster} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {item.type === 'movie' ? <Film className="text-slate-400" /> : <Tv className="text-slate-400" />}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex justify-between items-start">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate pr-6 leading-tight mb-1">
                  {item.name}
                </h3>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  item.type === 'movie' 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                }`}>
                  {item.type === 'movie' ? 'Filme' : 'Série'}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-auto leading-relaxed">
                {item.description || 'Sem descrição.'}
              </p>

              {/* Footer Infos */}
              <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-700/50">
                <div className="flex gap-3 text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1"><Link className="w-3 h-3"/> {item.streams.length}</span>
                  <span className="flex items-center gap-1"><FileText className="w-3 h-3"/> {item.subtitles.length}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onAddStream(item); }}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3 h-3" /> Add Stream
                </button>
              </div>
            </div>

            {/* Delete Button (Absolute for better touch area) */}
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }}
              className="absolute top-2 right-2 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}