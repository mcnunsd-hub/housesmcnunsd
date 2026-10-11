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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          id: string
          reason: string | null
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          reason?: string | null
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          reason?: string | null
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      checkin_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          location: string | null
          points: number
          scanned_by: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type?: string
          id?: string
          location?: string | null
          points?: number
          scanned_by: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          location?: string | null
          points?: number
          scanned_by?: string
          user_id?: string
        }
        Relationships: []
      }
      checkin_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      committees: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      delegations: {
        Row: {
          committee_id: string
          country: string
          created_at: string
          id: string
        }
        Insert: {
          committee_id: string
          country: string
          created_at?: string
          id?: string
        }
        Update: {
          committee_id?: string
          country?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delegations_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
        ]
      }
      house_assignments: {
        Row: {
          actor_id: string | null
          answers: Json | null
          cohort_snapshot: Json | null
          created_at: string
          fit_scores: Json | null
          house: Database["public"]["Enums"]["house"]
          id: string
          method: string
          previous_house: Database["public"]["Enums"]["house"] | null
          reason: string | null
          seed: string | null
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          answers?: Json | null
          cohort_snapshot?: Json | null
          created_at?: string
          fit_scores?: Json | null
          house: Database["public"]["Enums"]["house"]
          id?: string
          method?: string
          previous_house?: Database["public"]["Enums"]["house"] | null
          reason?: string | null
          seed?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string | null
          answers?: Json | null
          cohort_snapshot?: Json | null
          created_at?: string
          fit_scores?: Json | null
          house?: Database["public"]["Enums"]["house"]
          id?: string
          method?: string
          previous_house?: Database["public"]["Enums"]["house"] | null
          reason?: string | null
          seed?: string | null
          user_id?: string
        }
        Relationships: []
      }
      invite_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string | null
          id: string
          max_uses: number | null
          participant_type: string
          uses: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          max_uses?: number | null
          participant_type: string
          uses?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          max_uses?: number | null
          participant_type?: string
          uses?: number
        }
        Relationships: []
      }
      mesa_roster: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          committee_id: string
          created_at: string
          full_name: string
          id: string
          position: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          committee_id: string
          created_at?: string
          full_name: string
          id?: string
          position: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          committee_id?: string
          created_at?: string
          full_name?: string
          id?: string
          position?: string
        }
        Relationships: [
          {
            foreignKeyName: "mesa_roster_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_submissions: {
        Row: {
          created_at: string
          id: string
          mission_id: string
          proof_text: string | null
          proof_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mission_id: string
          proof_text?: string | null
          proof_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mission_id?: string
          proof_text?: string | null
          proof_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      missions: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          points: number
          requires_proof: boolean
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description: string
          id?: string
          points?: number
          requires_proof?: boolean
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          points?: number
          requires_proof?: boolean
          title?: string
        }
        Relationships: []
      }
      participants: {
        Row: {
          committee_id: string | null
          country: string | null
          created_at: string
          experience: string | null
          full_name: string
          grade_level: string | null
          mesa_roster_id: string | null
          participant_type: string
          school: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          committee_id?: string | null
          country?: string | null
          created_at?: string
          experience?: string | null
          full_name: string
          grade_level?: string | null
          mesa_roster_id?: string | null
          participant_type: string
          school?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          committee_id?: string | null
          country?: string | null
          created_at?: string
          experience?: string | null
          full_name?: string
          grade_level?: string | null
          mesa_roster_id?: string | null
          participant_type?: string
          school?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_mesa_roster_id_fkey"
            columns: ["mesa_roster_id"]
            isOneToOne: false
            referencedRelation: "mesa_roster"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          committee: string | null
          country: string | null
          created_at: string
          full_name: string | null
          house: Database["public"]["Enums"]["house"] | null
          id: string
          seniority_tier: Database["public"]["Enums"]["seniority_tier"]
          sorted_at: string | null
          updated_at: string
        }
        Insert: {
          committee?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          house?: Database["public"]["Enums"]["house"] | null
          id: string
          seniority_tier?: Database["public"]["Enums"]["seniority_tier"]
          sorted_at?: string | null
          updated_at?: string
        }
        Update: {
          committee?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          house?: Database["public"]["Enums"]["house"] | null
          id?: string
          seniority_tier?: Database["public"]["Enums"]["seniority_tier"]
          sorted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      score_events: {
        Row: {
          created_at: string
          house: Database["public"]["Enums"]["house"]
          id: string
          points: number
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          house: Database["public"]["Enums"]["house"]
          id?: string
          points?: number
          source: string
          user_id: string
        }
        Update: {
          created_at?: string
          house?: Database["public"]["Enums"]["house"]
          id?: string
          points?: number
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      trivia_answers: {
        Row: {
          answered_at: string
          created_at: string
          id: string
          is_correct: boolean
          points_awarded: number
          question_id: string
          selected_answer: string
          session_id: string
          user_id: string
        }
        Insert: {
          answered_at?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          points_awarded?: number
          question_id: string
          selected_answer: string
          session_id: string
          user_id: string
        }
        Update: {
          answered_at?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          points_awarded?: number
          question_id?: string
          selected_answer?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trivia_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "trivia_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trivia_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "trivia_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      trivia_questions: {
        Row: {
          active_from: string | null
          active_until: string | null
          correct_answer: string
          created_at: string
          id: string
          options: Json
          order_index: number
          points: number
          question_text: string
        }
        Insert: {
          active_from?: string | null
          active_until?: string | null
          correct_answer: string
          created_at?: string
          id?: string
          options?: Json
          order_index: number
          points?: number
          question_text: string
        }
        Update: {
          active_from?: string | null
          active_until?: string | null
          correct_answer?: string
          created_at?: string
          id?: string
          options?: Json
          order_index?: number
          points?: number
          question_text?: string
        }
        Relationships: []
      }
      trivia_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          started_at: string
          total_score: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          started_at?: string
          total_score?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          started_at?: string
          total_score?: number
          user_id?: string
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
    }
    Views: {
      house_scores: {
        Row: {
          delegate_count: number | null
          house: Database["public"]["Enums"]["house"] | null
          total_points: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_override_house: {
        Args: {
          _house: Database["public"]["Enums"]["house"]
          _reason: string
          _user_id: string
        }
        Returns: undefined
      }
      available_mesa_roster: {
        Args: never
        Returns: {
          committee_id: string
          full_name: string
          id: string
          position: string
        }[]
      }
      find_user_id_by_email: { Args: { _email: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      house_cohort_counts: {
        Args: { _user_id: string }
        Returns: {
          house: Database["public"]["Enums"]["house"]
          same_committee: number
          same_level: number
          same_school: number
          same_type: number
          total: number
        }[]
      }
      house_population: {
        Args: never
        Returns: {
          house: Database["public"]["Enums"]["house"]
          n: number
          seniority_tier: Database["public"]["Enums"]["seniority_tier"]
        }[]
      }
      house_totals: {
        Args: never
        Returns: {
          delegate_count: number
          house: Database["public"]["Enums"]["house"]
          total_points: number
        }[]
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff_or_admin: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      leaderboard_feed: {
        Args: { _limit?: number }
        Returns: {
          created_at: string
          delegate_name: string
          house: Database["public"]["Enums"]["house"]
          id: string
          points: number
          source: string
        }[]
      }
      my_roles: { Args: never; Returns: string[] }
      register_participant: {
        Args: {
          _code: string
          _committee_id: string
          _country: string
          _experience: string
          _full_name: string
          _grade_level: string
          _roster_id: string
          _school: string
          _type: string
        }
        Returns: string
      }
      review_participant: {
        Args: { _approve: boolean; _reason: string; _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "delegate"
        | "staff"
        | "admin"
        | "mesa"
        | "profesor"
        | "super_admin"
      house: "atlas" | "aurora" | "summit" | "eclipse"
      seniority_tier: "advanced" | "first_timer"
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
      app_role: [
        "delegate",
        "staff",
        "admin",
        "mesa",
        "profesor",
        "super_admin",
      ],
      house: ["atlas", "aurora", "summit", "eclipse"],
      seniority_tier: ["advanced", "first_timer"],
    },
  },
} as const
