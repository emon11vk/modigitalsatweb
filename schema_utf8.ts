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
      admins: {
        Row: {
          email: string
          granted_at: string
          granted_by: string | null
          id: string
          is_root: boolean
        }
        Insert: {
          email: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_root?: boolean
        }
        Update: {
          email?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_root?: boolean
        }
        Relationships: []
      }
      exam_folders: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      exam_questions: {
        Row: {
          choices: Json
          correct_answer: string | null
          created_at: string
          explanation: string | null
          id: string
          image_url: string | null
          passage: string | null
          position: number
          question_text: string
          section_id: string
          type: string
          updated_at: string
        }
        Insert: {
          choices?: Json
          correct_answer?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          image_url?: string | null
          passage?: string | null
          position?: number
          question_text: string
          section_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          choices?: Json
          correct_answer?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          image_url?: string | null
          passage?: string | null
          position?: number
          question_text?: string
          section_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "exam_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_sections: {
        Row: {
          exam_id: string
          id: string
          name: string
          position: number
        }
        Insert: {
          exam_id: string
          id?: string
          name: string
          position?: number
        }
        Update: {
          exam_id?: string
          id?: string
          name?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "exam_sections_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          created_at: string
          created_by: string | null
          deadline: string | null
          folder_id: string | null
          id: string
          is_locked: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          folder_id?: string | null
          id?: string
          is_locked?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          folder_id?: string | null
          id?: string
          is_locked?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "exam_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          deadline: string | null
          duration_minutes: number
          folder_id: string | null
          id: string
          is_locked: boolean | null
          module_num: number
          questions_count: number
          subject: string
          title: string
        }
        Insert: {
          deadline?: string | null
          duration_minutes: number
          folder_id?: string | null
          id?: string
          is_locked?: boolean | null
          module_num: number
          questions_count: number
          subject: string
          title: string
        }
        Update: {
          deadline?: string | null
          duration_minutes?: number
          folder_id?: string | null
          id?: string
          is_locked?: boolean | null
          module_num?: number
          questions_count?: number
          subject?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "exam_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          avg_score: number | null
          id: string
          name: string
          tests_completed: number | null
          total_score: number | null
        }
        Insert: {
          avatar_url?: string | null
          avg_score?: number | null
          id: string
          name: string
          tests_completed?: number | null
          total_score?: number | null
        }
        Update: {
          avatar_url?: string | null
          avg_score?: number | null
          id?: string
          name?: string
          tests_completed?: number | null
          total_score?: number | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: Json
          id: number
          image_url: string | null
          module_id: string | null
          options: Json | null
          passage_intro: string | null
          passage_paragraphs: Json | null
          passage_title: string | null
          question_type: string
          text: string
        }
        Insert: {
          correct_answer: Json
          id?: number
          image_url?: string | null
          module_id?: string | null
          options?: Json | null
          passage_intro?: string | null
          passage_paragraphs?: Json | null
          passage_title?: string | null
          question_type?: string
          text: string
        }
        Update: {
          correct_answer?: Json
          id?: number
          image_url?: string | null
          module_id?: string | null
          options?: Json | null
          passage_intro?: string | null
          passage_paragraphs?: Json | null
          passage_title?: string | null
          question_type?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      test_answers: {
        Row: {
          history_id: string | null
          id: string
          is_correct: boolean
          question_id: number | null
          user_answer: string | null
        }
        Insert: {
          history_id?: string | null
          id?: string
          is_correct: boolean
          question_id?: number | null
          user_answer?: string | null
        }
        Update: {
          history_id?: string | null
          id?: string
          is_correct?: boolean
          question_id?: number | null
          user_answer?: string | null
        }
        Relationships: []
      }
      test_history: {
        Row: {
          correct_count: number
          created_at: string | null
          id: string
          is_first_attempt: boolean | null
          module_id: string | null
          total_count: number
          user_id: string | null
        }
        Insert: {
          correct_count: number
          created_at?: string | null
          id?: string
          is_first_attempt?: boolean | null
          module_id?: string | null
          total_count: number
          user_id?: string | null
        }
        Update: {
          correct_count?: number
          created_at?: string | null
          id?: string
          is_first_attempt?: boolean | null
          module_id?: string | null
          total_count?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_history_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vocab_folders: {
        Row: {
          created_at: string
          id: string
          is_admin_folder: boolean | null
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin_folder?: boolean | null
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_admin_folder?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      vocabulary: {
        Row: {
          audio_url: string | null
          created_at: string | null
          definition: string
          example: string | null
          folder_id: string | null
          id: string
          next_review_date: string | null
          pronunciation: string | null
          sm2_ease_factor: number | null
          sm2_interval: number | null
          sm2_repetitions: number | null
          status: string | null
          term: string
          type: string
          user_id: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          definition: string
          example?: string | null
          folder_id?: string | null
          id?: string
          next_review_date?: string | null
          pronunciation?: string | null
          sm2_ease_factor?: number | null
          sm2_interval?: number | null
          sm2_repetitions?: number | null
          status?: string | null
          term: string
          type: string
          user_id?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          definition?: string
          example?: string | null
          folder_id?: string | null
          id?: string
          next_review_date?: string | null
          pronunciation?: string | null
          sm2_ease_factor?: number | null
          sm2_interval?: number | null
          sm2_repetitions?: number | null
          status?: string | null
          term?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "vocab_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { check_email: string }; Returns: boolean }
      is_root_admin: { Args: { check_email: string }; Returns: boolean }
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
