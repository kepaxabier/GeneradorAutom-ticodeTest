
import React, { useRef, useState } from 'react';
import { DocumentFile, AutoTestConfig, Language, Difficulty } from '../types';
import { ICONS, LANGUAGE_LABELS } from '../constants';

interface DocumentUploadProps {
  documents: DocumentFile[];
  onUpload: (files: FileList) => void;
  onDelete: (id: string) => void;
  onGenerateAutoTests?: (config: AutoTestConfig) => void;
  isLoading?: boolean;
  onAnalyzeTopics?: () => void;
  availableTopics?: string[];
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
    documents, 
    onUpload, 
    onDelete, 
    onGenerateAutoTests, 
    isLoading,
    onAnalyzeTopics,
    availableTopics = []
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Generation Modal State
  const [showGenModal, setShowGenModal] = useState(false);
  const [genConfig, setGenConfig] = useState<AutoTestConfig>({
      topic: "Evaluación Global (Mezcla aleatoria)",
      count: 5,
      language: 'es', 
      difficulty: 'intermediate'
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
  };

  const handleGenerateClick = () => {
     if (onGenerateAutoTests) {
         onGenerateAutoTests(genConfig);
         setShowGenModal(false);
     }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'pdf': return <ICONS.FileText className="text-red-500" />;
      case 'docx': return <ICONS.FileText className="text-blue-500" />;
      case 'txt': return <ICONS.FileText className="text-slate-500" />;
      default: return <ICONS.File className="text-slate-400" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in relative">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ICONS.BookOpen className="text-orange-500" />
            Base de Conocimiento
          </h2>
          <p className="text-slate-500 mt-1">
            Gestiona los documentos académicos (PDF, Word, Texto) que alimentan el contexto del agente RAG.
          </p>
        </div>
        <div className="flex items-center gap-3">
             {onAnalyzeTopics && (
                 <button
                    onClick={onAnalyzeTopics}
                    disabled={isLoading || documents.length === 0}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all border ${
                        isLoading || documents.length === 0
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-50 hover:border-purple-300'
                    }`}
                    title="Detectar temas automáticamente desde los documentos"
                 >
                     <ICONS.FileType size={16} />
                     Analizar Temario
                 </button>
             )}

             {onGenerateAutoTests && (
                <button
                    onClick={() => setShowGenModal(true)}
                    disabled={isLoading || documents.length === 0}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all ${
                        isLoading || documents.length === 0
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'
                    }`}
                >
                    {isLoading ? (
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                         <ICONS.Dices size={16} />
                    )}
                    Generar Test Automático
                </button>
             )}
            <div className="text-xs font-mono bg-slate-200 px-3 py-2 rounded text-slate-600">
               {documents.filter(d => d.status === 'indexed').length} Documentos Indexados
            </div>
        </div>
      </div>

      {/* Generation Configuration Modal Overlay */}
      {showGenModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in">
                  <div className="bg-indigo-600 p-6 text-white">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                          <ICONS.Cpu size={24} />
                          Generador de Tests IA
                      </h3>
                      <p className="text-indigo-200 text-sm mt-1">Configura los parámetros del examen.</p>
                  </div>
                  
                  <div className="p-6 space-y-5">
                      {/* Topic Selector */}
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Tema del Examen</label>
                          <select 
                            className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            value={genConfig.topic}
                            onChange={(e) => setGenConfig({...genConfig, topic: e.target.value})}
                          >
                              <option value="Evaluación Global (Mezcla aleatoria)">Evaluación Global (Todos los temas)</option>
                              {availableTopics.map(t => (
                                  <option key={t} value={t}>{t}</option>
                              ))}
                          </select>
                      </div>

                      {/* Cross-Language Selector */}
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                              <ICONS.Globe size={16} className="text-indigo-500" />
                              Idioma de Salida (Cross-Language)
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                              {(Object.keys(LANGUAGE_LABELS) as Language[]).map(lang => (
                                  <button
                                    key={lang}
                                    onClick={() => setGenConfig({...genConfig, language: lang})}
                                    className={`py-2 rounded-lg text-sm font-bold border-2 transition-all ${
                                        genConfig.language === lang 
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                                        : 'border-slate-200 text-slate-500 hover:border-indigo-200'
                                    }`}
                                  >
                                      {lang.toUpperCase()}
                                  </button>
                              ))}
                          </div>
                          <p className="text-xs text-slate-400 mt-1 italic">
                              El agente traducirá el contenido de los documentos al idioma seleccionado.
                          </p>
                      </div>

                      {/* Difficulty & Count */}
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">Dificultad</label>
                              <select 
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                value={genConfig.difficulty}
                                onChange={(e) => setGenConfig({...genConfig, difficulty: e.target.value as Difficulty})}
                              >
                                  <option value="basic">Básico</option>
                                  <option value="intermediate">Intermedio</option>
                                  <option value="advanced">Avanzado</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-bold text-slate-700 mb-2">Cantidad</label>
                              <div className="flex items-center gap-3">
                                  <input 
                                    type="range" 
                                    min="1" max="20" 
                                    value={genConfig.count}
                                    onChange={(e) => setGenConfig({...genConfig, count: parseInt(e.target.value)})}
                                    className="flex-1 accent-indigo-600"
                                  />
                                  <span className="font-mono font-bold text-slate-700 w-8">{genConfig.count}</span>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                      <button 
                        onClick={() => setShowGenModal(false)}
                        className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-200 rounded-lg transition-colors"
                      >
                          Cancelar
                      </button>
                      <button 
                        onClick={handleGenerateClick}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                      >
                          <ICONS.Play size={16} fill="white" />
                          Generar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Upload Area */}
      <div 
        className={`
          border-3 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer
          ${isDragging 
            ? 'border-orange-500 bg-orange-50 scale-[1.01]' 
            : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
          <ICONS.Upload className={`w-8 h-8 ${isDragging ? 'text-orange-500' : 'text-slate-400'}`} />
        </div>
        <h3 className="text-lg font-bold text-slate-700">Sube tus apuntes aquí</h3>
        <p className="text-slate-500 mt-2 max-w-sm">
          Arrastra y suelta archivos o haz clic para explorar.
          <br />
          <span className="text-xs text-slate-400 mt-2 block">Formatos soportados: PDF, DOCX, TXT</span>
        </p>
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          multiple 
          accept=".pdf,.docx,.txt"
          onChange={handleFileSelect}
        />
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-700">Archivos en el Sistema</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {documents.map((doc) => (
            <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-100 rounded-lg">
                  {getIconForType(doc.type)}
                </div>
                <div>
                  <h4 className="font-medium text-slate-800">{doc.name}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{doc.size}</span>
                    <span>•</span>
                    <span>{doc.uploadDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 min-w-[120px]">
                  {doc.status === 'indexed' && (
                    <>
                      <ICONS.Check className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-bold text-green-600">Indexado</span>
                    </>
                  )}
                  {doc.status === 'processing' && (
                    <>
                      <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-bold text-orange-600">Procesando...</span>
                    </>
                  )}
                  {doc.status === 'error' && (
                    <>
                      <ICONS.AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-xs font-bold text-red-600">Error</span>
                    </>
                  )}
                </div>

                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all cursor-pointer"
                  title="Eliminar documento"
                >
                  <ICONS.Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          
          {documents.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              <ICONS.File className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No hay documentos subidos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
