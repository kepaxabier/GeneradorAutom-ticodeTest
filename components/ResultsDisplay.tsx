
import React, { useState } from 'react';
import { ISOQuestion, RAGResponse, VerificationResult } from '../types';
import { ICONS } from '../constants';
import { verifyQuestionParallel } from '../services/geminiService';

interface ResultsDisplayProps {
  question: ISOQuestion;
  result: RAGResponse | null;
  onSave?: (question: ISOQuestion, result: RAGResponse) => void;
  onClose?: () => void;
  isSaved?: boolean;
  onGenerateVariants?: (question: ISOQuestion) => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ question, result, onSave, onClose, isSaved = false, onGenerateVariants }) => {
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  if (!result) return null;

  const handleVerify = async () => {
     setVerifying(true);
     try {
         // Use hardcoded language 'es' for now, or pass props. For prototype assume 'es' from context
         // Since we don't pass language to ResultsDisplay, we will rely on default behavior or add prop later.
         // For now, assuming spanish as default or let the service handle prompt language
         const verResult = await verifyQuestionParallel(question, 'es');
         setVerificationResult(verResult);
     } catch (e) {
         console.error(e);
         alert("Error en la verificación paralela.");
     } finally {
         setVerifying(false);
     }
  };

  const getAgentIcon = (role: string) => {
      const r = role.toLowerCase();
      if (r.includes('sysadmin')) return <ICONS.Terminal size={16} />;
      if (r.includes('profesor') || r.includes('professor')) return <ICONS.BookOpen size={16} />;
      if (r.includes('auditor') || r.includes('security')) return <ICONS.Shield size={16} />;
      return <ICONS.Cpu size={16} />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Context Section */}
      <div className="bg-indigo-50 border-l-4 border-indigo-500 p-6 rounded-r-xl shadow-sm">
        <div className="flex justify-between items-start mb-3">
            <h3 className="text-indigo-900 font-bold flex items-center gap-2">
            <ICONS.BookOpen className="text-indigo-600" />
            Contexto Recuperado
            </h3>
            <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                {question.tema || "General"}
            </span>
        </div>
        
        <div className="bg-white p-4 rounded border border-indigo-100 text-sm text-slate-700 font-mono leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
          {result.retrievedContext.map((doc, i) => (
             <div key={i}>
                <div className="text-xs text-indigo-400 mb-1 border-b border-indigo-50 pb-1 flex justify-between">
                    <span>Fuente: {doc.source}</span>
                    <span>Relevancia: {(doc.relevanceScore * 100).toFixed(0)}%</span>
                </div>
                {doc.content}
                {i < result.retrievedContext.length - 1 && <hr className="my-2 border-dashed border-indigo-200"/>}
             </div>
          ))}
        </div>
        <p className="text-xs text-indigo-400 mt-2 italic">
          * El agente utiliza este contexto específico del tema para razonar la respuesta.
        </p>
      </div>

      {/* 2. Answer Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <h3 className="font-bold text-slate-700">Resolución del Agente</h3>
                {question.dificultad && (
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        question.dificultad === 'basic' ? 'bg-green-100 text-green-700' :
                        question.dificultad === 'advanced' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                    }`}>
                        {question.dificultad === 'basic' ? 'Básico' : question.dificultad === 'advanced' ? 'Avanzado' : 'Medio'}
                    </span>
                )}
            </div>
            <span className="text-xs font-mono bg-slate-200 px-2 py-1 rounded text-slate-600">ID: {result.questionId}</span>
        </div>
        
        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {question.opciones.map((opt, idx) => {
                    const isSelected = (idx + 1) === result.predictedIndex;
                    return (
                        <div 
                            key={idx}
                            className={`p-4 rounded-lg border-2 transition-all flex items-start gap-3 ${
                                isSelected 
                                    ? 'border-green-500 bg-green-50' 
                                    : 'border-transparent bg-slate-50 opacity-60'
                            }`}
                        >
                            <div className={`
                                w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                                ${isSelected ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}
                            `}>
                                {idx + 1}
                            </div>
                            <span className={isSelected ? 'text-green-900 font-medium' : 'text-slate-600'}>
                                {opt}
                            </span>
                        </div>
                    )
                })}
            </div>

            <div className="bg-slate-50 p-4 rounded-lg mb-6">
                <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <ICONS.Shield size={16} /> Razonamiento del Modelo
                </h4>
                <p className="text-slate-700 text-sm leading-relaxed">
                    {result.reasoning}
                </p>
                <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Confianza:</span>
                    <div className="h-2 w-24 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-orange-400 to-green-500" 
                            style={{ width: `${result.confidence * 100}%`}}
                        ></div>
                    </div>
                    <span className="text-xs text-slate-500">{(result.confidence * 100).toFixed(0)}%</span>
                </div>
            </div>

            {/* Parallel Verification Panel */}
            {verificationResult && (
                <div className="mb-6 animate-scale-in">
                    <div className={`p-4 rounded-lg border ${verificationResult.consensusIndex === result.predictedIndex ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold flex items-center gap-2 text-slate-800">
                                <ICONS.Scale className="text-purple-600" />
                                Jurado de Expertos (Verificación Paralela)
                            </h4>
                            {verificationResult.consensusIndex === result.predictedIndex ? (
                                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                                    <ICONS.Check size={12} /> Consenso Total
                                </span>
                            ) : (
                                <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                                    <ICONS.AlertCircle size={12} /> Divergencia
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {verificationResult.votes.map((vote, i) => (
                                <div key={i} className="bg-white p-3 rounded shadow-sm border border-slate-100">
                                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-500 uppercase">
                                        {getAgentIcon(vote.agentName)}
                                        {vote.agentName}
                                    </div>
                                    <div className="mb-2">
                                        <span className={`text-sm font-bold ${vote.voteIndex === result.predictedIndex ? 'text-green-600' : 'text-red-500'}`}>
                                            Vota: Opción {vote.voteIndex}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 italic">"{vote.shortReason}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between border-t border-slate-100 pt-4 gap-3 flex-wrap">
                <div className="flex gap-2">
                   {onGenerateVariants && (
                       <button
                          onClick={() => onGenerateVariants(question)}
                          className="px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                          title="Generar 3 variantes de esta pregunta"
                       >
                           <ICONS.Layers size={16} />
                           Generar Variantes
                       </button>
                   )}
                   
                   {!verificationResult && (
                       <button
                           onClick={handleVerify}
                           disabled={verifying}
                           className="px-4 py-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                           title="Consultar a 3 expertos simulados para verificar la respuesta"
                       >
                           {verifying ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div> : <ICONS.GitMerge size={16} />}
                           Verificación Paralela
                       </button>
                   )}
                </div>
                
                <div className="flex gap-3 ml-auto">
                    {onSave && onClose && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        >
                            Salir sin guardar
                        </button>
                    )}
                    {onSave && (
                        <button 
                        onClick={() => onSave(question, result)}
                        disabled={isSaved}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold shadow-sm transition-all ${
                            isSaved 
                            ? 'bg-green-100 text-green-700 cursor-default' 
                            : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md active:transform active:scale-95'
                        }`}
                        >
                        {isSaved ? (
                            <>
                            <ICONS.Check size={18} />
                            Guardado en Historial
                            </>
                        ) : (
                            <>
                            <ICONS.Save size={18} />
                            Validar y Guardar
                            </>
                        )}
                        </button>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
