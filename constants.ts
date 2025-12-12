
import { ISOQuestion, DocumentFile, ConfigState, Language } from './types';
import { Terminal, BookOpen, CheckCircle, FileText, Server, Shield, Cpu, Play, Search, Upload, Trash2, File, FileType, Check, AlertCircle, Save, Folder, ChevronDown, ChevronRight, Archive, Edit, ClipboardList, CheckSquare, XCircle, RefreshCw, Dices, Settings, Sliders, Inbox, ArrowRightCircle, Cloud, Key, Download, Globe, FolderOpen, Wand2, Layers, GitMerge, Scale } from 'lucide-react';

export const ICONS = {
  Terminal,
  BookOpen,
  CheckCircle,
  FileText,
  Server,
  Shield,
  Cpu,
  Play,
  Search,
  Upload,
  Trash2,
  File,
  FileType,
  Check,
  AlertCircle,
  Save,
  Folder,
  ChevronDown,
  ChevronRight,
  Archive,
  Edit,
  ClipboardList,
  CheckSquare,
  XCircle,
  RefreshCw,
  Dices,
  Settings,
  Sliders,
  Inbox,
  ArrowRightCircle,
  Cloud,
  Key,
  Download,
  Globe,
  FolderOpen,
  Wand2,
  Layers,
  GitMerge,
  Scale
};

export const COURSE_TOPICS = [
  "Tema 1: Introducción a S.O. y Linux",
  "Tema 2: Sistema de Ficheros",
  "Tema 3: Gestión de Permisos y Usuarios",
  "Tema 4: Gestión de Procesos",
  "Tema 5: Shell Scripting (Bash)",
  "Tema 6: Administración de Sistemas y Redes"
];

export const OLLAMA_MODELS = [
  "llama3",
  "mistral",
  "gemma:7b",
  "phi3",
  "neural-chat",
  "starling-lm",
  "vicuna"
];

export const LANGUAGE_LABELS: Record<Language, string> = {
  es: "Castellano",
  eu: "Euskara",
  en: "English"
};

export const DEFAULT_CONFIG: ConfigState = {
  provider: 'ollama',
  ollamaUrl: "http://localhost:11434",
  selectedModel: "llama3",
  externalApiKey: "",
  externalModel: "gpt-4o",
  temperature: 0.7,
  topK: 40,
  storagePaths: {
    es: "./data/es/tests.json",
    eu: "./data/eu/tests.json",
    en: "./data/en/tests.json"
  }
};

export const SAMPLE_QUESTIONS: ISOQuestion[] = [
  {
    id: "tema3_permisos.05",
    tema: "Tema 3: Gestión de Permisos y Usuarios",
    enunciado: "¿Qué comando se utiliza en Ubuntu 24.04 para añadir permisos de ejecución al propietario de un archivo llamado 'script.sh' sin modificar los demás permisos?",
    opciones: [
      "chmod u+x script.sh",
      "chmod 777 script.sh",
      "chown +x script.sh",
      "chmod a+x script.sh"
    ],
    opcionCorrecta: 1
  },
  {
    id: "tema4_procesos.12",
    tema: "Tema 4: Gestión de Procesos",
    enunciado: "En un script bash, ¿qué variable especial almacena el número de argumentos pasados al script?",
    opciones: [
      "$#",
      "$@",
      "$?",
      "$$"
    ],
    opcionCorrecta: 1
  },
  {
    id: "tema2_ficheros.02",
    tema: "Tema 2: Sistema de Ficheros",
    enunciado: "Queremos visualizar las últimas 10 líneas del archivo syslog. ¿Qué comando es el más apropiado?",
    opciones: [
      "head -n 10 /var/log/syslog",
      "cat /var/log/syslog | limit 10",
      "tail -n 10 /var/log/syslog",
      "less /var/log/syslog"
    ],
    opcionCorrecta: 3
  }
];

export const MOCK_PDF_CONTEXT = `
---
# Apuntes ISO - Tema 3: Gestión de Archivos y Permisos

## El comando chmod
El comando 'chmod' (change mode) permite cambiar los permisos de acceso de ficheros y directorios.
Sintaxis simbólica: chmod [quién][operador][permiso] archivo
- Quién: u (usuario/propietario), g (grupo), o (otros), a (todos).
- Operador: + (añadir), - (quitar), = (asignar exacto).
- Permiso: r (lectura), w (escritura), x (ejecución).

Ejemplo: 'chmod u+x archivo' añade permiso de ejecución solo al propietario.

## Variables Especiales en Bash
- $0: Nombre del script.
- $1, $2...: Argumentos posicionales.
- $#: Número total de argumentos.
- $?: Estado de salida del último comando ejecutado (0 éxito, !=0 error).
- $$: PID del proceso actual.
---
`;

export const INITIAL_DOCUMENTS: DocumentFile[] = [
  {
    id: "doc_001",
    name: "Apuntes_ISO_Tema1_5.pdf",
    type: "pdf",
    size: "2.4 MB",
    uploadDate: "2023-10-01",
    status: "indexed"
  },
  {
    id: "doc_002",
    name: "Guia_Ubuntu_24_04.docx",
    type: "docx",
    size: "1.1 MB",
    uploadDate: "2023-10-05",
    status: "indexed"
  }
];
