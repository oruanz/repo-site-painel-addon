import { useState, useEffect } from 'react';
import { X, Film, Tv } from 'lucide-react';

interface ItemFormProps {
  initialData?: any; // Dados para edição
  onSubmit: (item: any) => void;
  onClose: () => void;
}

export default function ItemForm({ initialData, onSubmit, onClose }: ItemFormProps) {
  const [type, setType] = useState<'movie' | 'series'>('movie');

  // Se tiver dados iniciais (edição), carrega o tipo correto
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">
            {isEditing ? 'Editar Item' : 'Adicionar Item'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Tipo (Bloqueado na edição para não quebrar links) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tipo</label>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isEditing}
                onClick={() => setType('movie')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  type === 'movie'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700'
                } ${isEditing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-200'}`}
              >
                <Film className="w-5 h-5" />
                Filme
              </button>
              <button
                type="button"
                disabled={isEditing}
                onClick={() => setType('series')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  type === 'series'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700'
                } ${isEditing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-200'}`}
              >
                <Tv className="w-5 h-5" />
                Série
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Stremio ID *</label>
            <input
              type="text"
              name="stremio_id"
              defaultValue={initialData?.stremio_id}
              disabled={isEditing} // ID não deve mudar
              className={`w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isEditing ? 'bg-slate-100' : ''}`}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nome *</label>
            <input
              type="text"
              name="name"
              defaultValue={initialData?.name}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">URL do Poster</label>
            <input
              type="url"
              name="poster"
              defaultValue={initialData?.poster}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
            <textarea
              name="description"
              defaultValue={initialData?.description}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {isEditing ? 'Salvar Alterações' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}