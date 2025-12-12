
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import QuestionForm from './components/QuestionForm';
import ResultsDisplay from './components/ResultsDisplay';
import DocumentUpload from './components/DocumentUpload';
import SavedTestsList from './components/SavedTestsList';
import Configuration from './components/Configuration';
import ExamView from './components/ExamView';
import BulkEditor from './components/BulkEditor';
import { ISOQuestion, RAGResponse, ViewMode, DocumentFile, SavedTest, ConfigState, Language, ExamSession, AutoTestConfig } from './types';
import { solveQuestionWithRAG, generateAutoTests, extractTopicsFromContext, regenerateDistractor, generateQuestionVariants } from './services/geminiService';
import { ICONS, INITIAL_DOCUMENTS, DEFAULT_CONFIG, COURSE_TOPICS } from './constants';

function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [currentLanguage, setCurrentLanguage] = useState<Language>('es');
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<RAGResponse | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<ISOQuestion | null>(null);
  
  // Data State segregated by language
  const [documents, setDocuments] = useState<Record<Language, DocumentFile[]>>({
      es: INITIAL_DOCUMENTS,
      eu: [],
      en: []
  });
  const [savedTests, setSavedTests] = useState<Record<Language, SavedTest[]>>({
      es: [],
      eu: [],
      en: []
  });
  const [provisionalQuestions, setProvisionalQuestions] = useState<Record<Language, ISOQuestion[]>>({
      es: [],
      eu: [],
      en: []
  });

  const [config, setConfig] = useState<ConfigState>(DEFAULT_CONFIG);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState<ISOQuestion | null>(null);
  
  // Track the original ID of the provisional question being worked on
  const [activeProvisionalId, setActiveProvisionalId] = useState<string | null>(null);
  
  // New state for Topic Filter in Solver View
  const [solverTopicFilter, setSolverTopicFilter] = useState<string>('Todos');
  
  // State for Exam Generation
  const [examQuestions, setExamQuestions] = useState<SavedTest[]>([]);

  // State for Dynamic Topic Extraction
  const [availableTopics, setAvailableTopics] = useState<string[]>(COURSE_TOPICS);

  useEffect(() => {
    if (!process.env.API_KEY) {
        setIsApiKeyMissing(true);
    }
  }, []);

  // Helper to get current language data
  const getCurrentProvisional = () => provisionalQuestions[currentLanguage];
  const getCurrentSaved = () => savedTests[currentLanguage];
  const getCurrentDocs = () => documents[currentLanguage];

  // FILE SYSTEM SIMULATION HELPER
  // Since we are in a browser and cannot write directly to the disk without File System Access API complexity,
  // we will trigger a download of the JSON file to the user's default download folder, 
  // naming it in a way that suggests the structure.
  const saveToDisk = (filename: string, data: any) => {
     // In a real Electron/Node app, this would be fs.writeFileSync(config.storagePaths[lang] + filename, ...)
     const jsonString = JSON.stringify(data, null, 2);
     const blob = new Blob([jsonString], { type: "application/json" });
     const url = URL.createObjectURL(blob);
     const link = document.createElement("a");
     link.href = url;
     
     // Construct a filename that includes the language prefix to keep things organized if they all dump to Downloads
     const prefix = `${currentLanguage}_`; 
     // Clean up filename to remove slashes for the download attribute
     const safeFilename = filename.replace(/\//g, '_');
     
     link.download = prefix + safeFilename;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  const handleSelectProvisional = (question: ISOQuestion) => {
      setQuestionToEdit(question);
      setActiveProvisionalId(question.id);
  };

  const handleSolve = async (question: ISOQuestion) => {
    if (isApiKeyMissing) return;

    setIsLoading(true);
    setActiveQuestion(question);
    setCurrentResult(null); 
    setQuestionToEdit(null);

    try {
      const result = await solveQuestionWithRAG(question, config, currentLanguage);
      setCurrentResult(result);
    } catch (error) {
      console.error("Error solving question:", error);
      alert("Error al conectar con el Agente. Verifica tu conexión o API Key.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTest = (question: ISOQuestion, result: RAGResponse) => {
    const newSavedTest: SavedTest = {
        id: `saved_${currentLanguage}_${Date.now()}`,
        question,
        result,
        savedAt: new Date().toISOString()
    };
    
    // Update Saved Tests (History)
    const updatedSavedTests = [newSavedTest, ...savedTests[currentLanguage]];
    setSavedTests(prev => ({
        ...prev,
        [currentLanguage]: updatedSavedTests
    }));
    
    // Save history to disk
    saveToDisk("historial_tests.json", updatedSavedTests);

    // Remove from provisional list
    const idToRemove = activeProvisionalId || question.id;
    const updatedProvisional = provisionalQuestions[currentLanguage].filter(p => p.id !== idToRemove);
    
    setProvisionalQuestions(prev => ({
        ...prev,
        [currentLanguage]: updatedProvisional
    }));
    
    // Save updated provisional list to disk
    saveToDisk("tests_provisionales.json", updatedProvisional);

    setActiveProvisionalId(null);
  };

  const handleDeleteSavedTest = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este test del historial?')) {
        const updatedSavedTests = savedTests[currentLanguage].filter(t => t.id !== id);
        setSavedTests(prev => ({
            ...prev,
            [currentLanguage]: updatedSavedTests
        }));
        // Update file on disk
        saveToDisk("historial_tests.json", updatedSavedTests);
    }
  };

  const handleEditSavedTest = (test: SavedTest) => {
    setQuestionToEdit(test.question);
    setActiveProvisionalId(null);
    setActiveQuestion(null); 
    setCurrentResult(null);
    setCurrentView('test-solver');
  };

  const handleGenerateExam = (selectedTests: SavedTest[]) => {
    setExamQuestions(selectedTests);
    
    // Save generated exam file immediately
    const examSessionId = `examen_${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const examData: ExamSession = {
        id: examSessionId,
        createdAt: new Date().toISOString(),
        questions: selectedTests
    };
    saveToDisk(`examenes/${examSessionId}.json`, examData);
    
    setCurrentView('exam-mode');
  };

  const handleExamResultsSaved = (session: ExamSession) => {
      // Save results file
      const resultFilename = `examenes/resultados_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      saveToDisk(resultFilename, session);
  };

  const handleCloseResult = () => {
    const idToRemove = activeProvisionalId || activeQuestion?.id;
    // Note: We don't remove provisional just by closing, only by saving or explicitly discarding.
    setActiveProvisionalId(null);
    setCurrentResult(null);
    setActiveQuestion(null);
  };

  const handleUpload = (files: FileList) => {
    const newFiles: DocumentFile[] = Array.from(files).map((file) => ({
      id: `doc_${currentLanguage}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: file.name.split('.').pop() as any,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'processing'
    }));

    setDocuments(prev => ({
        ...prev,
        [currentLanguage]: [...prev[currentLanguage], ...newFiles]
    }));

    // Simulate async processing
    newFiles.forEach((file) => {
      setTimeout(() => {
        setDocuments(prev => ({
            ...prev,
            [currentLanguage]: prev[currentLanguage].map(d => d.id === file.id ? { ...d, status: 'indexed' } : d)
        }));
      }, 3000 + Math.random() * 2000); 
    });
  };

  const handleDeleteDocument = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este documento del índice?')) {
      setDocuments(prev => ({
          ...prev,
          [currentLanguage]: prev[currentLanguage].filter(d => d.id !== id)
      }));
    }
  };

  const handleAutoGenerateTests = async (genConfig: AutoTestConfig) => {
    if (isApiKeyMissing) return;
    
    setIsLoading(true);
    try {
        const newQuestions = await generateAutoTests(genConfig);
        const targetLang = genConfig.language;
        
        setProvisionalQuestions(prev => ({
            ...prev,
            [targetLang]: [...prev[targetLang], ...newQuestions]
        }));
        
        // If we generated for a different language, switch to it so the user can see the result
        if (targetLang !== currentLanguage) {
             setCurrentLanguage(targetLang);
        } else {
             // If staying in same language, prompt to go to bulk editor for convenience
             if (window.confirm(`Se han generado ${newQuestions.length} preguntas. ¿Quieres revisarlas en el Editor Masivo ahora?`)) {
                 setCurrentView('bulk-editor');
             }
        }

    } catch (e) {
        console.error(e);
        alert("Error generando tests automáticos. Inténtalo de nuevo.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleDiscardProvisional = (id: string) => {
     const updatedProvisional = provisionalQuestions[currentLanguage].filter(q => q.id !== id);
     
     setProvisionalQuestions(prev => ({
         ...prev,
         [currentLanguage]: updatedProvisional
     }));
     
     // Update disk file
     saveToDisk("tests_provisionales.json", updatedProvisional);
     
     if (activeProvisionalId === id) {
         setActiveProvisionalId(null);
         setQuestionToEdit(null);
     }
  };

  const handleExtractTopics = async () => {
    if (isApiKeyMissing) return;
    
    setIsLoading(true);
    try {
      const extractedTopics = await extractTopicsFromContext();
      setAvailableTopics(extractedTopics);
      alert(`Análisis completado: Se han detectado ${extractedTopics.length} temas en los documentos indexados.`);
    } catch (error) {
      console.error("Error extracting topics:", error);
      alert("Error al analizar los documentos para extraer temas.");
    } finally {
      setIsLoading(false);
    }
  };

  // Bulk Editor Handlers
  const handleBulkUpdateQuestions = (updatedQuestions: ISOQuestion[]) => {
      setProvisionalQuestions(prev => ({
          ...prev,
          [currentLanguage]: updatedQuestions
      }));
      // Save updated provisional list to disk
      saveToDisk("tests_provisionales.json", updatedQuestions);
      setCurrentView('test-solver'); // Return to main view
  };

  const handleRegenerateOption = async (question: ISOQuestion, optionIndex: number): Promise<string> => {
      return await regenerateDistractor(question, optionIndex, currentLanguage);
  };

  const handleGenerateVariants = async (question: ISOQuestion) => {
      if (isApiKeyMissing) return;
      setIsLoading(true);
      try {
          // Generate 3 variants by default
          const variants = await generateQuestionVariants(question, 3, currentLanguage);
          
          setProvisionalQuestions(prev => ({
              ...prev,
              [currentLanguage]: [...prev[currentLanguage], ...variants]
          }));
          
          saveToDisk("tests_provisionales.json", [...provisionalQuestions[currentLanguage], ...variants]);

          setCurrentView('test-solver');
          alert(`¡Éxito! Se han generado ${variants.length} variantes de la pregunta. Revisa la 'Bandeja de Entrada' para verlas.`);

      } catch (e) {
          console.error(e);
          alert("Error generando variantes. Inténtalo de nuevo.");
      } finally {
          setIsLoading(false);
      }
  };

  const renderContent = () => {
    if (isApiKeyMissing) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <ICONS.Shield size={64} className="mb-4 text-red-400" />
                <h2 className="text-2xl font-bold text-slate-800">Falta API Key</h2>
                <p className="max-w-md text-center mt-2">
                    Para asegurar la privacidad y funcionalidad de este entorno de demostración, 
                    necesitas configurar la variable de entorno <code>API_KEY</code>.
                </p>
            </div>
        );
    }

    const provQuestions = getCurrentProvisional();
    const validatedTests = getCurrentSaved();
    const currentDocs = getCurrentDocs();

    switch (currentView) {
      case 'dashboard':
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl p-8 shadow-lg relative overflow-hidden">
                    <ICONS.Globe className="absolute right-[-20px] top-[-20px] text-white opacity-5 w-64 h-64" />
                    <h2 className="text-3xl font-bold mb-4">Bienvenido al Agente ISO</h2>
                    <p className="text-slate-300 max-w-2xl text-lg">
                        Plataforma de estudio asistida por IA para la asignatura Introducción a los Sistemas Operativos.
                    </p>
                    <div className="mt-8 flex gap-4">
                        <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                            <h3 className="font-bold text-orange-400">Multi-Idioma</h3>
                            <p className="text-sm text-slate-300">Trabajando actualmente en: <strong>{currentLanguage.toUpperCase()}</strong></p>
                        </div>
                        <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm flex items-center gap-3">
                            <div>
                                <h3 className="font-bold text-green-400">Carpeta Activa</h3>
                                <p className="text-xs text-slate-300 font-mono mt-1 max-w-[200px] truncate" title={config.storagePaths[currentLanguage]}>
                                    {config.storagePaths[currentLanguage]}
                                </p>
                            </div>
                            <ICONS.FolderOpen className="text-slate-400" />
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setCurrentView('test-solver')}>
                        <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-orange-600 group-hover:scale-110 transition-transform">
                            <ICONS.Terminal />
                        </div>
                        <h3 className="font-bold text-slate-800">Resolución de Tests</h3>
                        <p className="text-sm text-slate-500 mt-2">Introduce preguntas tipo test y obtén respuestas razonadas.</p>
                        {provQuestions.length > 0 && (
                            <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                                {provQuestions.length} pendientes
                            </span>
                        )}
                     </div>

                     <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setCurrentView('history')}>
                        <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-green-600 group-hover:scale-110 transition-transform">
                            <ICONS.Archive />
                        </div>
                        <h3 className="font-bold text-slate-800">Historial de Validaciones</h3>
                        <p className="text-sm text-slate-500 mt-2">Consulta los {validatedTests.length} tests validados en {currentLanguage.toUpperCase()}.</p>
                     </div>
                     
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setCurrentView('configuration')}>
                        <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-purple-600 group-hover:scale-110 transition-transform">
                            <ICONS.Settings />
                        </div>
                        <h3 className="font-bold text-slate-800">Configuración</h3>
                        <p className="text-sm text-slate-500 mt-2">Ajusta carpetas de guardado y parámetros del modelo.</p>
                     </div>
                </div>
            </div>
        );
      case 'test-solver':
        const isCurrentQuestionSaved = validatedTests.some(st => st.question.id === activeQuestion?.id && st.result.questionId === currentResult?.questionId);
        
        return (
          <div className="h-full flex flex-col gap-6 animate-fade-in w-full max-w-[1920px] mx-auto">
             <div className="flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Resolución de Tests (RAG)</h2>
                    <p className="text-slate-500">Idioma activo: <span className="font-bold uppercase text-orange-600">{currentLanguage}</span></p>
                </div>
             </div>
             
             <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start h-full">
                {/* Left Column (Input/Inbox) - Takes 5 cols on large screens, reduced to 4 on extra large if needed */}
                <div className="xl:col-span-5 flex flex-col gap-6">
                    <QuestionForm 
                        onSubmit={handleSolve} 
                        isLoading={isLoading} 
                        initialData={questionToEdit}
                        provisionalQuestions={provQuestions}
                        onSelectProvisional={handleSelectProvisional}
                        onDiscardProvisional={handleDiscardProvisional}
                        key={questionToEdit?.id || 'new_question'}
                        selectedTopicFilter={solverTopicFilter}
                        onTopicFilterChange={setSolverTopicFilter}
                        availableTopics={availableTopics}
                        onOpenBulkEditor={() => setCurrentView('bulk-editor')}
                    />
                </div>
                
                {/* Right Column (Results) - Takes remaining space */}
                <div className="xl:col-span-7 h-full">
                    {activeQuestion && currentResult ? (
                        <ResultsDisplay 
                            question={activeQuestion} 
                            result={currentResult} 
                            onSave={handleSaveTest}
                            onClose={handleCloseResult}
                            isSaved={isCurrentQuestionSaved}
                            onGenerateVariants={handleGenerateVariants}
                        />
                    ) : (
                        <div className="h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 p-12 min-h-[400px]">
                            {isLoading ? (
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                                    <p className="text-lg">Recuperando contexto y razonando...</p>
                                    <p className="text-sm mt-2 text-slate-500">Idioma: {currentLanguage.toUpperCase()}</p>
                                </div>
                            ) : (
                                <>
                                    <ICONS.Search className="mb-4 opacity-30" size={64} />
                                    <p className="text-lg font-medium">Esperando pregunta...</p>
                                    <p className="text-sm mt-2 max-w-xs text-center">Selecciona una pregunta de la bandeja de entrada o escribe una nueva para ver el resultado aquí.</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
             </div>
          </div>
        );
      case 'bulk-editor':
        return (
            <BulkEditor 
                questions={provQuestions}
                onUpdateQuestions={handleBulkUpdateQuestions}
                onCancel={() => setCurrentView('test-solver')}
                onRegenerateOption={handleRegenerateOption}
                language={currentLanguage}
            />
        );
      case 'history':
        return (
            <SavedTestsList 
                savedTests={validatedTests} 
                onDelete={handleDeleteSavedTest}
                onEdit={handleEditSavedTest}
                onGenerateExam={handleGenerateExam}
                availableTopics={availableTopics}
                onGenerateVariants={handleGenerateVariants}
            />
        );
      case 'exam-mode':
        return (
            <ExamView 
                tests={examQuestions} 
                onExit={() => setCurrentView('history')} 
                onResultsSaved={handleExamResultsSaved}
            />
        );
      case 'configuration':
        return (
            <Configuration 
                config={config} 
                onSave={setConfig} 
            />
        );
      case 'documents':
        return (
          <DocumentUpload 
            documents={currentDocs}
            onUpload={handleUpload}
            onDelete={handleDeleteDocument}
            onGenerateAutoTests={handleAutoGenerateTests}
            isLoading={isLoading}
            onAnalyzeTopics={handleExtractTopics}
            availableTopics={availableTopics}
          />
        );
      case 'evaluation':
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                <ICONS.Server size={64} className="mb-4" />
                <h3 className="text-xl font-medium">Módulo en Desarrollo</h3>
                <p>Esta funcionalidad estará disponible en la versión v1.1 del prototipo.</p>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        currentLanguage={currentLanguage}
        setLanguage={setCurrentLanguage}
      />
      <main className="flex-1 ml-64 p-6 overflow-y-auto h-screen">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
