
import React, { useState } from 'react';
import { ISOQuestion, Language, Difficulty } from '../types';
import { ICONS } from '../constants';

interface BulkEditorProps {
  questions: ISOQuestion[];
  onUpdateQuestions: (updatedQuestions: ISOQuestion[]) => void;
  onCancel: () => void;
  onRegenerateOption: (question: ISOQuestion, optionIndex: number) => Promise<string>;
  language: Language;
}

const BulkEditor: React.FC<BulkEditorProps> = ({ 
    questions, 
    onUpdateQuestions, 
    onCancel, 
    onRegenerateOption,
    language
}) => {
  const [localQuestions, setLocalQuestions] = useState<ISOQuestion[]>(JSON.parse(JSON.stringify(questions)));
  const [loadingOption, setLoadingOption] = useState<{qId: string, optIdx: number} | null>(null);
  const [activeTopic, setActiveTopic] = useState<string>('Todos');

  const availableTopics: string[] = Array.from(new Set(localQuestions.map(q => q.tema)));

  const handleTextChange = (qIndex: number, field: keyof ISOQuestion, value: string) => {
    const updated = [...localQuestions];
    updated[qIndex] = { ...updated[qIndex], [field]: value };
    setLocalQuestions(updated);
  };

  const handleDifficultyChange = (qIndex: number, value: Difficulty) => {
    const updated = [...localQuestions];
    updated[qIndex] = { ...updated[qIndex], dificultad: value };
    setLocalQuestions(updated);
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...localQuestions];
    const newOptions = [...updated[qIndex].opciones];
    newOptions[optIndex] = value;
    updated[qIndex] = { ...updated[qIndex], opciones: newOptions };
    setLocalQuestions(updated);
  };

  const handleCorrectOptionChange = (qIndex: number, optIndex: number) => {
      const updated = [...localQuestions];
      updated[qIndex] = { ...updated[qIndex], opcionCorrecta: optIndex + 1 };
      setLocalQuestions(updated);
  };

  const handleDelete = (qIndex: number) => {
      if (window.confirm("¿Eliminar esta pregunta del borrador?")) {
          const updated = localQuestions.filter((_, i) => i !== qIndex);
          setLocalQuestions(updated);
      }
  };

  const handleRegenerateClick = async (qIndex: number, optIndex: number) => {
      const question = localQuestions[qIndex];
      setLoadingOption({ qId: question.id, optIdx: optIndex });
      try {
          const newText = await onRegenerateOption(question, optIndex);
          handleOptionChange(qIndex, optIndex, newText);
      } catch (e) {
          console.error(e);
          alert("Error regenerando opción");
      } finally {
          setLoadingOption(null);
      }
  };

  const handleSave = () => {
      onUpdateQuestions(localQuestions);
  };

  const filteredQuestions = activeTopic === 'Todos' 
      ? localQuestions 
      : localQuestions.filter(q => q.tema === activeTopic);

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-6rem)] flex flex-col animate-fade-in">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <ICONS.Edit className="text-orange-500" />
                    Editor Masivo de Borradores
                </h2>
                <p className="text-slate-500 text-sm">Edita, corrige y refina las {localQuestions.length} preguntas generadas antes de guardarlas.</p>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={onCancel}
                    className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    onClick={handleSave}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg flex items-center gap-2"
                >
                    <ICONS.Save size={18} />
                    Guardar Cambios
                </button>
            </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            <button
                onClick={() => setActiveTopic('Todos')}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors whitespace-nowrap ${
                    activeTopic === 'Todos' ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'
                }`}
            >
                Todos ({localQuestions.length})
            </button>
            {availableTopics.map((topic) => (
                <button
                    key={topic}
                    onClick={() => setActiveTopic(topic)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors whitespace-nowrap ${
                        activeTopic === topic ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'
                    }`}
                >
                    {String(topic).split(':')[0]} ({localQuestions.filter(q => q.tema === topic).length})
                </button>
            ))}
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto pr-2 pb-20 space-y-6">
            {filteredQuestions.map((question, idx) => {
                // Find original index to maintain state sync correctly even when filtered
                const originalIndex = localQuestions.findIndex(q => q.id === question.id);
                
                return (
                    <div key={question.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative group">
                        <button 
                            onClick={() => handleDelete(originalIndex)}
                            className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                            title="Eliminar pregunta"
                        >
                            <ICONS.Trash2 size={18} />
                        </button>
                        
                        <div className="flex gap-4 mb-4 pr-8 items-start">
                             <div className="flex-1">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                                    {question.tema}
                                </span>
                                <textarea
                                    value={question.enunciado}
                                    onChange={(e) => handleTextChange(originalIndex, 'enunciado', e.target.value)}
                                    className="w-full p-2 text-lg font-medium text-slate-800 border-b-2 border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none resize-none bg-transparent transition-colors"
                                    rows={2}
                                    placeholder="Enunciado de la pregunta..."
                                />
                             </div>
                             <div className="w-32">
                                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Dificultad</label>
                                <select 
                                    value={question.dificultad || 'intermediate'}
                                    onChange={(e) => handleDifficultyChange(originalIndex, e.target.value as Difficulty)}
                                    className="w-full p-1.5 text-xs rounded border border-slate-200 bg-slate-50 text-slate-700 outline-none"
                                >
                                    <option value="basic">Básico</option>
                                    <option value="intermediate">Medio</option>
                                    <option value="advanced">Avanzado</option>
                                </select>
                             </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {question.opciones.map((opt, optIdx) => {
                                const isCorrect = (question.opcionCorrecta || 0) === (optIdx + 1);
                                const isRegenerating = loadingOption?.qId === question.id && loadingOption?.optIdx === optIdx;

                                return (
                                    <div 
                                        key={optIdx} 
                                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                            isCorrect ? 'border-green-500 bg-green-50/30' : 'border-slate-100 bg-slate-50'
                                        }`}
                                    >
                                        <input 
                                            type="radio"
                                            name={`correct-${question.id}`}
                                            checked={isCorrect}
                                            onChange={() => handleCorrectOptionChange(originalIndex, optIdx)}
                                            className="w-4 h-4 text-green-600 focus:ring-green-500 cursor-pointer"
                                            title="Marcar como correcta"
                                        />
                                        
                                        <div className="flex-1 relative">
                                            <input 
                                                type="text"
                                                value={opt}
                                                onChange={(e) => handleOptionChange(originalIndex, optIdx, e.target.value)}
                                                className={`w-full bg-transparent border-none focus:ring-0 text-sm ${isCorrect ? 'font-bold text-green-800' : 'text-slate-600'}`}
                                            />
                                        </div>

                                        <button
                                            onClick={() => handleRegenerateClick(originalIndex, optIdx)}
                                            disabled={isRegenerating}
                                            className={`p-1.5 rounded-full transition-colors ${
                                                isRegenerating ? 'animate-spin text-orange-500' : 'text-slate-300 hover:text-indigo-500 hover:bg-indigo-50'
                                            }`}
                                            title="Regenerar esta opción con IA (Distractor)"
                                        >
                                            {isRegenerating ? <ICONS.RefreshCw size={14} /> : <ICONS.Wand2 size={14} />}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
            
            {filteredQuestions.length === 0 && (
                <div className="text-center py-20 text-slate-400">
                    <p>No hay preguntas en este filtro.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default BulkEditor;
