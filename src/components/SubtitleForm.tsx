import { FileText } from 'lucide-react';

interface SubtitleFormProps {
  itemId: number;
  onSubmit: (itemId: number, subtitle: any) => void;
}

export default function SubtitleForm({ itemId, onSubmit }: SubtitleFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(itemId, {
      url: formData.get('url'),
      lang: formData.get('lang'),
      label: formData.get('label') || null
    });
    e.currentTarget.reset();
  };

  return (
    <div className="border border-slate-200 rounded-xl p-4">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Adicionar Legenda</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            URL da Legenda *
          </label>
          <input
            type="url"
            name="url"
            placeholder="https://exemplo.com/legenda.srt"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            required
          />
          <p className="text-xs text-slate-500 mt-1">
            URL direta para arquivo .srt ou .vtt
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Idioma *
          </label>
          <select
            name="lang"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            required
          >
            <option value="">Selecione o idioma</option>
            <option value="por">Português (por)</option>
            <option value="eng">Inglês (eng)</option>
            <option value="spa">Espanhol (spa)</option>
            <option value="fra">Francês (fra)</option>
            <option value="deu">Alemão (deu)</option>
            <option value="ita">Italiano (ita)</option>
            <option value="jpn">Japonês (jpn)</option>
            <option value="kor">Coreano (kor)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Label (opcional)
          </label>
          <input
            type="text"
            name="label"
            placeholder="Ex: Português BR"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Adicionar Legenda
        </button>
      </form>
    </div>
  );
}
