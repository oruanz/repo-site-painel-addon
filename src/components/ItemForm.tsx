import { useState, useEffect } from 'react';
import { X, Film, Tv } from 'lucide-react';

interface ItemFormProps {
  initialData?: any; 
  onSubmit: (item: any) => void;
  onClose: () => void;
}

export default function ItemForm({ initialData, onSubmit, onClose }: ItemFormProps) {
  const [type, setType] = useState<'movie' | 'series'>('movie');

  useEffect(() => {
    if (initialData?.type) {
      setType(initialData.type);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      stremio_id: formData.get('stremio_id'),
      type,
      name: formData.get('name'),
      poster: formData.get('poster') || null,
      description: formData.get('description') || null
    });
  };

  const isEditing = !!initialData;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            {isEditing ? 'Editar Item' : 'Adicionar Item'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 dark:text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tipo</label>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={isEditing}
                onClick={() => setType('movie')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all border ${
                  type === 'movie'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-900/20'
                    : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-100 dark:hover:bg-slate-600'
                } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Film className="w-5 h-5" />
                Filme
              </button>
              <button
                type="button"
                disabled={isEditing}
                onClick={() => setType('series')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all border ${
                  type === 'series'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-900/20'
                    : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-100 dark:hover:bg-slate-600'
                } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Tv className="w-5 h-5" />
                Série
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Stremio ID *</label>
            <input
              type="text"
              name="stremio_id"
              defaultValue={initialData?.stremio_id}
              disabled={isEditing}
              placeholder="tt1234567"
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm dark:text-white ${isEditing ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'}`}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nome *</label>
            <input
              type="text"
              name="name"
              defaultValue={initialData?.name}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">URL do Poster</label>
            <input
              type="url"
              name="poster"
              defaultValue={initialData?.poster}
              placeholder="https://..."
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Descrição</label>
            <textarea
              name="description"
              defaultValue={initialData?.description}
              rows={3}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:text-white"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-bold shadow-lg shadow-blue-900/20"
            >
              {isEditing ? 'Salvar Alterações' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}