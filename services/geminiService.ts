
import { GoogleGenAI, Type } from "@google/genai";
import { ISOQuestion, RAGResponse, ConfigState, Language, AutoTestConfig, VerificationResult } from "../types";
import { MOCK_PDF_CONTEXT, COURSE_TOPICS } from "../constants";

// Since we don't have a live Python backend with FAISS/Ollama running in this browser environment,
// we will use Gemini to SIMULATE the RAG process.
// In the real implementation (Docker), this service would point to a Python Flask/FastAPI endpoint.

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

export const solveQuestionWithRAG = async (question: ISOQuestion, config?: ConfigState, language: Language = 'es'): Promise<RAGResponse> => {
  const ai = getAIClient();
  
  // 1. Simulate Retrieval (In real app, this searches FAISS index)
  // We will ask Gemini to "hallucinate" accurate ISO notes based on the question topic 
  // if it wasn't a demo, or use our static MOCK_PDF_CONTEXT.
  // For this demo, we'll combine the static mock with dynamic generation to simulate "Retrieved Documents".
  
  const retrievalPrompt = `
    Eres un sistema RAG (Retrieval Augmented Generation).
    Tu tarea es simular la recuperación de fragmentos de texto de apuntes universitarios sobre Ubuntu 24.04 y Bash.
    
    Pregunta: "${question.enunciado}"
    Opciones: ${JSON.stringify(question.opciones)}
    Idioma de respuesta del contexto: ${language === 'eu' ? 'Euskara' : language === 'en' ? 'Inglés' : 'Español'}.
    
    Genera un fragmento de texto técnico que parezca extraído de un PDF de apuntes de sistemas operativos que contenga la respuesta.
    El texto debe ser técnico, académico y preciso.
  `;

  const retrievalModel = "gemini-2.5-flash";
  const contextResponse = await ai.models.generateContent({
    model: retrievalModel,
    contents: retrievalPrompt,
  });

  const simulatedContext = contextResponse.text || MOCK_PDF_CONTEXT;

  // 2. Generation (Answering based on context)
  let modelName = "Gemini (Default)";
  let providerInfo = "(Simulación RAG)";
  
  if (config) {
      if (config.provider === 'external' && config.externalModel) {
          modelName = config.externalModel;
          providerInfo = `(Simulación de API Externa: ${modelName})`;
      } else if (config.selectedModel) {
          modelName = config.selectedModel;
          providerInfo = `(Simulación de Ollama Local)`;
      }
  }
  
  const generationPrompt = `
    Actúa como un Agente experto en Sistemas Operativos Ubuntu 24.04.
    Simula que eres el modelo LLM "${modelName}".
    ${providerInfo}
    Responde a la pregunta tipo test basándote EXCLUSIVAMENTE en el siguiente contexto recuperado.
    
    IMPORTANTE: EL RAZONAMIENTO DEBE ESTAR ESCRITO EN ${language === 'eu' ? 'EUSKARA' : language === 'en' ? 'INGLÉS' : 'CASTELLANO'}.
    
    PARAMETROS DE CONFIGURACIÓN:
    - Temperature: ${config?.temperature || 0.7} (Ajusta tu creatividad acorde a esto)
    - Source Model: ${modelName}
    
    --- CONTEXTO RECUPERADO ---
    ${simulatedContext}
    ---------------------------
    
    Pregunta ID: ${question.id}
    Enunciado: ${question.enunciado}
    Opciones:
    1. ${question.opciones[0]}
    2. ${question.opciones[1]}
    3. ${question.opciones[2]}
    4. ${question.opciones[3]}
    
    Devuelve la respuesta en formato JSON estricto.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: generationPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          predictedIndex: { type: Type.INTEGER, description: "Índice de la respuesta correcta (1-4)" },
          reasoning: { type: Type.STRING, description: "Explicación breve citando el contexto." },
          confidence: { type: Type.NUMBER, description: "Nivel de confianza 0.0 a 1.0" }
        },
        required: ["predictedIndex", "reasoning", "confidence"]
      }
    }
  });

  const resultJSON = JSON.parse(response.text || "{}");

  // Prefix reasoning with the model name to show the config took effect in the simulation
  const reasoningWithModelInfo = `[Modelo: ${modelName}] ${resultJSON.reasoning}`;

  return {
    questionId: question.id,
    predictedIndex: resultJSON.predictedIndex,
    reasoning: reasoningWithModelInfo,
    confidence: resultJSON.confidence,
    retrievedContext: [
      {
        source: `apuntes_iso_${language}.pdf`,
        content: simulatedContext.substring(0, 300) + "...", // Truncate for display
        relevanceScore: 0.92
      }
    ]
  };
};

export const generateAutoTests = async (config: AutoTestConfig): Promise<ISOQuestion[]> => {
    const ai = getAIClient();
    
    const languageLabel = config.language === 'eu' ? 'EUSKARA' : config.language === 'en' ? 'INGLÉS' : 'CASTELLANO';
    
    let difficultyPrompt = "";
    switch(config.difficulty) {
        case 'basic': difficultyPrompt = "Nivel Básico (Memorización y Conceptos). Preguntas directas sobre definiciones y comandos simples."; break;
        case 'intermediate': difficultyPrompt = "Nivel Intermedio (Comprensión). Preguntas sobre flags de comandos y gestión básica."; break;
        case 'advanced': difficultyPrompt = "Nivel Avanzado (Aplicación y Análisis). Escenarios de troubleshooting, scripts complejos y gestión de permisos avanzada."; break;
    }

    const prompt = `
      Actúa como un profesor universitario experto en Sistemas Operativos.
      Tu tarea es generar preguntas de examen tipo test.
      
      CONFIGURACIÓN DE GENERACIÓN:
      - Tema: "${config.topic}"
      - Cantidad: ${config.count} preguntas.
      - Dificultad: ${difficultyPrompt}
      - IDIOMA DE SALIDA (OBLIGATORIO): ${languageLabel}.
      
      INSTRUCCIÓN CROSS-LANGUAGE:
      El contenido fuente (contexto simulado) puede estar en español o inglés. 
      TÚ DEBES TRADUCIR Y ADAPTAR las preguntas y respuestas al IDIOMA DE SALIDA solicitado (${languageLabel}).
      
      REQUISITOS:
      - Cada pregunta debe tener 4 opciones.
      - Solo una opción es correcta.
      - Las preguntas deben ser académicas y precisas para Ubuntu 24.04.
      
      Usa la siguiente base de conocimiento simulada como referencia:
      ${MOCK_PDF_CONTEXT}
      
      Devuelve ÚNICAMENTE un array JSON válido con las preguntas.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        enunciado: { type: Type.STRING },
                        opciones: { type: Type.ARRAY, items: { type: Type.STRING } },
                        opcionCorrecta: { type: Type.INTEGER }
                    },
                    required: ["enunciado", "opciones", "opcionCorrecta"]
                }
            }
        }
    });

    const rawQuestions = JSON.parse(response.text || "[]");
    
    return rawQuestions.map((q: any, index: number) => ({
        id: `auto_${config.language}_${Date.now()}_${index}`,
        tema: config.topic.includes("Global") ? `Aleatorio: ${COURSE_TOPICS[index % COURSE_TOPICS.length].split(':')[0]}` : config.topic,
        enunciado: q.enunciado,
        opciones: q.opciones,
        opcionCorrecta: q.opcionCorrecta,
        dificultad: config.difficulty // Assign the requested difficulty
    }));
};

export const regenerateDistractor = async (question: ISOQuestion, optionIndex: number, language: Language): Promise<string> => {
    const ai = getAIClient();
    const languageLabel = language === 'eu' ? 'EUSKARA' : language === 'en' ? 'INGLÉS' : 'CASTELLANO';
    
    // Identify which one is currently correct to avoid generating it as a distractor
    const correctOptionText = question.opcionCorrecta ? question.opciones[question.opcionCorrecta - 1] : "Desconocida";
    const currentDistractor = question.opciones[optionIndex];

    const prompt = `
      Eres un experto en exámenes de sistemas operativos Ubuntu 24.04.
      
      Pregunta: "${question.enunciado}"
      Respuesta Correcta: "${correctOptionText}"
      Opción Incorrecta Actual (A Reemplazar): "${currentDistractor}"
      Otras opciones existentes: ${JSON.stringify(question.opciones.filter((_, i) => i !== optionIndex))}
      
      TAREA: Genera UNA (1) opción incorrecta (distractor) nueva y plausible para reemplazar la actual.
      Debe ser diferente a la correcta y a las otras opciones.
      Debe ser un error común o un comando parecido pero inválido.
      
      IDIOMA DE SALIDA: ${languageLabel}.
      
      Devuelve SOLO el texto de la nueva opción. Sin explicaciones ni comillas.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });
    
    return response.text ? response.text.trim() : "Opción regenerada fallida";
};

export const generateQuestionVariants = async (originalQuestion: ISOQuestion, count: number, language: Language): Promise<ISOQuestion[]> => {
    const ai = getAIClient();
    const languageLabel = language === 'eu' ? 'EUSKARA' : language === 'en' ? 'INGLÉS' : 'CASTELLANO';
    
    const prompt = `
      Eres un experto en crear variantes de preguntas de examen para sistemas operativos Ubuntu 24.04.
      
      PREGUNTA ORIGINAL:
      Tema: ${originalQuestion.tema}
      Enunciado: "${originalQuestion.enunciado}"
      Opción Correcta: ${originalQuestion.opciones[originalQuestion.opcionCorrecta ? originalQuestion.opcionCorrecta - 1 : 0]}
      
      TAREA:
      Genera ${count} variantes de esta pregunta.
      Las variantes deben evaluar el MISMO CONCEPTO (ej: permisos, pipes, procesos) pero con diferente redacción, diferente escenario o preguntando lo inverso.
      
      Ejemplo:
      Original: "¿Comando para listar?"
      Variante 1: "Si quiero ver los ficheros, ¿qué uso?"
      Variante 2: "¿Cuál de estos NO sirve para listar?"
      
      IDIOMA DE SALIDA: ${languageLabel}.
      
      Devuelve ÚNICAMENTE un array JSON válido con las preguntas (estructura ISOQuestion sin ID).
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        enunciado: { type: Type.STRING },
                        opciones: { type: Type.ARRAY, items: { type: Type.STRING } },
                        opcionCorrecta: { type: Type.INTEGER }
                    },
                    required: ["enunciado", "opciones", "opcionCorrecta"]
                }
            }
        }
    });

    const rawVariants = JSON.parse(response.text || "[]");
    
    return rawVariants.map((q: any, index: number) => ({
        id: `variant_${Date.now()}_${index}`,
        tema: originalQuestion.tema,
        enunciado: q.enunciado,
        opciones: q.opciones,
        opcionCorrecta: q.opcionCorrecta,
        dificultad: originalQuestion.dificultad || 'intermediate'
    }));
};

export const verifyQuestionParallel = async (question: ISOQuestion, language: Language): Promise<VerificationResult> => {
    const ai = getAIClient();
    const languageLabel = language === 'eu' ? 'EUSKARA' : language === 'en' ? 'INGLÉS' : 'CASTELLANO';

    const prompt = `
      Actúa como un JURADO DE EXPERTOS en sistemas operativos Ubuntu 24.04.
      Debes simular 3 personas diferentes analizando la misma pregunta para verificar la respuesta correcta.

      PREGUNTA: "${question.enunciado}"
      OPCIONES:
      1. ${question.opciones[0]}
      2. ${question.opciones[1]}
      3. ${question.opciones[2]}
      4. ${question.opciones[3]}

      LOS 3 EXPERTOS SON:
      1. "SysAdmin Senior": Pragmático, enfocado en lo que funciona en producción.
      2. "Profesor Teórico": Académico, estricto con la terminología y documentación oficial.
      3. "Auditor de Seguridad": Paranoico, busca casos borde y seguridad.

      TAREA:
      Cada experto debe votar por la opción correcta (1-4) y dar una razón muy breve (max 15 palabras) en ${languageLabel}.
      
      Devuelve un JSON con el voto de cada uno.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    votes: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                agentName: { type: Type.STRING }, // e.g., "SysAdmin"
                                role: { type: Type.STRING }, // e.g., "sysadmin"
                                voteIndex: { type: Type.INTEGER },
                                shortReason: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
        }
    });

    const result = JSON.parse(response.text || "{ \"votes\": [] }");
    const votes = result.votes || [];

    // Calculate consensus
    const voteCounts: Record<number, number> = {};
    votes.forEach((v: any) => {
        voteCounts[v.voteIndex] = (voteCounts[v.voteIndex] || 0) + 1;
    });

    let maxVotes = 0;
    let consensusIndex = 0;
    
    // Default to the first vote if confusion, but try to find majority
    for (const [idx, count] of Object.entries(voteCounts)) {
        if (count > maxVotes) {
            maxVotes = count;
            consensusIndex = parseInt(idx);
        }
    }

    return {
        votes: votes,
        consensusIndex: consensusIndex,
        agreementPercentage: (maxVotes / votes.length) * 100
    };
};

export const extractTopicsFromContext = async (): Promise<string[]> => {
    const ai = getAIClient();
    const prompt = `
      Analiza el siguiente texto (apuntes de sistemas operativos) e identifica la estructura de temas o capítulos principales.
      
      Texto:
      ${MOCK_PDF_CONTEXT}
      
      Extrae una lista de 4 a 8 temas principales con el formato "Tema X: Título descriptivo".
      Si el texto no es suficiente, infiere temas lógicos basados en palabras clave (ej: Permisos, Procesos, Ficheros).
    `;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    });
    
    return JSON.parse(response.text || "[]");
};

export const evaluateRetriever = async (question: ISOQuestion, expectedContextKeywords: string[]): Promise<string> => {
    // This simulates the "Evaluación" requirement: checking if retrieved context matches expectations.
    return `Evaluación simulada: El retriever encontró documentos que contienen ${expectedContextKeywords.join(", ")}. Precision: 0.85`;
};
