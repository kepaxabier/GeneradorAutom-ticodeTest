
import React, { useState, useEffect } from 'react';
import { ISOQuestion, Difficulty } from '../types';
import { SAMPLE_QUESTIONS, ICONS } from '../constants';

interface QuestionFormProps {
  onSubmit: (q: ISOQuestion) => void;
  isLoading: boolean;
  initialData?: ISOQuestion | null;
  provisionalQuestions?: ISOQuestion[];
  onSelectProvisional?: (q: ISOQuestion) => void;
  onDiscardProvisional?: (id: string) => void;
  selectedTopicFilter?: string;
  onTopicFilterChange?: (topic: string) => void;
  availableTopics?: string[];
  onOpenBulkEditor?: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ 
    onSubmit, 
    isLoading, 
    initialData, 
    provisionalQuestions = [], 
    onSelectProvisional,
    onDiscardProvisional,
    selectedTopicFilter = 'Todos',
    onTopicFilterChange,
    availableTopics = [],
    onOpenBulkEditor
}) => {
  const [question, setQuestion] = useState<ISOQuestion>({
    id: `custom.${Date.now()}`,
    tema: availableTopics[0] || 'General',
    enunciado: '',
    opciones: ['', '', '', ''],
    dificultad: 'intermediate'
  });

  useEffect(() => {
    if (initialData) {
      setQuestion({
        ...initialData,
        dificultad: initialData.dificultad || 'intermediate'
      });
    }
  }, [initialData]);

  // If available topics change and current question has an invalid topic (e.g. from previous static list)
  // we might want to default it, but let's keep it loose for now to allow editing old questions.
  useEffect(() => {
      if (availableTopics.length > 0 && !question.enunciado && !initialData) {
          setQuestion(prev => ({...prev, tema: availableTopics[0]}));
      }
  }, [availableTopics]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...question.opciones];
    newOptions[index] = value;
    setQuestion({ ...question, opciones: newOptions });
  };

  const loadSample = (sample: ISOQuestion) => {
    setQuestion({...sample, dificultad: sample.dificultad || 'intermediate'});
  };

  // Improved filtering logic:
  // Instead of exact string matching, we check if the provisional question's theme
  // contains the core identifier (e.g., "Tema 1") of the selected filter.
  // This handles both specific topics ("Tema 1: Intro...") and global auto-generated ones ("Aleatorio: Tema 1").
  const filteredProvisionalQuestions = provisionalQuestions.filter(q => {
    if (selectedTopicFilter === 'Todos') return true;
    
    // Extract "Tema X" from "Tema X: Description..."
    const topicPrefix = selectedTopicFilter.split(':')[0].trim();
    
    return q.tema.includes(topicPrefix);
  });

  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* Inbox for Provisional Questions - Expanded height */}
      {provisionalQuestions.length > 0 && onSelectProvisional && (
          <div className="bg-indigo-50 rounded-xl shadow-sm border border-indigo-200 p-4 mb-2 animate-fade-in flex flex-col flex-shrink-0">
              <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-indigo-800 flex items-center gap-2">
                      <ICONS.Inbox size={16} /> Bandeja de Entrada ({filteredProvisionalQuestions.length})
                  </h3>
                  
                  <div className="flex items-center gap-2">
                      {onTopicFilterChange && (
                        <select 
                            value={selectedTopicFilter}
                            onChange={(e) => onTopicFilterChange(e.target.value)}
                            className="text-xs border border-indigo-300 rounded bg-white text-indigo-800 py-1 px-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[150px]"
                        >
                            <option value="Todos">Todos los Temas</option>
                            {availableTopics.map(topic => (
                                <option key={topic} value={topic}>{topic}</option>
                            ))}
                        </select>
                      )}
                      
                      {onOpenBulkEditor && (
                          <button
                            onClick={onOpenBulkEditor}
                            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded flex items-center gap-1 transition-colors shadow-sm"
                            title="Editar todas las preguntas en una tabla"
                          >
                              <ICONS.Edit size={12} />
                              Editor Masivo
                          </button>
                      )}
                  </div>
              </div>

              {filteredProvisionalQuestions.length === 0 ? (
                  <div className="text-center py-6 text-indigo-400 text-xs italic border border-dashed border-indigo-200 rounded-lg bg-white/50">
                      <p>No hay preguntas provisionales para:</p>
                      <p className="font-bold mt-1">{selectedTopicFilter}</p>
                  </div>
              ) : (
                  // Increased max-height for better use of large screens
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-indigo-200 scrollbar-track-transparent">
                      {filteredProvisionalQuestions.map((prov) => (
                          <div key={prov.id} className="bg-white p-3 rounded-lg border border-indigo-100 flex justify-between items-start group hover:shadow-md transition-shadow cursor-pointer hover:border-indigo-300" onClick={() => onSelectProvisional(prov)}>
                              <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                     <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 truncate max-w-[150px]">{prov.tema}</span>
                                     {prov.dificultad && (
                                         <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                             prov.dificultad === 'basic' ? 'bg-green-100 text-green-700' :
                                             prov.dificultad === 'advanced' ? 'bg-red-100 text-red-700' :
                                             'bg-blue-100 text-blue-700'
                                         }`}>
                                             {prov.dificultad === 'basic' ? 'Básico' : prov.dificultad === 'advanced' ? 'Avanzado' : 'Medio'}
                                         </span>
                                     )}
                                  </div>
                                  <p className="text-xs text-slate-700 line-clamp-2 font-medium">{prov.enunciado}</p>
                              </div>
                              <div className="flex flex-col gap-1 ml-2">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); onSelectProvisional(prov); }}
                                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors" title="Cargar"
                                  >
                                      <ICONS.ArrowRightCircle size={16} />
                                  </button>
                                  {onDiscardProvisional && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDiscardProvisional(prov.id); }}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Descartar"
                                    >
                                        <ICONS.XCircle size={16} />
                                    </button>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ICONS.FileText className="text-orange-500" />
            {initialData ? 'Editar / Reintentar Pregunta' : 'Introducir Enunciado'}
            </h2>
            <div className="flex gap-2">
            {SAMPLE_QUESTIONS.map((sample, idx) => (
                <button 
                key={sample.id}
                onClick={() => loadSample(sample)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-full transition-colors"
                >
                Ejemplo {idx + 1}
                </button>
            ))}
            </div>
        </div>

        <div className="space-y-4 flex-1 flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">ID Pregunta</label>
                    <input
                    type="text"
                    value={question.id}
                    onChange={(e) => setQuestion({ ...question, id: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-xs font-mono bg-slate-50"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tema</label>
                    <select
                    value={question.tema}
                    onChange={(e) => setQuestion({ ...question, tema: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm bg-slate-50"
                    >
                    {availableTopics.map(topic => (
                        <option key={topic} value={topic}>{topic}</option>
                    ))}
                    {!availableTopics.includes(question.tema) && <option value={question.tema}>{question.tema}</option>}
                    </select>
                </div>
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nivel</label>
                    <select
                    value={question.dificultad || 'intermediate'}
                    onChange={(e) => setQuestion({ ...question, dificultad: e.target.value as Difficulty })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm bg-slate-50"
                    >
                        <option value="basic">Básico</option>
                        <option value="intermediate">Intermedio</option>
                        <option value="advanced">Avanzado</option>
                    </select>
                </div>
            </div>

            <div className="flex-1 flex flex-col">
                <label className="block text-sm font-medium text-slate-700 mb-1">Enunciado del Test</label>
                <textarea
                    value={question.enunciado}
                    onChange={(e) => setQuestion({ ...question, enunciado: e.target.value })}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none flex-1 min-h-[120px]"
                    placeholder="Escribe la pregunta sobre Ubuntu/Bash..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {question.opciones.map((opt, idx) => (
                <div key={idx} className="relative">
                <span className="absolute left-3 top-3 text-slate-400 font-mono text-sm">{idx + 1}.</span>
                <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="w-full pl-8 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    placeholder={`Opción ${idx + 1}`}
                />
                </div>
            ))}
            </div>

            <button
            onClick={() => onSubmit(question)}
            disabled={isLoading || !question.enunciado}
            className={`w-full mt-4 py-3 rounded-lg font-bold text-white shadow-lg transition-all flex justify-center items-center gap-2 ${
                isLoading || !question.enunciado
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transform hover:-translate-y-1'
            }`}
            >
            {isLoading ? (
                <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Procesando con RAG...
                </>
            ) : (
                <>
                <ICONS.Play size={20} />
                Resolver Pregunta
                </>
            )}
            </button>
        </div>
        </div>
    </div>
  );
};

export default QuestionForm;
