
import React, { useState } from 'react';
import { SavedTest, ExamSession } from '../types';
import { ICONS } from '../constants';

interface ExamViewProps {
  tests: SavedTest[];
  onExit: () => void;
  onResultsSaved: (session: ExamSession) => void;
}

const ExamView: React.FC<ExamViewProps> = ({ tests, onExit, onResultsSaved }) => {
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [examSessionId] = useState(`exam_${Date.now()}`);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex + 1 // Store 1-based index
    }));
  };

  const calculateScore = () => {
    let correct = 0;
    tests.forEach(test => {
      // Use stored correct option from the question, or fallback to the AI's predicted index 
      // (assuming saved tests are validated as correct)
      const correctOption = test.question.opcionCorrecta || test.result.predictedIndex;
      if (userAnswers[test.id] === correctOption) {
        correct++;
      }
    });
    return correct;
  };

  const score = calculateScore();
  const percentage = tests.length > 0 ? Math.round((score / tests.length) * 100) : 0;

  const handleSubmit = () => {
      setIsSubmitted(true);
      
      const session: ExamSession = {
          id: examSessionId,
          createdAt: new Date().toISOString(),
          questions: tests,
          completedAt: new Date().toISOString(),
          score: score,
          userAnswers: userAnswers
      };
      
      // Trigger logic to save the results JSON to the folder
      onResultsSaved(session);
  };

  const handleExportPDF = () => {
    setShowExportMenu(false);
    // The CSS @media print block below handles the layout
    window.print();
  };

  const handleExportWord = () => {
    setShowExportMenu(false);
    
    // Construct a simple HTML document that Word can open
    let content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Examen Generado</title></head>
      <body>
      <h1>Examen Generado - Agente ISO Ubuntu</h1>
      <p>ID: ${examSessionId}</p>
      <p>Fecha: ${new Date().toLocaleDateString()}</p>
      <hr/>
    `;

    tests.forEach((test, index) => {
      content += `<h3>${index + 1}. ${test.question.enunciado}</h3>`;
      content += `<ul>`;
      test.question.opciones.forEach((opt, i) => {
        content += `<li style="list-style-type: none;">[${['A','B','C','D'][i]}] ${opt}</li>`;
      });
      content += `</ul>`;
      
      if (isSubmitted) {
         const correctIndex = test.question.opcionCorrecta || test.result.predictedIndex;
         content += `<p><strong>Respuesta Correcta:</strong> Opción ${correctIndex}</p>`;
         content += `<p><em>Explicación: ${test.result.reasoning}</em></p>`;
      }
      content += `<br/>`;
    });

    content += `</body></html>`;

    const blob = new Blob(['\ufeff', content], {
      type: 'application/msword'
    });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Examen_ISO_${Date.now()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20 relative">
      <style>{`
        @media print {
            /* 1. Global Reset for Print */
            @page { margin: 2cm; size: auto; }
            html, body { height: auto !important; overflow: visible !important; background: white !important; }

            /* 2. Hide Sidebar and non-essential UI */
            /* Assuming sidebar is in a fixed div or nav element */
            nav, aside, .fixed, .w-64 { display: none !important; }
            
            /* 3. Reset Main Container (Crucial for scrolling/clipping issues) */
            main { 
                margin: 0 !important; 
                padding: 0 !important; 
                height: auto !important; 
                overflow: visible !important; 
                width: 100% !important; 
                display: block !important;
            }

            /* 4. Hide ExamView specific controls */
            .sticky-header, button, .no-print { display: none !important; }
            
            /* 5. Ensure Content Visibility */
            .exam-container { 
                display: block !important; 
                width: 100% !important; 
                box-shadow: none !important;
            }
            
            .question-card { 
                break-inside: avoid; 
                page-break-inside: avoid; 
                border: 1px solid #eee !important; 
                box-shadow: none !important; 
                margin-bottom: 20px !important; 
                padding: 15px !important;
            }

            /* 6. Force Background Colors (for checkboxes/status) */
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-4 z-20 flex justify-between items-center sticky-header">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <ICONS.ClipboardList className="text-orange-500" />
             Modo Examen
           </h2>
           <p className="text-slate-500 text-sm">Responde las {tests.length} preguntas seleccionadas.</p>
        </div>
        
        <div className="flex items-center gap-4">
             {/* Export Menu */}
             <div className="relative">
                <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors"
                >
                    <ICONS.Download size={18} />
                    Exportar
                    <ICONS.ChevronDown size={14} />
                </button>
                
                {showExportMenu && (
                    <div className="absolute top-full mt-2 right-0 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                        <button 
                            onClick={handleExportPDF}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium text-slate-700"
                        >
                            <ICONS.FileText size={16} className="text-red-500"/>
                            Guardar como PDF
                        </button>
                        <button 
                            onClick={handleExportWord}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-2 text-sm font-medium text-slate-700"
                        >
                            <ICONS.FileText size={16} className="text-blue-500"/>
                            Descargar Word (.doc)
                        </button>
                    </div>
                )}
             </div>

             {isSubmitted && (
                 <div className="flex items-center gap-2 mr-4 bg-slate-100 px-4 py-2 rounded-lg">
                    <span className="text-slate-600 font-bold">Nota:</span>
                    <span className={`text-xl font-bold ${percentage >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                        {score}/{tests.length} ({percentage}%)
                    </span>
                 </div>
             )}
             
             {!isSubmitted ? (
                 <button 
                    onClick={handleSubmit}
                    disabled={Object.keys(userAnswers).length < tests.length}
                    className={`px-6 py-2 rounded-lg font-bold transition-colors shadow-lg ${
                        Object.keys(userAnswers).length < tests.length
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                 >
                    Finalizar y Corregir
                 </button>
             ) : (
                <button 
                    onClick={() => {
                        setUserAnswers({});
                        setIsSubmitted(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                    <ICONS.RefreshCw size={18} /> Reintentar
                </button>
             )}
             
             <button 
                onClick={onExit}
                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                title="Salir del examen"
             >
                <ICONS.XCircle size={24} />
             </button>
        </div>
      </div>

      <div className="space-y-8 exam-container">
        {tests.map((test, index) => {
          const userAnswer = userAnswers[test.id];
          const correctOption = test.question.opcionCorrecta || test.result.predictedIndex;
          
          let statusColor = "border-slate-200";
          if (isSubmitted) {
             if (userAnswer === correctOption) statusColor = "border-green-500 bg-green-50/30";
             else if (userAnswer && userAnswer !== correctOption) statusColor = "border-red-500 bg-red-50/30";
             else statusColor = "border-yellow-400 bg-yellow-50/30";
          }

          return (
            <div key={test.id} className={`bg-white rounded-xl shadow-sm border-2 p-6 transition-all question-card ${statusColor}`}>
               <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-2">
                      <span className="bg-slate-800 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md print:bg-black print:text-white print:border">
                          {index + 1}
                      </span>
                      {isSubmitted && userAnswer === correctOption && <ICONS.CheckCircle className="text-green-500 no-print" />}
                      {isSubmitted && userAnswer !== correctOption && <ICONS.AlertCircle className="text-red-500 no-print" />}
                  </div>
                  
                  <div className="flex-1">
                      <div className="mb-4">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{test.question.tema.split(":")[0]}</span>
                        <h3 className="text-lg font-medium text-slate-800 mt-1">{test.question.enunciado}</h3>
                      </div>

                      <div className="space-y-3">
                         {test.question.opciones.map((opt, optIdx) => {
                             const optNum = optIdx + 1;
                             let optionClass = "border border-slate-200 bg-slate-50 hover:bg-slate-100";
                             
                             if (!isSubmitted) {
                                 if (userAnswer === optNum) optionClass = "border-2 border-orange-500 bg-orange-50 text-orange-900 font-medium shadow-sm";
                             } else {
                                 if (optNum === correctOption) {
                                     optionClass = "border-2 border-green-500 bg-green-100 text-green-900 font-bold";
                                 } else if (optNum === userAnswer && optNum !== correctOption) {
                                     optionClass = "border-2 border-red-500 bg-red-100 text-red-900 opacity-75";
                                 } else {
                                     optionClass = "opacity-50 grayscale";
                                 }
                             }

                             return (
                                 <button
                                    key={optIdx}
                                    onClick={() => handleSelectOption(test.id, optIdx)}
                                    disabled={isSubmitted}
                                    className={`w-full text-left p-4 rounded-lg flex items-center gap-3 transition-all print:border print:bg-white print:text-black ${optionClass}`}
                                 >
                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs shrink-0 ${
                                        userAnswer === optNum || (isSubmitted && optNum === correctOption) ? 'border-transparent bg-black/10 print:border-black' : 'border-slate-300'
                                    }`}>
                                        {['A', 'B', 'C', 'D'][optIdx]}
                                    </div>
                                    <span>{opt}</span>
                                 </button>
                             );
                         })}
                      </div>

                      {isSubmitted && (
                          <div className="mt-6 pt-4 border-t border-slate-200 animate-fade-in">
                              <h4 className="font-bold text-slate-700 flex items-center gap-2 mb-2">
                                  <ICONS.BookOpen size={16} /> Explicación (RAG Context)
                              </h4>
                              <p className="text-slate-600 text-sm bg-slate-50 p-4 rounded-lg border border-slate-100">
                                  {test.result.reasoning}
                              </p>
                          </div>
                      )}
                  </div>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExamView;
