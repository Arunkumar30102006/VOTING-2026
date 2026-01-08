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
      companies: {
        Row: {
          cin_number: string
          company_name: string
          contact_email: string
          contact_phone: string
          created_at: string
          id: string
          registered_address: string
          updated_at: string
        }
        Insert: {
          cin_number: string
          company_name: string
          contact_email: string
          contact_phone: string
          created_at?: string
          id?: string
          registered_address: string
          updated_at?: string
        }
        Update: {
          cin_number?: string
          company_name?: string
          contact_email?: string
          contact_phone?: string
          created_at?: string
          id?: string
          registered_address?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_admins: {
        Row: {
          company_id: string
          created_at: string
          full_name: string
          id: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          full_name: string
          id?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          full_name?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_admins_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      nominees: {
        Row: {
          bio: string | null
          company_id: string
          created_at: string
          designation: string | null
          experience_years: number | null
          id: string
          is_email_sent: boolean
          nominee_email: string
          nominee_name: string
          photo_url: string | null
          qualification: string | null
          updated_at: string
          voting_session_id: string
        }
        Insert: {
          bio?: string | null
          company_id: string
          created_at?: string
          designation?: string | null
          experience_years?: number | null
          id?: string
          is_email_sent?: boolean
          nominee_email: string
          nominee_name: string
          photo_url?: string | null
          qualification?: string | null
          updated_at?: string
          voting_session_id: string
        }
        Update: {
          bio?: string | null
          company_id?: string
          created_at?: string
          designation?: string | null
          experience_years?: number | null
          id?: string
          is_email_sent?: boolean
          nominee_email?: string
          nominee_name?: string
          photo_url?: string | null
          qualification?: string | null
          updated_at?: string
          voting_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nominees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nominees_voting_session_id_fkey"
            columns: ["voting_session_id"]
            isOneToOne: false
            referencedRelation: "voting_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      resolutions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          resolution_type: string
          title: string
          voting_session_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          resolution_type?: string
          title: string
          voting_session_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          resolution_type?: string
          title?: string
          voting_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resolutions_voting_session_id_fkey"
            columns: ["voting_session_id"]
            isOneToOne: false
            referencedRelation: "voting_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      shareholders: {
        Row: {
          company_id: string
          created_at: string
          credential_created_at: string
          email: string
          id: string
          is_credential_used: boolean
          login_id: string
          password_hash: string
          phone: string | null
          shareholder_name: string
          shares_held: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          credential_created_at?: string
          email: string
          id?: string
          is_credential_used?: boolean
          login_id: string
          password_hash: string
          phone?: string | null
          shareholder_name: string
          shares_held?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          credential_created_at?: string
          email?: string
          id?: string
          is_credential_used?: boolean
          login_id?: string
          password_hash?: string
          phone?: string | null
          shareholder_name?: string
          shares_held?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shareholders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      votes: {
        Row: {
          id: string
          ip_address: string | null
          resolution_id: string
          shareholder_id: string
          user_agent: string | null
          vote_hash: string
          vote_value: string
          voted_at: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          resolution_id: string
          shareholder_id: string
          user_agent?: string | null
          vote_hash: string
          vote_value: string
          voted_at?: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          resolution_id?: string
          shareholder_id?: string
          user_agent?: string | null
          vote_hash?: string
          vote_value?: string
          voted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_resolution_id_fkey"
            columns: ["resolution_id"]
            isOneToOne: false
            referencedRelation: "resolutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_shareholder_id_fkey"
            columns: ["shareholder_id"]
            isOneToOne: false
            referencedRelation: "shareholders"
            referencedColumns: ["id"]
          },
        ]
      }
      voting_sessions: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          end_date: string
          id: string
          is_active: boolean
          is_meeting_emails_sent: boolean
          meeting_link: string | null
          meeting_password: string | null
          meeting_platform: string | null
          start_date: string
          title: string
          updated_at: string
          voting_instructions: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean
          is_meeting_emails_sent?: boolean
          meeting_link?: string | null
          meeting_password?: string | null
          meeting_platform?: string | null
          start_date: string
          title: string
          updated_at?: string
          voting_instructions?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          is_meeting_emails_sent?: boolean
          meeting_link?: string | null
          meeting_password?: string | null
          meeting_platform?: string | null
          start_date?: string
          title?: string
          updated_at?: string
          voting_instructions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voting_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "company_admin" | "shareholder"
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
    Enums: {
      app_role: ["company_admin", "shareholder"],
    },
  },
} as const
