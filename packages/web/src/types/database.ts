export type Json
  = | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type Database = {
  public: {
    Tables: {
      knowledge_items: {
        Row: {
          id: string;
          user_id: string;
          source_platform: string;
          source_id: string | null;
          content_type: 'text' | 'document' | 'audio' | 'video' | 'image';
          title: string | null;
          content: string | null;
          raw_content: Json | null;
          metadata: Json;
          embedding: number[] | null;
          tags: string[];
          created_at: string;
          updated_at: string;
          processing_status: 'pending' | 'processing' | 'completed' | 'failed';
        };
        Insert: {
          id?: string;
          user_id: string;
          source_platform: string;
          source_id?: string | null;
          content_type: 'text' | 'document' | 'audio' | 'video' | 'image';
          title?: string | null;
          content?: string | null;
          raw_content?: Json | null;
          metadata?: Json;
          embedding?: number[] | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
        };
        Update: {
          id?: string;
          user_id?: string;
          source_platform?: string;
          source_id?: string | null;
          content_type?: 'text' | 'document' | 'audio' | 'video' | 'image';
          title?: string | null;
          content?: string | null;
          raw_content?: Json | null;
          metadata?: Json;
          embedding?: number[] | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
        };
      };
      platform_integrations: {
        Row: {
          id: string;
          user_id: string;
          platform_type: string;
          auth_data: Json | null;
          sync_settings: Json | null;
          last_sync: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform_type: string;
          auth_data?: Json | null;
          sync_settings?: Json | null;
          last_sync?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          platform_type?: string;
          auth_data?: Json | null;
          sync_settings?: Json | null;
          last_sync?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      processing_jobs: {
        Row: {
          id: string;
          knowledge_item_id: string | null;
          job_type: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          result: Json | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          knowledge_item_id?: string | null;
          job_type: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          result?: Json | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          knowledge_item_id?: string | null;
          job_type?: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          result?: Json | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      [_ in never]: never
    };
    Enums: {
      [_ in never]: never
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
};
