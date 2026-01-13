import React, { useState, useEffect } from 'react';
import { X, Save, Key, ShieldCheck, Database } from 'lucide-react';

interface SettingsPanelProps {
  onClose: () => void;
  // Recebe os valores atuais
  adminKey: string;
  rdKey: string; 
  // Retorna um objeto com as duas chaves atualizadas
  onSave: (keys: { adminKey: string; rdKey: string }) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose, adminKey, rdKey, onSave }) => {
  // Estados locais para os inputs
  const [localAdminKey, setLocalAdminKey] = useState(adminKey);
  const [localRdKey, setLocalRdKey] = useState(rdKey);
  
  const [showSuccess, setShowSuccess] = useState(false);

  // Garante que o estado local esteja sincronizado se as props mudarem
  useEffect(() => {
    setLocalAdminKey(adminKey);
    setLocalRdKey(rdKey);
  }, [adminKey, rdKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Envia ambas as chaves para o pai
    onSave({ 
        adminKey: localAdminKey, 
        rdKey: localRdKey 
    });
    
    setShowSuccess(true);
    setTimeout(() => {
        onClose();
        setShowSuccess(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-900 p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-lg">Configurações</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* CAMPO 1: ADMIN KEY */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Key size={16} className="text-blue-500" /> Admin API Key
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Chave mestra para autenticar no seu painel administrativo.
            </p>
            <input
              type="text"
              value={localAdminKey}
              onChange={(e) => setLocalAdminKey(e.target.value)}
              placeholder="Sua chave de Admin..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-mono text-sm"
            />
          </div>

          <hr className="border-slate-100 dark:border-slate-700" />

          {/* CAMPO 2: REAL DEBRID KEY */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
              <Database size={16} className="text-green-600" /> RealDebrid API Token
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Sua chave pessoal do RD (Master) para uso futuro/testes.
            </p>
            <input
              type="text"
              value={localRdKey}
              onChange={(e) => setLocalRdKey(e.target.value)}
              placeholder="Seu token pessoal do RealDebrid..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:text-white font-mono text-sm"
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs p-3 rounded-lg border border-blue-100 dark:border-blue-800">
            <strong>Nota:</strong> As chaves são salvas localmente no seu navegador.
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-all ${
                showSuccess ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {showSuccess ? (
                'Salvo!'
              ) : (
                <>
                  <Save size={18} /> Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPanel;