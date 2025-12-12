
import React, { useState, useEffect, useRef } from 'react';
import { ConfigState, Language } from '../types';
import { ICONS, OLLAMA_MODELS, LANGUAGE_LABELS } from '../constants';

interface ConfigurationProps {
  config: ConfigState;
  onSave: (newConfig: ConfigState) => void;
}

const Configuration: React.FC<ConfigurationProps> = ({ config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<ConfigState>(config);
  const [isSaved, setIsSaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Refs for directory inputs
  const dirInputRefs = {
      es: useRef<HTMLInputElement>(null),
      eu: useRef<HTMLInputElement>(null),
      en: useRef<HTMLInputElement>(null)
  };

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleSave = () => {
    onSave(localConfig);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Handle directory selection
  const handleDirectoryPick = (lang: Language, e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          // In a browser, we can't get the full OS path for security reasons (it shows empty or fake path).
          // However, we can get the File object which gives us the relative path if files are selected,
          // or we can simply use the folder name to simulate the config update.
          // For this prototype, we will simulate the path based on the selected folder name.
          
          const files = e.target.files;
          let folderName = "Carpeta Seleccionada";
          
          // Try to get webkitRelativePath from the first file to guess the folder structure
          if (files[0] && files[0].webkitRelativePath) {
              folderName = files[0].webkitRelativePath.split('/')[0];
          }

          const simulatedPath = `./${folderName}/${lang}`;
          
          setLocalConfig({
              ...localConfig,
              storagePaths: {
                  ...localConfig.storagePaths,
                  [lang]: simulatedPath
              }
          });
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ICONS.Settings className="text-orange-500" />
            Configuración del Agente
          </h2>
          <p className="text-slate-500 mt-1">
            Ajusta los parámetros del modelo de lenguaje y las rutas de almacenamiento.
          </p>
        </div>
      </div>

      {/* Storage Paths Config */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
           <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <ICONS.Folder size={18} />
              Gestión de Archivos (JSON)
           </h3>
        </div>
        <div className="p-8 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mb-4 flex gap-3">
                <ICONS.AlertCircle className="shrink-0 mt-0.5" size={18} />
                <div>
                    <p className="font-bold">Estructura de Archivos</p>
                    <p>Al seleccionar una carpeta, el sistema generará automáticamente los siguientes ficheros JSON en ella:</p>
                    <ul className="list-disc list-inside mt-2 font-mono text-xs text-blue-700 space-y-1">
                        <li>/tests_provisionales.json</li>
                        <li>/historial_tests.json</li>
                        <li>/examenes/examen_[fecha].json</li>
                        <li>/examenes/resultados_[fecha].json</li>
                    </ul>
                </div>
            </div>

            {(Object.keys(LANGUAGE_LABELS) as Language[]).map(lang => (
                <div key={lang} className="flex items-center gap-4 border-b border-slate-100 pb-4 last:border-0">
                    <div className="w-32 font-bold text-sm text-slate-700 uppercase flex items-center gap-2">
                        <span className="bg-slate-200 text-slate-600 w-6 h-6 rounded flex items-center justify-center text-xs">{lang.toUpperCase()}</span>
                        {LANGUAGE_LABELS[lang]}
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex gap-2">
                             <div className="flex-1 relative">
                                <ICONS.FolderOpen size={16} className="absolute left-3 top-3 text-slate-400" />
                                <input 
                                    type="text" 
                                    readOnly
                                    value={localConfig.storagePaths[lang]}
                                    className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs text-slate-600 focus:outline-none cursor-not-allowed"
                                />
                             </div>
                             
                             <input 
                                type="file"
                                ref={dirInputRefs[lang]}
                                style={{ display: 'none' }}
                                onChange={(e) => handleDirectoryPick(lang, e)}
                                // @ts-ignore - webkitdirectory is non-standard but supported in most browsers
                                webkitdirectory="" 
                                directory=""
                             />
                             
                             <button 
                                onClick={() => dirInputRefs[lang].current?.click()}
                                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                             >
                                <ICONS.Search size={16} />
                                Examinar
                             </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
           <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <ICONS.Cpu size={18} />
              Proveedor de Inferencia
           </h3>
        </div>
        
        <div className="p-8">
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setLocalConfig({...localConfig, provider: 'ollama'})}
                    className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                        localConfig.provider === 'ollama' 
                        ? 'border-orange-500 bg-orange-50 text-orange-900' 
                        : 'border-slate-200 hover:border-slate-300 text-slate-500'
                    }`}
                >
                    <ICONS.Server size={24} />
                    <span className="font-bold">Ollama (Local/Docker)</span>
                </button>
                <button
                    onClick={() => setLocalConfig({...localConfig, provider: 'external'})}
                    className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                        localConfig.provider === 'external' 
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-900' 
                        : 'border-slate-200 hover:border-slate-300 text-slate-500'
                    }`}
                >
                    <ICONS.Cloud size={24} />
                    <span className="font-bold">API Externa (LLM)</span>
                </button>
            </div>

            {localConfig.provider === 'ollama' ? (
                <div className="space-y-6 animate-fade-in">
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Base URL</label>
                      <div className="flex gap-2">
                        <input
                            type="text"
                            value={localConfig.ollamaUrl}
                            onChange={(e) => setLocalConfig({...localConfig, ollamaUrl: e.target.value})}
                            className="flex-1 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none font-mono text-sm"
                            placeholder="http://localhost:11434"
                        />
                        <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors">
                            Test Conexión
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Dirección del servicio Ollama corriendo en el contenedor Docker.</p>
                   </div>
        
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Modelo LLM Seleccionado</label>
                      <select
                        value={localConfig.selectedModel}
                        onChange={(e) => setLocalConfig({...localConfig, selectedModel: e.target.value})}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      >
                         {OLLAMA_MODELS.map(model => (
                             <option key={model} value={model}>{model}</option>
                         ))}
                      </select>
                      <p className="text-xs text-slate-400 mt-1">El modelo debe haber sido previamente descargado con <code>ollama pull {localConfig.selectedModel}</code>.</p>
                   </div>
                </div>
            ) : (
                <div className="space-y-6 animate-fade-in">
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-2">Nombre del Modelo</label>
                       <input
                           type="text"
                           value={localConfig.externalModel || ''}
                           onChange={(e) => setLocalConfig({...localConfig, externalModel: e.target.value})}
                           className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                           placeholder="ej: gpt-4o, claude-3-opus, etc."
                       />
                       <p className="text-xs text-slate-400 mt-1">Identificador del modelo a utilizar en la API.</p>
                    </div>

                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-2">API Key</label>
                       <div className="relative">
                           <input
                               type={showApiKey ? "text" : "password"}
                               value={localConfig.externalApiKey || ''}
                               onChange={(e) => setLocalConfig({...localConfig, externalApiKey: e.target.value})}
                               className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                               placeholder="sk-..."
                           />
                           <button 
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                           >
                                <ICONS.Key size={18} />
                           </button>
                       </div>
                       <p className="text-xs text-slate-400 mt-1">Clave de acceso al servicio. Se almacena localmente en el navegador.</p>
                    </div>
                </div>
            )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <ICONS.Sliders size={18} />
                Parámetros de Inferencia
            </h3>
         </div>
         
         <div className="p-8 space-y-8">
            <div>
               <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">Temperature (Creatividad)</label>
                  <span className="text-sm font-mono bg-slate-100 px-2 rounded text-slate-600">{localConfig.temperature}</span>
               </div>
               <input 
                 type="range" 
                 min="0" 
                 max="1" 
                 step="0.1"
                 value={localConfig.temperature}
                 onChange={(e) => setLocalConfig({...localConfig, temperature: parseFloat(e.target.value)})}
                 className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
               />
               <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>0.0 (Determinista)</span>
                  <span>1.0 (Creativo)</span>
               </div>
            </div>

            <div>
               <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">Top K (RAG Retrieval)</label>
                  <span className="text-sm font-mono bg-slate-100 px-2 rounded text-slate-600">{localConfig.topK}</span>
               </div>
               <input 
                 type="range" 
                 min="1" 
                 max="100" 
                 step="1"
                 value={localConfig.topK}
                 onChange={(e) => setLocalConfig({...localConfig, topK: parseInt(e.target.value)})}
                 className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
               />
               <p className="text-xs text-slate-400 mt-1">Número de fragmentos de documentos a recuperar del índice FAISS.</p>
            </div>
         </div>
      </div>

      <div className="flex justify-end pt-4">
          <button
             onClick={handleSave}
             className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all transform hover:-translate-y-1 ${
                 isSaved ? 'bg-green-500' : 'bg-slate-900 hover:bg-slate-800'
             }`}
          >
             {isSaved ? (
                 <>
                    <ICONS.CheckCircle size={20} />
                    Configuración Guardada
                 </>
             ) : (
                 <>
                    <ICONS.Save size={20} />
                    Guardar Cambios
                 </>
             )}
          </button>
      </div>
    </div>
  );
};

export default Configuration;
