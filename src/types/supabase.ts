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
      registries: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string | null
          occasion: string | null
          date: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description?: string | null
          occasion?: string | null
          date?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string | null
          occasion?: string | null
          date?: string | null
          user_id?: string
        }
      }
      gift_items: {
        Row: {
          id: string
          created_at: string
          registry_id: string
          name: string
          price: number
          quantity: number
          product_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          registry_id: string
          name: string
          price: number
          quantity: number
          product_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          registry_id?: string
          name?: string
          price?: number
          quantity?: number
          product_url?: string | null
        }
      }
      contributions: {
        Row: {
          id: string
          created_at: string
          gift_item_id: string
          contributor_name: string
          amount: number
          message: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          gift_item_id: string
          contributor_name: string
          amount: number
          message?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          gift_item_id?: string
          contributor_name?: string
          amount?: number
          message?: string | null
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
      [_ in never]: never
    }
  }
} 