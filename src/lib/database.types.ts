// Hand-written to match supabase/schema.sql (schema v2).
// Regenerate from the live project when available:
//   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type JobStatus = 'open' | 'in_progress' | 'done' | 'paid' | 'void'
export type PaymentMethod = 'cash' | 'promptpay'
export type UserRole = 'owner' | 'staff'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: UserRole
          active: boolean
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string
          role?: UserRole
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: UserRole
          active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      car_sizes: {
        Row: { code: string; name_th: string; note: string | null; sort_order: number }
        Insert: { code: string; name_th: string; note?: string | null; sort_order?: number }
        Update: { code?: string; name_th?: string; note?: string | null; sort_order?: number }
        Relationships: []
      }
      services: {
        Row: { id: string; name_th: string; active: boolean; sort_order: number }
        Insert: { id: string; name_th: string; active?: boolean; sort_order?: number }
        Update: { id?: string; name_th?: string; active?: boolean; sort_order?: number }
        Relationships: []
      }
      price_matrix: {
        Row: { service_id: string; size_code: string; price: number }
        Insert: { service_id: string; size_code: string; price: number }
        Update: { service_id?: string; size_code?: string; price?: number }
        Relationships: []
      }
      shop_config: {
        Row: { id: number; shop_name: string; promptpay_id: string; updated_at: string }
        Insert: { id?: number; shop_name?: string; promptpay_id?: string; updated_at?: string }
        Update: { id?: number; shop_name?: string; promptpay_id?: string; updated_at?: string }
        Relationships: []
      }
      brands: {
        Row: { id: number; name_th: string; sort_order: number }
        Insert: { id?: number; name_th: string; sort_order?: number }
        Update: { id?: number; name_th?: string; sort_order?: number }
        Relationships: []
      }
      car_models: {
        Row: { id: number; brand_id: number; name: string; size_code: string | null; sort_order: number }
        Insert: { id?: number; brand_id: number; name: string; size_code?: string | null; sort_order?: number }
        Update: { id?: number; brand_id?: number; name?: string; size_code?: string | null; sort_order?: number }
        Relationships: []
      }
      customers: {
        Row: {
          plate: string
          province: string | null
          brand: string | null
          model: string | null
          size_code: string | null
          visit_count: number
          last_seen: string
        }
        Insert: {
          plate: string
          province?: string | null
          brand?: string | null
          model?: string | null
          size_code?: string | null
          visit_count?: number
          last_seen?: string
        }
        Update: {
          plate?: string
          province?: string | null
          brand?: string | null
          model?: string | null
          size_code?: string | null
          visit_count?: number
          last_seen?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          id: number
          created_at: string
          plate: string
          province: string | null
          brand: string | null
          model: string | null
          size_code: string
          total: number
          staff_id: string
          status: JobStatus
          payment_method: PaymentMethod | null
          paid_at: string | null
          closed_at: string | null
          note: string | null
          service_id: string | null
          price: number | null
        }
        Insert: {
          id?: number
          created_at?: string
          plate: string
          province?: string | null
          brand?: string | null
          model?: string | null
          size_code: string
          total?: number
          staff_id?: string
          status?: JobStatus
          payment_method?: PaymentMethod | null
          paid_at?: string | null
          closed_at?: string | null
          note?: string | null
          service_id?: string | null
          price?: number | null
        }
        Update: {
          id?: number
          created_at?: string
          plate?: string
          province?: string | null
          brand?: string | null
          model?: string | null
          size_code?: string
          total?: number
          staff_id?: string
          status?: JobStatus
          payment_method?: PaymentMethod | null
          paid_at?: string | null
          closed_at?: string | null
          note?: string | null
          service_id?: string | null
          price?: number | null
        }
        Relationships: []
      }
      job_services: {
        Row: {
          id: number
          job_id: number
          service_id: string | null
          custom_name: string | null
          price: number
        }
        Insert: {
          id?: number
          job_id: number
          service_id?: string | null
          custom_name?: string | null
          price?: number
        }
        Update: {
          id?: number
          job_id?: number
          service_id?: string | null
          custom_name?: string | null
          price?: number
        }
        Relationships: []
      }
    }
    Views: {
      v_daily_revenue: {
        Row: {
          biz_date: string | null
          job_count: number | null
          revenue_paid: number | null
          revenue_all: number | null
        }
        Relationships: []
      }
      v_service_breakdown: {
        Row: {
          service: string | null
          size_code: string | null
          line_count: number | null
          revenue: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_job: {
        Args: { header: Json; lines: Json }
        Returns: number
      }
      is_owner: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience row aliases
export type Profile = Database['public']['Tables']['profiles']['Row']
export type CarSize = Database['public']['Tables']['car_sizes']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type PriceMatrixRow = Database['public']['Tables']['price_matrix']['Row']
export type ShopConfig = Database['public']['Tables']['shop_config']['Row']
export type Brand = Database['public']['Tables']['brands']['Row']
export type CarModel = Database['public']['Tables']['car_models']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type Job = Database['public']['Tables']['jobs']['Row']
export type JobService = Database['public']['Tables']['job_services']['Row']
export type DailyRevenue = Database['public']['Views']['v_daily_revenue']['Row']
export type ServiceBreakdown = Database['public']['Views']['v_service_breakdown']['Row']
