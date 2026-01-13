import React, { useState, useEffect } from 'react';
import { Link, Hash, X, Save, Search, Loader2, FileVideo, CheckCircle2, AlertTriangle, FileText, Eye, EyeOff, Zap, Skull, CheckCheck, WifiOff } from 'lucide-react';

interface StreamFormProps {
  itemId?: number;
  itemType: 'movie' | 'series';
  initialData?: any;
  onSubmit: (stream: any) => void;
  onCancel?: () => void;
}

interface RDFile {
  id: number;
  path: string;
  bytes: number;
  selected: number;
  videoIndex: number | null;
  cached: boolean;
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

  const [showFileSelector, setShowFileSelector] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [torrentFiles, setTorrentFiles] = useState<RDFile[]>([]);
  const [rdError, setRdError] = useState('');
  const [showAllFiles, setShowAllFiles] = useState(false); 
  
  // ESTADOS DE SAÚDE E PROGRESSO
  const [torrentSeeds, setTorrentSeeds] = useState<number>(0);
  const [isCached, setIsCached] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [rdStatus, setRdStatus] = useState<string>('');
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadSpeed, setDownloadSpeed] = useState<number>(0);
  const [activeTorrentId, setActiveTorrentId] = useState<string | null>(null);

  const qualityOptions = ['4K (UHD)', '1080p (FHD)', '720p (HD)', 'HDCAM'];
  const audioOptions = ['Dublado', 'Legendado', 'Dual Áudio', 'Original'];

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // 1. EFEITO PARA CARREGAR DADOS INICIAIS
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

  // 2. EFEITO PARA ATUALIZAÇÃO EM TEMPO REAL (CORRIGIDO: NO NÍVEL DA RAIZ)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    // Só roda se tivermos um ID, o modal estiver aberto e o download não estiver concluído/morto
    if (activeTorrentId && showFileSelector && rdStatus !== 'downloaded' && rdStatus !== 'dead' && rdStatus !== 'error') {
      
      interval = setInterval(async () => {
        const rawKey = localStorage.getItem('RD_KEY');
        const rdKey = rawKey ? rawKey.replace(/['"]+/g, '').trim() : '';
        if (!rdKey) return;

        try {
          // Usa o backend para pegar info e evitar bloqueios
          const response = await fetch(`https://apimapyngua.mapyngua.com.br/api/rd/info/${activeTorrentId}`, {
            headers: { 'Authorization': `Bearer ${rdKey}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            
            setRdStatus(data.status);
            setDownloadProgress(data.progress || 0);
            setDownloadSpeed(data.speed || 0);
            setTorrentSeeds(data.seeders || 0);

            // Se acabou de terminar o download, atualiza a lista para ficar tudo verde
            if (data.status === 'downloaded') {
              setIsDownloaded(true);
              setIsCached(true);
              setTorrentFiles(prevFiles => prevFiles.map(f => ({ ...f, cached: true })));
            }
          }
        } catch (error) {
          console.error("Erro ao atualizar status:", error);
        }
      }, 2000); // Atualiza a cada 2 segundos
    }

    return () => clearInterval(interval);
  }, [activeTorrentId, showFileSelector, rdStatus]);


  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const handleFetchFiles = async () => {
    const rawKey = localStorage.getItem('RD_KEY');
    const rdKey = rawKey ? rawKey.replace(/['"]+/g, '').trim() : '';
    const API_BASE = 'https://apimapyngua.mapyngua.com.br/api';
    
    if (!rdKey || rdKey.length < 10) {
      setRdError('Token RealDebrid inválido. Verifique configurações.');
      setShowFileSelector(true);
      return;
    }
    if (!magnetHash) {
      setRdError('Cole o Hash ou Magnet Link.');
      setShowFileSelector(true);
      return;
    }

    let finalMagnet = magnetHash.trim();
    let infoHash = '';

    const hashMatch = finalMagnet.match(/([a-fA-F0-9]{40})/);
    if (hashMatch) {
        infoHash = hashMatch[0].toLowerCase();
        if (!finalMagnet.startsWith('magnet:?')) {
            finalMagnet = `magnet:?xt=urn:btih:${infoHash}`;
        }
    } else {
        setRdError('Formato inválido! Hash não encontrado.');
        setShowFileSelector(true);
        return;
    }

    setLoadingFiles(true);
    setLoadingMessage('Verificando Cache...');
    setRdError('');
    setShowFileSelector(true);
    setTorrentFiles([]);
    setTorrentSeeds(0);
    setIsCached(false);
    setIsDownloaded(false);
    setRdStatus('');
    setDownloadProgress(0);
    setDownloadSpeed(0);

    try {
      // 1. Disponibilidade: Ignorada para evitar erro 403.
      // O status 'downloaded' no info resolverá isso.
      setIsCached(false);

      // 2. Adicionar Magnet (Proxy Backend)
      setLoadingMessage('Adicionando torrent...');
      const addResponse = await fetch(`${API_BASE}/rd/addMagnet`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${rdKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ magnet: finalMagnet })
      });

      if (!addResponse.ok) {
          const errData = await addResponse.json().catch(() => ({}));
          if (errData.error_code === 8) throw new Error('Token Inválido (Bad Token).');
          if (errData.error_code === 5) throw new Error('Magnet Link inválido.');
          throw new Error(errData.error || `Erro RD: ${addResponse.status}`);
      }
      
      const addData = await addResponse.json();
      const torrentId = addData.id;
      
      // Define o ID para o useEffect começar a monitorar
      setActiveTorrentId(torrentId);

      // 3. AUTO-SELECT (CORRIGIDO: Via Backend Próprio para evitar CORS)
      try {
          setLoadingMessage('Iniciando download...');
          await fetch(`${API_BASE}/rd/selectFiles/${torrentId}`, {
              method: 'POST',
              headers: { 
                  'Authorization': `Bearer ${rdKey}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ files: 'all' })
          });
      } catch (e) { 
          console.warn('Auto-select warning:', e); 
      }

      // 4. Loop Inicial de Status (Info)
      // Fazemos um loop rápido aqui para garantir que a lista de arquivos carregue
      // antes de liberar o controle para o useEffect
      setLoadingMessage('Analisando status...');
      
      let infoData = null;
      let attempts = 0;
      const maxAttempts = 10; 

      while (attempts < maxAttempts) {
          const infoResponse = await fetch(`${API_BASE}/rd/info/${torrentId}`, {
            headers: { 'Authorization': `Bearer ${rdKey}` }
          });

          if (!infoResponse.ok) throw new Error('Erro ao ler status.');
          infoData = await infoResponse.json();

          setRdStatus(infoData.status);
          setDownloadProgress(infoData.progress || 0);
          setDownloadSpeed(infoData.speed || 0);
          setTorrentSeeds(infoData.seeders || 0);

          if (infoData.status === 'downloaded') {
              setIsDownloaded(true);
              setIsCached(true); 
              break; 
          }
          
          if (infoData.status === 'downloading') {
             setLoadingMessage(`Baixando... ${infoData.progress}% (${formatBytes(infoData.speed)}/s)`);
             // Tenta algumas vezes para pegar velocidade > 0
             if (attempts > 2) break; 
          }

          if (infoData.files && infoData.files.length > 0 && infoData.status !== 'waiting_files_selection') {
              if (infoData.status === 'downloading' || infoData.seeders > 0) break;
          }

          if (infoData.status === 'dead' || infoData.status === 'error') break;

          attempts++;
          if (attempts < maxAttempts) await wait(1000); 
      }

      if (!infoData || !infoData.files || infoData.files.length === 0) {
          throw new Error('O RealDebrid não retornou arquivos.');
      }

      // 5. Processar Arquivos
      let videoCounter = 0;
      const processedFiles = infoData.files.map((file: any) => {
          const isVideo = /\.(mp4|mkv|avi|mov|wmv|flv|webm)$/i.test(file.path);
          // Se o torrent inteiro tá baixado, tudo é cached. Se não, verificamos o ID (lógica simplificada)
          const fileIsCached = infoData.status === 'downloaded';
          return {
              ...file,
              videoIndex: isVideo ? videoCounter++ : null,
              cached: fileIsCached
          };
      });

      setTorrentFiles(processedFiles);

    } catch (error: any) {
      console.error(error);
      setRdError(error.message || 'Falha ao processar.');
    } finally {
      setLoadingFiles(false);
      setLoadingMessage('');
    }
  };

  const handleSelectFile = (vIndex: number) => {
    setFileIndex(String(vIndex));
    setShowFileSelector(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const stream: any = {
      name: name || null, description: description || null,
      season: itemType === 'series' ? (season ? Number(season) : null) : null,
      episode: itemType === 'series' ? (episode ? Number(episode) : null) : null
    };

    if (streamType === 'url') {
      stream.url = url; stream.magnet_hash = null; stream.file_index = null;
    } else {
      stream.magnet_hash = magnetHash; stream.url = null;
      if (fileIndex !== '') stream.file_index = Number(fileIndex);
    }
    onSubmit(stream);
  };

  const QuickButton = ({ label, onClick }: { label: string, onClick: () => void }) => (
    <button type="button" onClick={onClick} className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-700/50 transition-colors">
      {label}
    </button>
  );

  const visibleFiles = torrentFiles.filter(f => {
      if (showAllFiles) return true;
      return typeof f.videoIndex === 'number'; 
  });

  // --- LÓGICA DE STATUS VISUAL ---
  const isPerfect = isCached || isDownloaded;
  const isDownloading = rdStatus === 'downloading';
  const hasFiles = torrentFiles.length > 0;
  
  // Se está baixando mas a velocidade é 0, alerta o usuário
  const isStalled = isDownloading && downloadSpeed === 0;

  // Lógica principal
  const isViable = !isPerfect && hasFiles; 

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 min-h-0 relative">
      <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex-none bg-white dark:bg-slate-800">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{!!initialData ? 'Editar Stream' : `Novo Stream ${itemType === 'series' ? '(Episódio)' : ''}`}</h3>
        {onCancel && <button onClick={onCancel} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><X className="w-6 h-6" /></button>}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {itemType === 'series' && (
            <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex-1"><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Temporada (S)</label><input type="number" min="1" value={season} onChange={(e) => setSeason(e.target.value)} placeholder="1" className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-center font-mono font-bold" required /></div>
              <div className="flex-1"><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Episódio (E)</label><input type="number" min="1" value={episode} onChange={(e) => setEpisode(e.target.value)} placeholder="1" className="w-full px-3 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-center font-mono font-bold" required /></div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Fonte do Conteúdo</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStreamType('torrent')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${streamType === 'torrent' ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'}`}><Hash className="w-4 h-4" /> Torrent</button>
              <button type="button" onClick={() => setStreamType('url')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${streamType === 'url' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'}`}><Link className="w-4 h-4" /> URL Direta</button>
            </div>
          </div>

          {streamType === 'torrent' ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Info Hash / Magnet *</label>
                <div className="flex gap-2">
                  <input type="text" value={magnetHash} onChange={(e) => setMagnetHash(e.target.value)} placeholder="Magnet Link ou Hash..." className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm dark:text-white truncate" required />
                  <button type="button" onClick={handleFetchFiles} className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white px-4 rounded-xl border border-slate-200 dark:border-slate-600 transition-colors"><Search className="w-5 h-5" /></button>
                </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Índice do Arquivo (Video Index)</label>
                  <input type="number" value={fileIndex} onChange={(e) => setFileIndex(e.target.value)} placeholder="0" className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm dark:text-white" />
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">URL do Vídeo *</label><input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://exemplo.com/video.mp4" className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm dark:text-white" required />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-end mb-2"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nome do Stream</label></div>
              <div className="flex flex-wrap gap-2 mb-2">{qualityOptions.map(opt => (<QuickButton key={opt} label={opt} onClick={() => setName(opt)} />))}</div>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={itemType === 'series' ? "Ex: S01E01 - 1080p" : "Ex: 4K HDR"} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-white" />
            </div>
            <div>
              <div className="flex justify-between items-end mb-2"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Descrição</label></div>
              <div className="flex flex-wrap gap-2 mb-2">{audioOptions.map(opt => (<QuickButton key={opt} label={opt} onClick={() => setDescription(opt)} />))}</div>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Dublado / Legendado" className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-white" />
            </div>
          </div>
          <div className="h-4"></div>
        </div>

        <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-none z-10">
            <button type="submit" className={`w-full px-4 py-3.5 text-white rounded-xl transition-transform active:scale-95 font-bold flex items-center justify-center gap-2 shadow-lg ${!!initialData ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20' : 'bg-green-600 hover:bg-green-700 shadow-green-900/20'}`}>
            <Save className="w-5 h-5" />{!!initialData ? 'Salvar Alterações' : 'Adicionar Stream'}</button>
        </div>
      </form>

      {/* --- MODAL SELETOR DE ARQUIVOS (OVERLAY) --- */}
      {showFileSelector && (
        <div className="absolute inset-0 z-50 bg-white dark:bg-slate-800 flex flex-col animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><FileVideo className="w-5 h-5 text-blue-600" /> Selecionar Arquivo</h4>
            <div className="flex items-center gap-2">
                <button type="button" onClick={() => setShowAllFiles(!showAllFiles)} className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1.5 rounded-lg flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600">
                   {showAllFiles ? <EyeOff className="w-3 h-3"/> : <Eye className="w-3 h-3"/>} {showAllFiles ? 'Ocultar Extras' : 'Mostrar Tudo'}
                </button>
                <button type="button" onClick={() => setShowFileSelector(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {loadingFiles ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3 text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                  <p className="font-medium text-slate-700 dark:text-slate-200">{loadingMessage}</p>
              </div>
            ) : rdError ? (
              <div className="flex flex-col items-center justify-center h-full text-red-500 gap-3 text-center p-4"><AlertTriangle className="w-10 h-10 bg-red-100 dark:bg-red-900/30 p-2 rounded-full" /><p className="font-semibold">{rdError}</p><button onClick={() => setShowFileSelector(false)} className="text-sm underline hover:text-red-600">Fechar</button></div>
            ) : torrentFiles.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2"><p>Nenhum arquivo encontrado.</p></div>
            ) : (
              <div className="space-y-2">
                
                {/* --- BARRA DE STATUS INTELIGENTE --- */}
                <div className={`p-3 rounded-xl border flex items-center gap-3 mb-4
                    ${isPerfect ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 
                      isDownloading ? (isStalled ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' : 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800') :
                      isViable ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 
                      'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                    }
                `}>
                    <div className={`p-2 rounded-full flex-none
                      ${isPerfect ? 'bg-green-100 text-green-600' : 
                        isDownloading ? (isStalled ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600') :
                        isViable ? 'bg-blue-100 text-blue-600' : 
                        'bg-red-100 text-red-600'}`}>
                        {isPerfect ? <Zap className="w-5 h-5" /> : 
                         isDownloading ? (isStalled ? <WifiOff className="w-5 h-5" /> : <Loader2 className="w-5 h-5 animate-spin" />) :
                         isViable ? <CheckCircle2 className="w-5 h-5" /> : 
                         <Skull className="w-5 h-5" />}
                    </div>
                    <div>
                        <h5 className={`font-bold text-sm 
                          ${isPerfect ? 'text-green-700 dark:text-green-300' : 
                            isDownloading ? (isStalled ? 'text-orange-700 dark:text-orange-300' : 'text-indigo-700 dark:text-indigo-300') :
                            isViable ? 'text-blue-700 dark:text-blue-300' : 
                            'text-red-700 dark:text-red-300'}`}>
                            {isPerfect ? 'PERFEITO (Cache Instantâneo)' : 
                             isDownloading ? (isStalled ? `BAIXANDO (Lento/Sem Seeds)` : `BAIXANDO (${downloadProgress}%)`) :
                             isViable ? 'DISPONÍVEL PARA DOWNLOAD' : 
                             'ERRO / NÃO ENCONTRADO'}
                        </h5>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            {isPerfect ? 'Este arquivo já está pronto no RealDebrid. Reprodução imediata.' : 
                             isDownloading ? `O RealDebrid está baixando. Vel: ${formatBytes(downloadSpeed)}/s. Seeds: ${torrentSeeds}.` :
                             isViable ? `Status: ${rdStatus}. Você pode adicionar, o download começará automaticamente.` : 
                             'Não foi possível ler os arquivos deste magnet.'}
                        </p>
                    </div>
                </div>

                {visibleFiles.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-4"><p>Nenhum vídeo encontrado.</p><button onClick={() => setShowAllFiles(true)} className="text-blue-500 underline text-sm">Mostrar todos os arquivos</button></div>
                )}

                {visibleFiles.map((file) => {
                  const isVideo = typeof file.videoIndex === 'number'; 
                  const isSelected = isVideo && String(file.videoIndex) === fileIndex;
                  const itemCached = file.cached; 

                  return (
                    <button 
                        key={file.id} 
                        type="button" 
                        onClick={() => isVideo && handleSelectFile(file.videoIndex as number)} 
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all group relative overflow-hidden
                            ${!isVideo ? 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-60 cursor-not-allowed' : 
                              itemCached ? 'border-green-500/30 hover:border-green-500 bg-green-50/50 dark:bg-green-900/10' : 
                              'border-slate-200 hover:border-blue-500 dark:border-slate-700 dark:hover:border-blue-500'}
                            ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : ''}
                        `}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 p-2 rounded-lg transition-colors flex items-center justify-center
                            ${isVideo ? (itemCached ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500') : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}
                        `}>
                           {!isVideo ? <FileText className="w-5 h-5"/> : itemCached ? <CheckCheck className="w-5 h-5" /> : <FileVideo className="w-5 h-5" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm break-all leading-tight text-slate-800 dark:text-slate-100">
                            {file.path.startsWith('/') ? file.path.substring(1) : file.path}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                             {isVideo && itemCached && (
                                 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800 flex items-center gap-1">
                                      <Zap className="w-3 h-3"/> Pronto
                                 </span>
                             )}

                             <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                {isVideo ? `Video #${file.videoIndex}` : `ID: ${file.id}`}
                             </span>
                             
                             <span className="text-[10px] font-bold text-slate-500">{formatBytes(file.bytes)}</span>
                          </div>
                        </div>

                        {isSelected && (
                            <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full shadow-sm">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}