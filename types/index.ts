/**
 * TRD Live Learning - Type Definitions
 * Core types for the training generator platform
 */

// ============================================
// FILE TYPE DEFINITIONS
// ============================================

export type SupportedFileType =
  | 'image'
  | 'pdf'
  | 'csv'
  | 'excel'
  | 'text'
  | 'markdown'
  | 'video';

export interface ParsedFile {
  originalFile: File;
  type: SupportedFileType;
  mimeType: string;
  extractedContent: ExtractedContent;
  metadata: FileMetadata;
}

export interface ExtractedContent {
  text?: string;           // For text-based files
  pages?: PageContent[];   // For multi-page docs (PDF)
  data?: DataRow[];        // For CSV/Excel
  frames?: VideoFrame[];   // For video
  rawBase64?: string;      // For images
}

export interface PageContent {
  pageNumber: number;
  text: string;
  imageBase64?: string;
}

export interface DataRow {
  [key: string]: string | number;
}

export interface VideoFrame {
  timestamp: number;
  imageBase64: string;
  audioTranscript?: string;
}

export interface FileMetadata {
  fileName: string;
  fileSize: number;
  pageCount?: number;
  duration?: number;
  rowCount?: number;
  columnCount?: number;
}

// ============================================
// OUTPUT TYPE DEFINITIONS
// ============================================

export type OutputType =
  | 'field-simulator'       // Voice roleplay training
  | 'damage-detective'      // Hotspot identification quiz
  | 'commission-tycoon'     // Quiz game with earnings
  | 'objection-arena'       // Objection battle practice
  | 'inspection-walkthrough' // Step-by-step checklist
  | 'flashcard-drill'       // Q&A flashcards
  | 'interactive-timeline'  // Process sequence explorer
  | 'scenario-builder'      // NEW: Custom scenario creator
  | 'pitch-perfector'       // NEW: Pitch practice with scoring
  | 'auto';                 // Auto-select best type

export interface OutputConfig {
  id: OutputType;
  name: string;
  description: string;
  icon: string;
  applicableInputs: SupportedFileType[];
  promptFragment: string;
}

// ============================================
// CREATION TYPE (Extended from existing)
// ============================================

export interface Creation {
  id: string;
  name: string;
  html: string;
  originalImage?: string;
  outputType?: OutputType;
  sourceFileType?: SupportedFileType;
  metadata?: FileMetadata;
  timestamp: Date;
}

// ============================================
// GENERATION TYPES
// ============================================

export interface GenerationRequest {
  parsedFile: ParsedFile;
  outputType: OutputType;
  additionalInstructions?: string;
}

export interface GenerationResult {
  success: boolean;
  html?: string;
  error?: string;
}
