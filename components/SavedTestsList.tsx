
import React, { useState } from 'react';
import { SavedTest, Difficulty, ISOQuestion } from '../types';
import { ICONS } from '../constants';
import ResultsDisplay from './ResultsDisplay';

interface SavedTestsListProps {
  savedTests: SavedTest[];
  onDelete: (id: string) => void;
  onEdit: (test: SavedTest) => void;
  onGenerateExam: (selectedTests: SavedTest[]) => void;
  availableTopics?: string[];
  onGenerateVariants?: (question: ISOQuestion) => void;
}

const SavedTestsList: React.FC<SavedTestsListProps> = ({ 
    savedTests, 
    onDelete, 
    onEdit, 
    onGenerateExam, 
    availableTopics = [],
    onGenerateVariants
}) => {
  const [expandedTopics, setExpandedTopics] = useState<string[]>(availableTopics);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set());
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'all'>('all');

  const toggleTopic = (topic: string) => {
    setExpandedTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const toggleTest = (id: string) => {
    setExpandedTestId(prev => prev === id ? null : id);
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedTestIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedTestIds(newSelection);
  };

  const handleRandomExam = (e: React.MouseEvent, topicTests: SavedTest[]) => {
    e.stopPropagation();
    // Shuffle the array and pick up to 5
    const shuffled = [...topicTests].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);
    onGenerateExam(selected);
  };

  // Filter tests by difficulty first
  const filteredTests = savedTests.filter(t => filterDifficulty === 'all' || t.question.dificultad === filterDifficulty);

  // Group filtered tests by topic
  const testsByTopic: Record<string, SavedTest[]> = availableTopics.reduce((acc, topic) => {
    acc[topic] = filteredTests.filter(t => t.question.tema === topic);
    return acc;
  }, {} as Record<string, SavedTest[]>);

  // Catch tests with unknown topics
  const unknownTopicTests = filteredTests.filter(t => !availableTopics.includes(t.question.tema));
  if (unknownTopicTests.length > 0) {
    testsByTopic["Otros"] = unknownTopicTests;
  }

  const hasTests = savedTests.length > 0;

  const getDifficultyBadge = (dificultad?: Difficulty) => {
      switch(dificultad) {
          case 'basic': 
            return <span className="text-[10px] uppercase font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">Básico</span>;
          case 'advanced':
            return <span className="text-[10px] uppercase font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">Avanzado</span>;
          case 'intermediate':
          default:
            return <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">Medio</span>;
      }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <ICONS.Archive className="text-orange-500" />
                Historial de Tests Validados
            </h2>
            <p className="text-slate-500 mt-1">Selecciona preguntas para generar un examen de autoevaluación.</p>
        </div>
        
        <div className="flex items-center gap-4">
             <div className="flex bg-slate-200 rounded-lg p-1">
                 <button 
                    onClick={() => setFilterDifficulty('all')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filterDifficulty === 'all' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                     Todos
                 </button>
                 <button 
                    onClick={() => setFilterDifficulty('basic')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filterDifficulty === 'basic' ? 'bg-white shadow text-green-700' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                     Básico
                 </button>
                 <button 
                    onClick={() => setFilterDifficulty('intermediate')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filterDifficulty === 'intermediate' ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                     Medio
                 </button>
                 <button 
                    onClick={() => setFilterDifficulty('advanced')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filterDifficulty === 'advanced' ? 'bg-white shadow text-red-700' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                     Avanzado
                 </button>
             </div>
             <div className="text-sm font-bold bg-slate-100 px-3 py-1.5 rounded text-slate-700 border border-slate-200">
                Total: {filteredTests.length}
             </div>
        </div>
      </div>

      {!hasTests && (
        <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
            <ICONS.Folder className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No hay tests guardados aún.</p>
            <p className="text-sm mt-1">Resuelve y valida preguntas para construir tu base de estudio.</p>
        </div>
      )}

      {Object.entries(testsByTopic).map(([topic, tests]) => {
        // Explicitly cast 'tests' to SavedTest[] to avoid TS unknown error
        const typedTests = tests as SavedTest[];

        // If it's a topic from availableTopics but has no tests, we might skip it or show empty
        if (!typedTests || typedTests.length === 0) return null;
        
        const isTopicExpanded = expandedTopics.includes(topic);

        return (
            <div key={topic} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <button 
                    onClick={() => toggleTopic(topic)}
                    className="w-full px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center hover:bg-slate-100 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <ICONS.Folder className={`text-slate-400 ${typedTests.length > 0 ? 'fill-orange-100 text-orange-400' : ''}`} />
                        <h3 className="font-bold text-slate-700">{topic}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={(e) => handleRandomExam(e, typedTests)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-xs font-bold transition-colors mr-2"
                            title="Generar examen aleatorio de 5 preguntas de este tema"
                        >
                            <ICONS.Dices size={16} />
                            Test Rápido (5)
                        </button>
                        <span className="text-xs font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-500">
                            {typedTests.length} tests
                        </span>
                        {isTopicExpanded ? <ICONS.ChevronDown size={18} className="text-slate-400"/> : <ICONS.ChevronRight size={18} className="text-slate-400"/>}
                    </div>
                </button>

                {isTopicExpanded && (
                    <div className="divide-y divide-slate-100">
                        {typedTests.map((saved) => {
                            const isTestExpanded = expandedTestId === saved.id;
                            const isCorrect = saved.question.opcionCorrecta === saved.result.predictedIndex;
                            const dateStr = new Date(saved.savedAt).toLocaleDateString();
                            const isSelected = selectedTestIds.has(saved.id);

                            return (
                                <div key={saved.id} className={`bg-white transition-colors ${isSelected ? 'bg-orange-50/50' : ''}`}>
                                    <div className="flex items-start px-4 py-3 gap-3">
                                        <div className="pt-1">
                                            <input 
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelection(saved.id)}
                                                className="w-5 h-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                            />
                                        </div>
                                        <div 
                                            onClick={() => toggleTest(saved.id)}
                                            className="flex-1 cursor-pointer"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex items-center gap-2">
                                                    {getDifficultyBadge(saved.question.dificultad)}
                                                    <h4 className="font-medium text-slate-800 text-sm line-clamp-1">{saved.question.enunciado}</h4>
                                                </div>
                                                <span className="text-xs text-slate-400 shrink-0 ml-2">{dateStr}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className={`w-2 h-2 rounded-full ${isCorrect ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                                <p className="text-xs text-slate-500 line-clamp-1">{saved.result.reasoning}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-1 pt-1">
                                            {onGenerateVariants && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onGenerateVariants(saved.question); }}
                                                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                                    title="Generar Variantes (IA)"
                                                >
                                                    <ICONS.Layers size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onEdit(saved); }}
                                                className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                                                title="Editar"
                                            >
                                                <ICONS.Edit size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDelete(saved.id); }}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                                                title="Eliminar"
                                            >
                                                <ICONS.Trash2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => toggleTest(saved.id)}
                                                className="p-1.5 text-slate-300 hover:text-slate-600"
                                            >
                                                {isTestExpanded ? <ICONS.ChevronDown size={16}/> : <ICONS.ChevronRight size={16}/>}
                                            </button>
                                        </div>
                                    </div>

                                    {isTestExpanded && (
                                        <div className="px-6 pb-6 pt-2 bg-slate-50 border-t border-slate-100 ml-12 border-l-2 border-l-slate-200">
                                            <ResultsDisplay 
                                                question={saved.question} 
                                                result={saved.result} 
                                                isSaved={true} 
                                                onGenerateVariants={onGenerateVariants}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
      })}

      {/* Floating Action Button for Exam Generation */}
      {selectedTestIds.size > 0 && (
        <div className="fixed bottom-8 right-8 animate-bounce-in z-50">
            <button
                onClick={() => {
                    const selected = savedTests.filter(t => selectedTestIds.has(t.id));
                    onGenerateExam(selected);
                }}
                className="bg-slate-900 text-white shadow-xl hover:bg-slate-800 hover:shadow-2xl transition-all transform hover:-translate-y-1 px-6 py-4 rounded-full flex items-center gap-3 font-bold text-lg"
            >
                <div className="relative">
                    <ICONS.ClipboardList size={24} />
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900">
                        {selectedTestIds.size}
                    </span>
                </div>
                Generar Examen
            </button>
        </div>
      )}
    </div>
  );
};

export default SavedTestsList;
