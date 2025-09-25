export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          bathroom_type: string | null
          created_at: string
          date: string
          id: string
          mood_scale: number | null
          notes: string | null
          patient_id: string
          type: Database["public"]["Enums"]["event_type"]
          updated_at: string
          volume_ml: number | null
        }
        Insert: {
          bathroom_type?: string | null
          created_at?: string
          date: string
          id?: string
          mood_scale?: number | null
          notes?: string | null
          patient_id: string
          type: Database["public"]["Enums"]["event_type"]
          updated_at?: string
          volume_ml?: number | null
        }
        Update: {
          bathroom_type?: string | null
          created_at?: string
          date?: string
          id?: string
          mood_scale?: number | null
          notes?: string | null
          patient_id?: string
          type?: Database["public"]["Enums"]["event_type"]
          updated_at?: string
          volume_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_diagnoses: {
        Row: {
          created_at: string
          diagnosis_code: string | null
          diagnosis_text: string
          id: string
          medical_record_id: string
          primary_diagnosis: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          diagnosis_code?: string | null
          diagnosis_text: string
          id?: string
          medical_record_id: string
          primary_diagnosis?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          diagnosis_code?: string | null
          diagnosis_text?: string
          id?: string
          medical_record_id?: string
          primary_diagnosis?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_diagnoses_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_exams: {
        Row: {
          created_at: string
          exam_date: string | null
          exam_type: string
          id: string
          medical_record_id: string
          notes: string | null
          result: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          exam_date?: string | null
          exam_type: string
          id?: string
          medical_record_id: string
          notes?: string | null
          result?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          exam_date?: string | null
          exam_type?: string
          id?: string
          medical_record_id?: string
          notes?: string | null
          result?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_exams_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_record_attachments: {
        Row: {
          attachment_type: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          medical_record_id: string
          updated_at: string
        }
        Insert: {
          attachment_type: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          medical_record_id: string
          updated_at?: string
        }
        Update: {
          attachment_type?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          medical_record_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_record_attachments_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_record_shares: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          medical_record_id: string
          permissions: string
          shared_by: string
          shared_with: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          medical_record_id: string
          permissions?: string
          shared_by: string
          shared_with: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          medical_record_id?: string
          permissions?: string
          shared_by?: string
          shared_with?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_record_shares_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_record_shares_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_record_shares_shared_with_fkey"
            columns: ["shared_with"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_record_templates: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          template_data: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          template_data: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          template_data?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_record_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          allergies: string | null
          assessment_plan: string | null
          chief_complaint: string | null
          created_at: string
          doctor_id: string
          family_history: string | null
          history_present_illness: string | null
          id: string
          medications: string | null
          notes: string | null
          past_medical_history: string | null
          patient_id: string
          physical_examination: string | null
          record_date: string
          review_systems: string | null
          social_history: string | null
          status: string
          updated_at: string
        }
        Insert: {
          allergies?: string | null
          assessment_plan?: string | null
          chief_complaint?: string | null
          created_at?: string
          doctor_id: string
          family_history?: string | null
          history_present_illness?: string | null
          id?: string
          medications?: string | null
          notes?: string | null
          past_medical_history?: string | null
          patient_id: string
          physical_examination?: string | null
          record_date?: string
          review_systems?: string | null
          social_history?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          allergies?: string | null
          assessment_plan?: string | null
          chief_complaint?: string | null
          created_at?: string
          doctor_id?: string
          family_history?: string | null
          history_present_illness?: string | null
          id?: string
          medications?: string | null
          notes?: string | null
          past_medical_history?: string | null
          patient_id?: string
          physical_examination?: string | null
          record_date?: string
          review_systems?: string | null
          social_history?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_prescriptions: {
        Row: {
          created_at: string
          id: string
          medical_record_id: string
          memed_prescription_id: string | null
          memed_prescription_url: string | null
          notes: string | null
          prescription_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          medical_record_id: string
          memed_prescription_id?: string | null
          memed_prescription_url?: string | null
          notes?: string | null
          prescription_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          medical_record_id?: string
          memed_prescription_id?: string | null
          memed_prescription_url?: string | null
          notes?: string | null
          prescription_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_prescriptions_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          birth_date: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_items: {
        Row: {
          created_at: string
          dosage: string
          duration: string | null
          frequency: string
          id: string
          instructions: string | null
          medication_name: string
          memed_medication_id: string | null
          prescription_id: string
          quantity: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dosage: string
          duration?: string | null
          frequency: string
          id?: string
          instructions?: string | null
          medication_name: string
          memed_medication_id?: string | null
          prescription_id: string
          quantity?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dosage?: string
          duration?: string | null
          frequency?: string
          id?: string
          instructions?: string | null
          medication_name?: string
          memed_medication_id?: string | null
          prescription_id?: string
          quantity?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "medical_prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
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
      event_type: "sleep" | "feeding" | "diaper" | "mood" | "bathroom"
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
      event_type: ["drink", "meal", "bathroom", "mood", "medication", "drain", "vital_signs"],
    },
  },
} as const
