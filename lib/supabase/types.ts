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
      companies: {
        Row: {
          id: string
          name: string
          slug: string
          logo: string | null
          website: string | null
          description: string | null
          settings: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo?: string | null
          website?: string | null
          description?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo?: string | null
          website?: string | null
          description?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          company_id: string
          profile_id: string
          role: 'owner' | 'admin' | 'member' | 'viewer'
          permissions: Json
          is_active: boolean
          joined_at: string
          last_active_at: string | null
        }
        Insert: {
          id?: string
          company_id: string
          profile_id: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          permissions?: Json
          is_active?: boolean
          joined_at?: string
          last_active_at?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          profile_id?: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          permissions?: Json
          is_active?: boolean
          joined_at?: string
          last_active_at?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          company_id: string
          name: string
          slug: string
          description: string | null
          status: 'active' | 'inactive' | 'suspended'
          settings: Json
          metadata: Json
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          slug: string
          description?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          settings?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          slug?: string
          description?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          settings?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      agents: {
        Row: {
          id: string
          project_id: string
          name: string
          type: 'browser' | 'api' | 'cli'
          version: string | null
          description: string | null
          config: Json
          capabilities: Json
          is_active: boolean
          last_heartbeat: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          type: 'browser' | 'api' | 'cli'
          version?: string | null
          description?: string | null
          config?: Json
          capabilities?: Json
          is_active?: boolean
          last_heartbeat?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          type?: 'browser' | 'api' | 'cli'
          version?: string | null
          description?: string | null
          config?: Json
          capabilities?: Json
          is_active?: boolean
          last_heartbeat?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      agent_sessions: {
        Row: {
          id: string
          agent_id: string
          session_token: string
          started_at: string
          ended_at: string | null
          ip_address: string | null
          user_agent: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          agent_id: string
          session_token: string
          started_at?: string
          ended_at?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          agent_id?: string
          session_token?: string
          started_at?: string
          ended_at?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json
        }
      }
      transfers: {
        Row: {
          id: string
          project_id: string
          agent_id: string | null
          type: 'deposit' | 'withdrawal' | 'internal'
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          amount: string
          currency: string
          from_address: string | null
          to_address: string | null
          transaction_hash: string | null
          metadata: Json
          created_at: string
          updated_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          agent_id?: string | null
          type: 'deposit' | 'withdrawal' | 'internal'
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          amount: string
          currency?: string
          from_address?: string | null
          to_address?: string | null
          transaction_hash?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          agent_id?: string | null
          type?: 'deposit' | 'withdrawal' | 'internal'
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          amount?: string
          currency?: string
          from_address?: string | null
          to_address?: string | null
          transaction_hash?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
          processed_at?: string | null
        }
      }
      agent_telemetry: {
        Row: {
          id: string
          agent_id: string
          session_id: string | null
          event_type: string
          event_data: Json
          metrics: Json
          timestamp: string
        }
        Insert: {
          id?: string
          agent_id: string
          session_id?: string | null
          event_type: string
          event_data?: Json
          metrics?: Json
          timestamp?: string
        }
        Update: {
          id?: string
          agent_id?: string
          session_id?: string | null
          event_type?: string
          event_data?: Json
          metrics?: Json
          timestamp?: string
        }
      }
      agent_logs: {
        Row: {
          id: string
          agent_id: string
          session_id: string | null
          level: string
          message: string
          context: Json
          timestamp: string
        }
        Insert: {
          id?: string
          agent_id: string
          session_id?: string | null
          level: string
          message: string
          context?: Json
          timestamp?: string
        }
        Update: {
          id?: string
          agent_id?: string
          session_id?: string | null
          level?: string
          message?: string
          context?: Json
          timestamp?: string
        }
      }
      webhooks: {
        Row: {
          id: string
          project_id: string
          url: string
          events: Json
          secret: string | null
          is_active: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          url: string
          events?: Json
          secret?: string | null
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          url?: string
          events?: Json
          secret?: string | null
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      api_keys: {
        Row: {
          id: string
          project_id: string
          name: string
          key_hash: string
          prefix: string
          scopes: Json
          expires_at: string | null
          last_used_at: string | null
          is_active: boolean
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          key_hash: string
          prefix: string
          scopes?: Json
          expires_at?: string | null
          last_used_at?: string | null
          is_active?: boolean
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          key_hash?: string
          prefix?: string
          scopes?: Json
          expires_at?: string | null
          last_used_at?: string | null
          is_active?: boolean
          created_at?: string
          created_by?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      agent_type: 'browser' | 'api' | 'cli'
      transfer_status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
      transfer_type: 'deposit' | 'withdrawal' | 'internal'
      project_status: 'active' | 'inactive' | 'suspended'
      user_role: 'owner' | 'admin' | 'member' | 'viewer'
    }
  }
}