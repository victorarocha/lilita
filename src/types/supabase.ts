export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      currency: {
        Row: {
          created_at: string
          id: number
          name: string
          rate: number
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          rate: number
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          rate?: number
        }
        Relationships: []
      }
      customer: {
        Row: {
          created_at: string
          email: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      hospitality_center: {
        Row: {
          created_at: string
          id: number
          image: string | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          image?: string | null
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          image?: string | null
          name?: string
        }
        Relationships: []
      }
      merchant: {
        Row: {
          created_at: string
          cuisine_type: string | null
          description: string | null
          hospitality_center_id: number
          id: number
          image_url: string | null
          name: string
          prep_time: number | null
          rating: number | null
        }
        Insert: {
          created_at?: string
          cuisine_type?: string | null
          description?: string | null
          hospitality_center_id: number
          id?: number
          image_url?: string | null
          name: string
          prep_time?: number | null
          rating?: number | null
        }
        Update: {
          created_at?: string
          cuisine_type?: string | null
          description?: string | null
          hospitality_center_id?: number
          id?: number
          image_url?: string | null
          name?: string
          prep_time?: number | null
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_hospitality_center_id_fkey"
            columns: ["hospitality_center_id"]
            isOneToOne: false
            referencedRelation: "hospitality_center"
            referencedColumns: ["id"]
          },
        ]
      }
      order: {
        Row: {
          created_at: string
          customer_id: number
          id: number
          order_code: string
          ordered_at: string | null
          ordering_location_id: number
          status_id: number
          user_rating: number | null
        }
        Insert: {
          created_at?: string
          customer_id: number
          id?: number
          order_code: string
          ordered_at?: string | null
          ordering_location_id: number
          status_id?: number
          user_rating?: number | null
        }
        Update: {
          created_at?: string
          customer_id?: number
          id?: number
          order_code?: string
          ordered_at?: string | null
          ordering_location_id?: number
          status_id?: number
          user_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_ordering_location_id_fkey"
            columns: ["ordering_location_id"]
            isOneToOne: false
            referencedRelation: "ordering_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "status"
            referencedColumns: ["id"]
          },
        ]
      }
      order_products: {
        Row: {
          created_at: string
          id: number
          order_id: number
          price: number
          product_id: number
          product_variation_json: Json | null
        }
        Insert: {
          created_at?: string
          id?: number
          order_id: number
          price: number
          product_id: number
          product_variation_json?: Json | null
        }
        Update: {
          created_at?: string
          id?: number
          order_id?: number
          price?: number
          product_id?: number
          product_variation_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "order_products_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      ordering_location: {
        Row: {
          created_at: string
          hospitality_center_id: number | null
          id: number
          name: string
          qr_code: Json
          type: string | null
        }
        Insert: {
          created_at?: string
          hospitality_center_id?: number | null
          id?: number
          name: string
          qr_code: Json
          type?: string | null
        }
        Update: {
          created_at?: string
          hospitality_center_id?: number | null
          id?: number
          name?: string
          qr_code?: Json
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordering_location_hospitality_center_id_fkey"
            columns: ["hospitality_center_id"]
            isOneToOne: false
            referencedRelation: "hospitality_center"
            referencedColumns: ["id"]
          },
        ]
      }
      product: {
        Row: {
          category_id: number | null
          created_at: string
          currency: string
          description: string | null
          id: number
          image: string | null
          merchant_id: number
          name: string
          price: number
        }
        Insert: {
          category_id?: number | null
          created_at?: string
          currency: string
          description?: string | null
          id?: number
          image?: string | null
          merchant_id: number
          name: string
          price: number
        }
        Update: {
          category_id?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: number
          image?: string | null
          merchant_id?: number
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_currency_fkey"
            columns: ["currency"]
            isOneToOne: false
            referencedRelation: "currency"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "product_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant"
            referencedColumns: ["id"]
          },
        ]
      }
      product_category: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      product_variation: {
        Row: {
          created_at: string
          id: number
          name: string
          price: number
          product_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          price: number
          product_id: number
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          price?: number
          product_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variation_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      status: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
