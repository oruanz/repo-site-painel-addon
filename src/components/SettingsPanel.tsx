import React, { useState } from 'react';
import { X, Save, Key, ShieldCheck } from 'lucide-react';

interface SettingsPanelProps {
  onClose: () => void;
  adminKey: string;
  // CORREÇÃO: Adicionamos onSave à interface para aceitar a função do App.tsx
  onSave: (newKey: string) => void;
  // Deixamos setAdminKey opcional para compatibilidade, caso seja passado
  setAdminKey?: (newKey: string) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose, adminKey, onSave }) => {
  // Estado local para o input, inicializado com a chave atual
  const [localKey, setLocalKey] = useState(adminKey);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Chama a função do pai para salvar no state e localStorage
    onSave(localKey);
    
    // Feedback visual rápido antes de fechar (opcional, mas agradável)
    setShowSuccess(true);
    setTimeout(() => {
        onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2 text-slate-800">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-lg">Configurações</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Key size={16} /> Admin Key
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Esta chave é usada para autenticar suas requisições na API. Se você não configurá-la, não conseguirá adicionar ou editar itens.
            </p>
            <input
              type="text"
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="Digite sua chave de API..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm text-slate-700"
            />
          </div>

          <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg border border-blue-100">
            <strong>Nota:</strong> A chave será salva no seu navegador (LocalStorage) para que você não precise digitá-la toda vez.
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
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
                  <Save size={18} /> Salvar Configuração
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