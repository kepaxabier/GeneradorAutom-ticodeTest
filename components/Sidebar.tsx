
import React from 'react';
import { ViewMode, Language } from '../types';
import { ICONS, LANGUAGE_LABELS } from '../constants';

interface SidebarProps {
  currentView: ViewMode;
  setView: (view: ViewMode) => void;
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, currentLanguage, setLanguage }) => {
  const menuItems: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <ICONS.Server size={20} /> },
    { id: 'configuration', label: 'Configuración LLM', icon: <ICONS.Settings size={20} /> },
    { id: 'test-solver', label: 'Resolver Test (RAG)', icon: <ICONS.Terminal size={20} /> },
    { id: 'history', label: 'Historial de Tests', icon: <ICONS.Archive size={20} /> },
    { id: 'documents', label: 'Gestión Documental', icon: <ICONS.BookOpen size={20} /> },
    { id: 'evaluation', label: 'Evaluación del Retriever', icon: <ICONS.CheckCircle size={20} /> },
  ];

  return (
    <div className="w-64 bg-slate-900 text-slate-100 h-screen flex flex-col fixed left-0 top-0 shadow-xl z-10">
      <div className="p-6 border-b border-slate-700 flex items-center gap-3">
        <div className="bg-orange-500 p-2 rounded-lg">
           <ICONS.Cpu className="text-white" size={24} />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">Agente ISO</h1>
          <p className="text-xs text-slate-400">Ubuntu 24.04</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentView === item.id
                ? 'bg-orange-600 text-white shadow-md transform scale-105'
                : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            {item.icon}
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Language Selector */}
      <div className="p-4 border-t border-slate-800">
         <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Idioma de Trabajo</p>
         <div className="grid grid-cols-3 gap-2">
             {(['es', 'eu', 'en'] as Language[]).map((lang) => (
                 <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`text-xs py-1.5 px-2 rounded font-bold border transition-colors ${
                        currentLanguage === lang 
                        ? 'bg-slate-100 text-slate-900 border-white' 
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                    title={LANGUAGE_LABELS[lang]}
                 >
                    {lang.toUpperCase()}
                 </button>
             ))}
         </div>
         <p className="text-[10px] text-slate-500 mt-2 text-center">
             Ruta: ./data/{currentLanguage}/...
         </p>
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800 p-3 rounded-md text-xs text-slate-400">
          <p className="font-semibold text-slate-200 mb-1">Estado del Sistema</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Docker: Activo</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>RAG: FAISS Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
