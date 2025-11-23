export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tenant_users: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
      }
      brand_profiles: {
        Row: {
          id: string
          tenant_id: string
          name: string
          industry: string | null
          tone: string | null
          target_audience: string | null
          brand_colors: Json | null
          brand_guidelines: string | null
          sample_content: string[] | null
          embeddings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          industry?: string | null
          tone?: string | null
          target_audience?: string | null
          brand_colors?: Json | null
          brand_guidelines?: string | null
          sample_content?: string[] | null
          embeddings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          industry?: string | null
          tone?: string | null
          target_audience?: string | null
          brand_colors?: Json | null
          brand_guidelines?: string | null
          sample_content?: string[] | null
          embeddings?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      content_items: {
        Row: {
          id: string
          tenant_id: string
          brand_profile_id: string | null
          type: string
          platform: string
          title: string | null
          text_content: string
          status: string
          metadata: Json | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          brand_profile_id?: string | null
          type: string
          platform: string
          title?: string | null
          text_content: string
          status?: string
          metadata?: Json | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          brand_profile_id?: string | null
          type?: string
          platform?: string
          title?: string | null
          text_content?: string
          status?: string
          metadata?: Json | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      images: {
        Row: {
          id: string
          tenant_id: string
          content_item_id: string | null
          storage_path: string
          url: string
          prompt: string | null
          provider: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          content_item_id?: string | null
          storage_path: string
          url: string
          prompt?: string | null
          provider?: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          content_item_id?: string | null
          storage_path?: string
          url?: string
          prompt?: string | null
          provider?: string
          metadata?: Json | null
          created_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          tenant_id: string
          content_item_id: string | null
          storage_path: string
          url: string
          prompt: string | null
          provider: string
          duration_seconds: number | null
          metadata: Json | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          content_item_id?: string | null
          storage_path: string
          url: string
          prompt?: string | null
          provider?: string
          duration_seconds?: number | null
          metadata?: Json | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          content_item_id?: string | null
          storage_path?: string
          url?: string
          prompt?: string | null
          provider?: string
          duration_seconds?: number | null
          metadata?: Json | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      scheduled_posts: {
        Row: {
          id: string
          tenant_id: string
          content_item_id: string
          platform: string
          scheduled_at: string
          published_at: string | null
          status: string
          external_post_id: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          content_item_id: string
          platform: string
          scheduled_at: string
          published_at?: string | null
          status?: string
          external_post_id?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          content_item_id?: string
          platform?: string
          scheduled_at?: string
          published_at?: string | null
          status?: string
          external_post_id?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      embeddings: {
        Row: {
          id: string
          tenant_id: string
          entity_type: string
          entity_id: string
          embedding: number[] | null
          text_content: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          entity_type: string
          entity_id: string
          embedding?: number[] | null
          text_content?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          entity_type?: string
          entity_id?: string
          embedding?: number[] | null
          text_content?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          tenant_id: string
          user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
    }
  }
}

