import { useState, useEffect, useRef } from 'react';
import { X, Film, Tv, Search, Loader2, Image as ImageIcon, Sparkles } from 'lucide-react';

interface ItemFormProps {
  initialData?: any;
  onSubmit: (item: any) => void;
  onClose: () => void;
}

const TMDB_API_KEY = 'c8f78350f32a550eae8706406af0e12c';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_IMAGE_SMALL = 'https://image.tmdb.org/t/p/w92';

export default function ItemForm({ initialData, onSubmit, onClose }: ItemFormProps) {
  const [loading, setLoading] = useState(false);
  
  // --- Estados da Busca Dedicada ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- Estado do Formulário ---
  const [formData, setFormData] = useState({
    type: 'movie' as 'movie' | 'series',
    stremio_id: '',
    name: '',
    poster: '',
    description: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type || 'movie',
        stremio_id: initialData.stremio_id || '',
        name: initialData.name || '',
        poster: initialData.poster || '',
        description: initialData.description || ''
      });
    }
  }, [initialData]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Lógica de Busca (Debounce) ---
  const handleSearchInput = (query: string) => {
    setSearchQuery(query);
    setShowDropdown(true);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        let results = [];
        const isImdbId = query.trim().startsWith('tt'); // Detecta se é um ID IMDB

        if (isImdbId) {
          // --- Lógica para Busca por ID (Endpoint /find) ---
          const response = await fetch(
            `${TMDB_BASE_URL}/find/${query}?api_key=${TMDB_API_KEY}&external_source=imdb_id&language=pt-BR`
          );
          const data = await response.json();
          
          // O endpoint find retorna arrays separados, precisamos unificar e adicionar o media_type manualmente
          const movies = (data.movie_results || []).map((m: any) => ({ ...m, media_type: 'movie' }));
          const series = (data.tv_results || []).map((t: any) => ({ ...t, media_type: 'tv' }));
          
          results = [...movies, ...series];

        } else {
          // --- Lógica Original para Busca por Nome (Endpoint /search/multi) ---
          const response = await fetch(
            `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=pt-BR&page=1`
          );
          const data = await response.json();
          
          results = (data.results || []).filter((item: any) => 
            item.media_type === 'movie' || item.media_type === 'tv'
          );
        }

        setSearchResults(results.slice(0, 5)); // Limita a 5 resultados

      } catch (error) {
        console.error("Erro na busca:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  // --- Ao selecionar um item da Busca ---
  const handleSelectResult = async (item: any) => {
    setLoading(true);
    setShowDropdown(false);
    setSearchQuery('');
    
    try {
      // Como o endpoint /find já nos retorna o objeto, mas não garante que temos o ID externo se viemos do search/multi,
      // mantemos a lógica de buscar external_ids para garantir o ID do IMDB.
      
      const detectedType = item.media_type === 'movie' ? 'movie' : 'series';
      const dateStr = item.release_date || item.first_air_date;
      const year = dateStr ? dateStr.split('-')[0] : '';
      const rawTitle = item.title || item.name;
      const nameWithYear = year ? `${rawTitle} (${year})` : rawTitle;

      // Se já buscamos por ID (começa com tt), já temos o ID. Se não, buscamos na API.
      let imdbId = '';
      
      // Pequena otimização: Se a query original era o ID, já podemos usar
      // Mas para garantir consistência (pois o item vem do clique), vamos confirmar na API
      const endpointType = detectedType === 'movie' ? 'movie' : 'tv';
      const externalIdResponse = await fetch(
        `${TMDB_BASE_URL}/${endpointType}/${item.id}/external_ids?api_key=${TMDB_API_KEY}`
      );
      const externalIdData = await externalIdResponse.json();
      imdbId = externalIdData.imdb_id || '';

      if (!imdbId) {
        // Fallback: se buscou por ID 'tt...', usa ele mesmo se a API falhar em retornar no external_ids
        if(searchQuery.startsWith('tt')) {
            imdbId = searchQuery;
        } else {
            alert("Atenção: A TMDB não forneceu um ID IMDB para este item. O campo ID ficará vazio.");
        }
      }

      setFormData({
        type: detectedType,
        stremio_id: imdbId,
        name: nameWithYear,
        description: item.overview,
        poster: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : ''
      });

    } catch (error) {
      console.error("Erro ao carregar detalhes:", error);
      alert("Erro ao carregar detalhes do item.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleIdSearch = async () => {
    if (!formData.stremio_id) return;
    setLoading(true);
    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/find/${formData.stremio_id}?api_key=${TMDB_API_KEY}&external_source=imdb_id&language=pt-BR`
        );
        const data = await response.json();
        
        let result = null;
        let detectedType: 'movie' | 'series' = formData.type;
  
        if (data.movie_results && data.movie_results.length > 0) {
          result = data.movie_results[0];
          detectedType = 'movie';
        } else if (data.tv_results && data.tv_results.length > 0) {
          result = data.tv_results[0];
          detectedType = 'series';
        }
  
        if (result) {
          const dateStr = result.release_date || result.first_air_date;
          const year = dateStr ? dateStr.split('-')[0] : '';
          const rawTitle = result.title || result.name;
          const nameWithYear = year ? `${rawTitle} (${year})` : rawTitle;
  
          setFormData(prev => ({
            ...prev,
            type: detectedType,
            name: nameWithYear,
            description: result.overview,
            poster: result.poster_path ? `${TMDB_IMAGE_BASE}${result.poster_path}` : prev.poster
          }));
        } else {
            alert('ID não encontrado na TMDB.');
        }

    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const isEditing = !!initialData;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-visible border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            {isEditing ? 'Editar Item' : 'Adicionar Item'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 dark:text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          
          {!isEditing && (
            <div className="mb-8 relative" ref={dropdownRef}>
                <label className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                    <Sparkles className="w-4 h-4" />
                    Preenchimento Automático
                </label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearchInput(e.target.value)}
                        placeholder="Pesquise por Nome ou ID (ex: tt12345)..."
                        className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white shadow-sm transition-all"
                    />
                    {isSearching && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
                        </div>
                    )}
                </div>

                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[320px] overflow-y-auto">
                    {searchResults.map((item) => {
                       const year = (item.release_date || item.first_air_date || '').split('-')[0];
                       const title = item.title || item.name;
                       return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectResult(item)}
                          className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 text-left group"
                        >
                          <div className="w-12 h-16 bg-slate-200 dark:bg-slate-800 rounded-md overflow-hidden shrink-0 shadow-sm relative">
                            {item.poster_path ? (
                                <img src={`${TMDB_IMAGE_SMALL}${item.poster_path}`} alt={title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400"><ImageIcon className="w-5 h-5"/></div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{year}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wide ${
                                    item.media_type === 'movie' 
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                }`}>
                                    {item.media_type === 'movie' ? 'Filme' : 'Série'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 truncate mt-1 max-w-[90%]">
                                {item.overview || 'Sem descrição...'}
                            </p>
                          </div>
                        </button>
                       )
                    })}
                  </div>
                )}
            </div>
          )}

          {!isEditing && <div className="h-px bg-slate-200 dark:bg-slate-700 w-full mb-6"></div>}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[1.2fr,0.8fr] gap-6">
            
            <div className="space-y-5">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tipo</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={isEditing}
                    onClick={() => handleChange('type', 'movie')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold transition-all border ${
                      formData.type === 'movie'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-900/20'
                        : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-100 dark:hover:bg-slate-600'
                    } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Film className="w-4 h-4" />
                    Filme
                  </button>
                  <button
                    type="button"
                    disabled={isEditing}
                    onClick={() => handleChange('type', 'series')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-bold transition-all border ${
                      formData.type === 'series'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-900/20'
                        : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-100 dark:hover:bg-slate-600'
                    } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Tv className="w-4 h-4" />
                    Série
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Stremio ID (IMDB)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.stremio_id}
                    onChange={(e) => handleChange('stremio_id', e.target.value)}
                    disabled={isEditing}
                    placeholder="tt1234567"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm dark:text-white ${isEditing ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={handleIdSearch}
                    disabled={isEditing || loading || !formData.stremio_id}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg transition-colors flex items-center justify-center border border-slate-200 dark:border-slate-600"
                    title="Verificar ID"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:text-white text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-4">
               <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">URL do Poster</label>
                <input
                  type="url"
                  value={formData.poster}
                  onChange={(e) => handleChange('poster', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm"
                />
              </div>

              <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden relative group min-h-[200px]">
                {formData.poster ? (
                  <>
                    <img 
                      src={formData.poster} 
                      alt="Poster Preview" 
                      className="w-full h-full object-cover absolute inset-0 transition-transform group-hover:scale-105 duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
                    />
                  </>
                ) : (
                  <div className="text-center p-4 text-slate-400">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <span className="text-sm">Pré-visualização</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="col-span-1 md:col-span-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl transition-colors font-bold shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {isEditing ? 'Salvar Alterações' : 'Adicionar Item'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}