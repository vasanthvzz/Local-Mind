export type UUID = string;

export enum QueryType {
  GENERAL = 'general',
  RAG = 'rag',
  STRICT_RAG = 'strict_rag'
}

export enum SenderType {
  USER = 'user',
  ASSISTANT = 'assistant'
}

export enum DocFormat {
  PDF = 'pdf',
  TXT = 'txt',
  DOC = 'doc'
}

export interface Conversation {
  id: UUID;
  title: string;
  created_at: string; // ISO Date
  updated_at: string; // ISO Date
  conv_type: QueryType;
  groupIds?: UUID[];
}

export interface Message {
  id: UUID;
  conversation_id: UUID;
  text: string;
  created_at: string; // ISO Date
  sender: SenderType;
}

export interface DocumentGroup {
  id: UUID;
  name: string;
  created_at: string; // ISO Date
  updated_at: string; // ISO Date
  last_trained: string; // ISO Date
  embed_path: string;
}

export interface Document {
  id: UUID;
  group_id: UUID;
  name: string;
  uploaded_at: string; // ISO Date
  path: string;
  format: DocFormat;
}

// Frontend specific extended types
export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface DocumentGroupWithDocs extends DocumentGroup {
  documents: Document[];
}