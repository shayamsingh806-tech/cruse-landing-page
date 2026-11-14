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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          amount_paise: number | null
          booking_date: string
          created_at: string
          email: string
          experience: string
          guest_count: number
          id: string
          name: string
          notes: string | null
          payment_status: string
          phone: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          source: string
          status: string
        }
        Insert: {
          amount_paise?: number | null
          booking_date: string
          created_at?: string
          email: string
          experience: string
          guest_count: number
          id?: string
          name: string
          notes?: string | null
          payment_status?: string
          phone: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          source?: string
          status?: string
        }
        Update: {
          amount_paise?: number | null
          booking_date?: string
          created_at?: string
          email?: string
          experience?: string
          guest_count?: number
          id?: string
          name?: string
          notes?: string | null
          payment_status?: string
          phone?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          source?: string
          status?: string
        }
        Relationships: []
      }
      chat_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      chat_knowledge: {
        Row: {
          answer: string
          created_at: string
          id: string
          question: string
          reason: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          question: string
          reason?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          question?: string
          reason?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_transcripts: {
        Row: {
          converted: boolean
          created_at: string
          id: string
          message_count: number
          messages: Json
          reviewed: boolean
          session_id: string
          updated_at: string
        }
        Insert: {
          converted?: boolean
          created_at?: string
          id?: string
          message_count?: number
          messages?: Json
          reviewed?: boolean
          session_id: string
          updated_at?: string
        }
        Update: {
          converted?: boolean
          created_at?: string
          id?: string
          message_count?: number
          messages?: Json
          reviewed?: boolean
          session_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      enquiries: {
        Row: {
          created_at: string
          email: string
          enquiry_type: string
          first_name: string
          guest_count: number
          id: string
          last_name: string
          message: string | null
          phone: string
          requested_date: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          enquiry_type: string
          first_name: string
          guest_count: number
          id?: string
          last_name: string
          message?: string | null
          phone: string
          requested_date?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          enquiry_type?: string
          first_name?: string
          guest_count?: number
          id?: string
          last_name?: string
          message?: string | null
          phone?: string
          requested_date?: string | null
          status?: string
        }
        Relationships: []
      }
      experiences: {
        Row: {
          add_ons: string[] | null
          alt: string
          category: string
          created_at: string
          duration: string
          exclusions: string[] | null
          full_title: string | null
          hidden: boolean
          id: string
          image: string
          inclusions: string[] | null
          kind: string
          limits: string
          location: string
          overview: string
          price: string
          price_note: string | null
          reporting: string | null
          slug: string
          sort_order: number
          timing: string
          title: string
          updated_at: string
        }
        Insert: {
          add_ons?: string[] | null
          alt?: string
          category: string
          created_at?: string
          duration?: string
          exclusions?: string[] | null
          full_title?: string | null
          hidden?: boolean
          id?: string
          image?: string
          inclusions?: string[] | null
          kind: string
          limits?: string
          location?: string
          overview?: string
          price?: string
          price_note?: string | null
          reporting?: string | null
          slug: string
          sort_order?: number
          timing?: string
          title: string
          updated_at?: string
        }
        Update: {
          add_ons?: string[] | null
          alt?: string
          category?: string
          created_at?: string
          duration?: string
          exclusions?: string[] | null
          full_title?: string | null
          hidden?: boolean
          id?: string
          image?: string
          inclusions?: string[] | null
          kind?: string
          limits?: string
          location?: string
          overview?: string
          price?: string
          price_note?: string | null
          reporting?: string | null
          slug?: string
          sort_order?: number
          timing?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_carts: {
        Row: {
          amount_paise: number | null
          converted_at: string | null
          created_at: string
          id: string
          item_count: number
          items: Json
          last_opened_at: string | null
          open_count: number
          order_id: string | null
        }
        Insert: {
          amount_paise?: number | null
          converted_at?: string | null
          created_at?: string
          id?: string
          item_count?: number
          items?: Json
          last_opened_at?: string | null
          open_count?: number
          order_id?: string | null
        }
        Update: {
          amount_paise?: number | null
          converted_at?: string | null
          created_at?: string
          id?: string
          item_count?: number
          items?: Json
          last_opened_at?: string | null
          open_count?: number
          order_id?: string | null
        }
        Relationships: []
      }
      site_content: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visitor_logs: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: string
          ip: string | null
          path: string | null
          region: string | null
          session_id: string
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          path?: string | null
          region?: string | null
          session_id: string
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          path?: string | null
          region?: string | null
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_admin_by_email: { Args: { _email: string }; Returns: string }
      claim_first_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_admins: {
        Args: never
        Returns: {
          email: string
          user_id: string
        }[]
      }
      remove_admin: { Args: { _user_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin"],
    },
  },
} as const
