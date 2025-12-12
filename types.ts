
export type Language = 'es' | 'eu' | 'en';
export type Difficulty = 'basic' | 'intermediate' | 'advanced';

export interface ISOQuestion {
  id: string;
  tema: string;
  enunciado: string;
  opciones: string[]; // Array of 4 strings
  opcionCorrecta?: number; // 1-4 (optional for input, required for validation)
  dificultad?: Difficulty;
}

export interface RetrievedDocument {
  source: string;
  content: string;
  relevanceScore: number;
}

export interface RAGResponse {
  questionId: string;
  predictedIndex: number; // 1-4
  reasoning: string;
  retrievedContext: RetrievedDocument[];
  confidence: number; // 0-1
}

export interface AgentVote {
  agentName: string;
  role: string; // 'SysAdmin', 'Professor', 'Security'
  voteIndex: number;
  shortReason: string;
}

export interface VerificationResult {
  votes: AgentVote[];
  consensusIndex: number;
  agreementPercentage: number;
}

export interface DocumentFile {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'txt' | 'other';
  size: string;
  uploadDate: string;
  status: 'indexed' | 'processing' | 'error';
}

export interface SavedTest {
  id: string;
  question: ISOQuestion;
  result: RAGResponse;
  savedAt: string;
  verification?: VerificationResult; // Store verification history if performed
}

export interface ExamSession {
    id: string;
    createdAt: string;
    questions: SavedTest[];
    completedAt?: string;
    score?: number;
    userAnswers?: Record<string, number>;
}

export interface ConfigState {
  provider: 'ollama' | 'external';
  ollamaUrl: string;
  selectedModel: string;
  externalApiKey?: string;
  externalModel?: string;
  temperature: number;
  topK: number;
  storagePaths: Record<Language, string>;
}

export interface AutoTestConfig {
    topic: string;
    count: number;
    language: Language;
    difficulty: Difficulty;
}

export type ViewMode = 'dashboard' | 'test-solver' | 'history' | 'evaluation' | 'documents' | 'exam-mode' | 'configuration' | 'bulk-editor';
