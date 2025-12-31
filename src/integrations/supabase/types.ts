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
      announcement_banner_templates: {
        Row: {
          created_at: string
          created_by: string | null
          html_content: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          priority_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          html_content: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          priority_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          priority_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      announcement_templates: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          priority: string
          target_audience: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          priority?: string
          target_audience?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          priority?: string
          target_audience?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          banner_template_id: string | null
          content: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          priority: string
          published_at: string
          scheduled_at: string | null
          target_audience: string
          title: string
          type: string
        }
        Insert: {
          banner_template_id?: string | null
          content: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: string
          published_at?: string
          scheduled_at?: string | null
          target_audience?: string
          title: string
          type?: string
        }
        Update: {
          banner_template_id?: string | null
          content?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: string
          published_at?: string
          scheduled_at?: string | null
          target_audience?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_banner_template_id_fkey"
            columns: ["banner_template_id"]
            isOneToOne: false
            referencedRelation: "announcement_banner_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      application_stage_history: {
        Row: {
          application_id: string
          created_at: string
          from_stage: string | null
          id: string
          notes: string | null
          to_stage: string
          updated_by: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          from_stage?: string | null
          id?: string
          notes?: string | null
          to_stage: string
          updated_by?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          from_stage?: string | null
          id?: string
          notes?: string | null
          to_stage?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_stage_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_stage_history_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_assignments: {
        Row: {
          asset_id: string
          assigned_by: string | null
          assigned_date: string
          condition_on_assign: string | null
          condition_on_return: string | null
          created_at: string
          employee_id: string
          id: string
          location_id: string | null
          notes: string | null
          returned_date: string | null
        }
        Insert: {
          asset_id: string
          assigned_by?: string | null
          assigned_date?: string
          condition_on_assign?: string | null
          condition_on_return?: string | null
          created_at?: string
          employee_id: string
          id?: string
          location_id?: string | null
          notes?: string | null
          returned_date?: string | null
        }
        Update: {
          asset_id?: string
          assigned_by?: string | null
          assigned_date?: string
          condition_on_assign?: string | null
          condition_on_return?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          location_id?: string | null
          notes?: string | null
          returned_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_assignments_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_assignments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_categories: {
        Row: {
          code: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      asset_maintenance: {
        Row: {
          asset_id: string
          completed_date: string | null
          cost: number | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          notes: string | null
          scheduled_date: string | null
          status: string
          type: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          asset_id: string
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          scheduled_date?: string | null
          status?: string
          type?: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          asset_id?: string
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          scheduled_date?: string | null
          status?: string
          type?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_maintenance_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_maintenance_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_maintenance_requests: {
        Row: {
          actual_cost: number | null
          asset_id: string
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string
          employee_id: string
          estimated_cost: number | null
          id: string
          priority: string
          resolution_notes: string | null
          review_comments: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scheduled_date: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          asset_id: string
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description: string
          employee_id: string
          estimated_cost?: number | null
          id?: string
          priority?: string
          resolution_notes?: string | null
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_date?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          asset_id?: string
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string
          employee_id?: string
          estimated_cost?: number | null
          id?: string
          priority?: string
          resolution_notes?: string | null
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_date?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_maintenance_requests_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_maintenance_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_maintenance_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_transfers: {
        Row: {
          asset_id: string
          created_at: string
          from_location_id: string | null
          id: string
          notes: string | null
          reason: string | null
          status: string
          to_location_id: string
          transfer_date: string
          transferred_by: string | null
          updated_at: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          from_location_id?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          status?: string
          to_location_id: string
          transfer_date?: string
          transferred_by?: string | null
          updated_at?: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          from_location_id?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          status?: string
          to_location_id?: string
          transfer_date?: string
          transferred_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_transfers_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_transfers_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_transfers_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_transfers_transferred_by_fkey"
            columns: ["transferred_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_tag: string
          assigned_date: string | null
          assigned_to: string | null
          brand: string | null
          category_id: string | null
          condition: string | null
          created_at: string
          id: string
          image_url: string | null
          location_id: string | null
          model: string | null
          name: string
          notes: string | null
          purchase_cost: number | null
          purchase_date: string | null
          serial_number: string | null
          specifications: Json | null
          status: string
          updated_at: string
          warranty_expiry: string | null
        }
        Insert: {
          asset_tag: string
          assigned_date?: string | null
          assigned_to?: string | null
          brand?: string | null
          category_id?: string | null
          condition?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          location_id?: string | null
          model?: string | null
          name: string
          notes?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          serial_number?: string | null
          specifications?: Json | null
          status?: string
          updated_at?: string
          warranty_expiry?: string | null
        }
        Update: {
          asset_tag?: string
          assigned_date?: string | null
          assigned_to?: string | null
          brand?: string | null
          category_id?: string | null
          condition?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          location_id?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          serial_number?: string | null
          specifications?: Json | null
          status?: string
          updated_at?: string
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "asset_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          notes: string | null
          status: string
          store_id: string | null
          work_hours: number | null
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date: string
          employee_id: string
          id?: string
          notes?: string | null
          status?: string
          store_id?: string | null
          work_hours?: number | null
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          notes?: string | null
          status?: string
          store_id?: string | null
          work_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_regularization_requests: {
        Row: {
          attendance_id: string | null
          created_at: string
          employee_id: string
          id: string
          original_check_in: string | null
          original_check_out: string | null
          reason: string
          request_date: string
          request_type: string
          requested_check_in: string | null
          requested_check_out: string | null
          review_comments: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attendance_id?: string | null
          created_at?: string
          employee_id: string
          id?: string
          original_check_in?: string | null
          original_check_out?: string | null
          reason: string
          request_date: string
          request_type?: string
          requested_check_in?: string | null
          requested_check_out?: string | null
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attendance_id?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          original_check_in?: string | null
          original_check_out?: string | null
          reason?: string
          request_date?: string
          request_type?: string
          requested_check_in?: string | null
          requested_check_out?: string | null
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_regularization_requests_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "attendance_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_regularization_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_regularization_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          description: string
          id: string
          ip_address: string | null
          metadata: Json | null
          module: string
          performed_by: string | null
          performer_name: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          description: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          module: string
          performed_by?: string | null
          performer_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          module?: string
          performed_by?: string | null
          performer_name?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          code: string
          created_at: string
          description: string | null
          employee_count: number | null
          head_id: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          employee_count?: number | null
          head_id?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          employee_count?: number | null
          head_id?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      designations: {
        Row: {
          code: string
          created_at: string
          department_id: string | null
          id: string
          level: number | null
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          department_id?: string | null
          id?: string
          level?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          department_id?: string | null
          id?: string
          level?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "designations_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          document_category: string | null
          employee_id: string | null
          file_size: number | null
          file_url: string | null
          folder_path: string | null
          id: string
          is_company_document: boolean | null
          name: string
          type: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_category?: string | null
          employee_id?: string | null
          file_size?: number | null
          file_url?: string | null
          folder_path?: string | null
          id?: string
          is_company_document?: boolean | null
          name: string
          type: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_category?: string | null
          employee_id?: string | null
          file_size?: number | null
          file_url?: string | null
          folder_path?: string | null
          id?: string
          is_company_document?: boolean | null
          name?: string
          type?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          placeholders: Json | null
          subject: string
          type: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          placeholders?: Json | null
          subject: string
          type: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          placeholders?: Json | null
          subject?: string
          type?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      employee_store_assignments: {
        Row: {
          created_at: string
          employee_id: string
          end_date: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          start_date: string
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          start_date?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          start_date?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_store_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_store_assignments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_transfers: {
        Row: {
          created_at: string
          effective_date: string
          employee_id: string
          from_store_id: string | null
          id: string
          initiated_by: string | null
          notes: string | null
          reason: string | null
          status: string
          to_store_id: string
          transfer_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_date: string
          employee_id: string
          from_store_id?: string | null
          id?: string
          initiated_by?: string | null
          notes?: string | null
          reason?: string | null
          status?: string
          to_store_id: string
          transfer_date?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_date?: string
          employee_id?: string
          from_store_id?: string | null
          id?: string
          initiated_by?: string | null
          notes?: string | null
          reason?: string | null
          status?: string
          to_store_id?: string
          transfer_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_transfers_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_transfers_from_store_id_fkey"
            columns: ["from_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_transfers_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_transfers_to_store_id_fkey"
            columns: ["to_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address_city: string | null
          address_country: string | null
          address_state: string | null
          address_street: string | null
          address_zip_code: string | null
          avatar_url: string | null
          bank_account_holder_name: string | null
          bank_account_number: string | null
          bank_ifsc_code: string | null
          bank_name: string | null
          created_at: string
          date_of_birth: string | null
          date_of_joining: string
          department_id: string | null
          designation_id: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          employee_id: string
          employment_type: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          primary_store_id: string | null
          reporting_to: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address_city?: string | null
          address_country?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip_code?: string | null
          avatar_url?: string | null
          bank_account_holder_name?: string | null
          bank_account_number?: string | null
          bank_ifsc_code?: string | null
          bank_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          date_of_joining?: string
          department_id?: string | null
          designation_id?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employee_id: string
          employment_type?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          primary_store_id?: string | null
          reporting_to?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address_city?: string | null
          address_country?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip_code?: string | null
          avatar_url?: string | null
          bank_account_holder_name?: string | null
          bank_account_number?: string | null
          bank_ifsc_code?: string | null
          bank_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          date_of_joining?: string
          department_id?: string | null
          designation_id?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employee_id?: string
          employment_type?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          primary_store_id?: string | null
          reporting_to?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_designation_id_fkey"
            columns: ["designation_id"]
            isOneToOne: false
            referencedRelation: "designations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_primary_store_id_fkey"
            columns: ["primary_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_reporting_to_fkey"
            columns: ["reporting_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      exit_interviews: {
        Row: {
          conducted_by: string | null
          created_at: string
          feedback: Json | null
          id: string
          interview_date: string | null
          offboarding_id: string
          overall_rating: number | null
          reason_for_leaving: string | null
          status: string
          suggestions: string | null
          updated_at: string
          would_recommend: boolean | null
          would_rejoin: boolean | null
        }
        Insert: {
          conducted_by?: string | null
          created_at?: string
          feedback?: Json | null
          id?: string
          interview_date?: string | null
          offboarding_id: string
          overall_rating?: number | null
          reason_for_leaving?: string | null
          status?: string
          suggestions?: string | null
          updated_at?: string
          would_recommend?: boolean | null
          would_rejoin?: boolean | null
        }
        Update: {
          conducted_by?: string | null
          created_at?: string
          feedback?: Json | null
          id?: string
          interview_date?: string | null
          offboarding_id?: string
          overall_rating?: number | null
          reason_for_leaving?: string | null
          status?: string
          suggestions?: string | null
          updated_at?: string
          would_recommend?: boolean | null
          would_rejoin?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "exit_interviews_conducted_by_fkey"
            columns: ["conducted_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exit_interviews_offboarding_id_fkey"
            columns: ["offboarding_id"]
            isOneToOne: false
            referencedRelation: "offboarding_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          max_amount: number | null
          name: string
          requires_receipt: boolean | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          name: string
          requires_receipt?: boolean | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          name?: string
          requires_receipt?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      expense_claims: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          description: string | null
          employee_id: string
          expense_date: string
          id: string
          receipt_url: string | null
          reimbursed_at: string | null
          review_comments: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category_id: string
          created_at?: string
          description?: string | null
          employee_id: string
          expense_date?: string
          id?: string
          receipt_url?: string | null
          reimbursed_at?: string | null
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          description?: string | null
          employee_id?: string
          expense_date?: string
          id?: string
          receipt_url?: string | null
          reimbursed_at?: string | null
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_claims_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_claims_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_claims_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_policies: {
        Row: {
          auto_approve_below: number | null
          created_at: string
          id: string
          is_active: boolean | null
          max_monthly_limit: number | null
          name: string
          requires_manager_approval: boolean | null
          updated_at: string
        }
        Insert: {
          auto_approve_below?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_monthly_limit?: number | null
          name: string
          requires_manager_approval?: boolean | null
          updated_at?: string
        }
        Update: {
          auto_approve_below?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_monthly_limit?: number | null
          name?: string
          requires_manager_approval?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      fnf_settlements: {
        Row: {
          advance_deduction: number | null
          bonus_amount: number | null
          created_at: string
          final_amount: number | null
          gratuity_amount: number | null
          id: string
          leave_encashment_amount: number | null
          leave_encashment_days: number | null
          loan_deduction: number | null
          notes: string | null
          notice_period_deduction: number | null
          offboarding_id: string
          other_deductions: number | null
          other_deductions_notes: string | null
          other_earnings: number | null
          other_earnings_notes: string | null
          payment_date: string | null
          payment_reference: string | null
          pending_salary_amount: number | null
          pending_salary_days: number | null
          processed_at: string | null
          processed_by: string | null
          status: string
          total_deductions: number | null
          total_earnings: number | null
          updated_at: string
        }
        Insert: {
          advance_deduction?: number | null
          bonus_amount?: number | null
          created_at?: string
          final_amount?: number | null
          gratuity_amount?: number | null
          id?: string
          leave_encashment_amount?: number | null
          leave_encashment_days?: number | null
          loan_deduction?: number | null
          notes?: string | null
          notice_period_deduction?: number | null
          offboarding_id: string
          other_deductions?: number | null
          other_deductions_notes?: string | null
          other_earnings?: number | null
          other_earnings_notes?: string | null
          payment_date?: string | null
          payment_reference?: string | null
          pending_salary_amount?: number | null
          pending_salary_days?: number | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          total_deductions?: number | null
          total_earnings?: number | null
          updated_at?: string
        }
        Update: {
          advance_deduction?: number | null
          bonus_amount?: number | null
          created_at?: string
          final_amount?: number | null
          gratuity_amount?: number | null
          id?: string
          leave_encashment_amount?: number | null
          leave_encashment_days?: number | null
          loan_deduction?: number | null
          notes?: string | null
          notice_period_deduction?: number | null
          offboarding_id?: string
          other_deductions?: number | null
          other_deductions_notes?: string | null
          other_earnings?: number | null
          other_earnings_notes?: string | null
          payment_date?: string | null
          payment_reference?: string | null
          pending_salary_amount?: number | null
          pending_salary_days?: number | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          total_deductions?: number | null
          total_earnings?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fnf_settlements_offboarding_id_fkey"
            columns: ["offboarding_id"]
            isOneToOne: false
            referencedRelation: "offboarding_processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fnf_settlements_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_letters: {
        Row: {
          content: string
          created_at: string | null
          employee_id: string
          file_url: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          metadata: Json | null
          status: string | null
          template_id: string | null
          type: string
        }
        Insert: {
          content: string
          created_at?: string | null
          employee_id: string
          file_url?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          template_id?: string | null
          type: string
        }
        Update: {
          content?: string
          created_at?: string | null
          employee_id?: string
          file_url?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          template_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_letters_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_letters_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "letter_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      helpdesk_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string | null
          employee_id: string
          id: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string | null
          employee_id: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string | null
          employee_id?: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "helpdesk_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "helpdesk_tickets_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string
          date: string
          description: string | null
          id: string
          is_optional: boolean | null
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          id?: string
          is_optional?: boolean | null
          name: string
          type?: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_optional?: boolean | null
          name?: string
          type?: string
        }
        Relationships: []
      }
      internal_invoice_categories: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      internal_invoice_items: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          description: string
          expense_claim_id: string | null
          id: string
          invoice_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description: string
          expense_claim_id?: string | null
          id?: string
          invoice_id: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string
          expense_claim_id?: string | null
          id?: string
          invoice_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "internal_invoice_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "internal_invoice_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_invoice_items_expense_claim_id_fkey"
            columns: ["expense_claim_id"]
            isOneToOne: false
            referencedRelation: "expense_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "internal_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_invoices: {
        Row: {
          created_at: string
          created_by: string | null
          due_date: string
          from_location_id: string
          id: string
          invoice_date: string
          invoice_number: string
          invoice_type: string
          is_recurring: boolean | null
          next_recurring_date: string | null
          notes: string | null
          paid_at: string | null
          paid_by: string | null
          parent_invoice_id: string | null
          payment_reference: string | null
          recurring_frequency: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          to_location_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          due_date: string
          from_location_id: string
          id?: string
          invoice_date?: string
          invoice_number: string
          invoice_type?: string
          is_recurring?: boolean | null
          next_recurring_date?: string | null
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          parent_invoice_id?: string | null
          payment_reference?: string | null
          recurring_frequency?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          to_location_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          due_date?: string
          from_location_id?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          invoice_type?: string
          is_recurring?: boolean | null
          next_recurring_date?: string | null
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          parent_invoice_id?: string | null
          payment_reference?: string | null
          recurring_frequency?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          to_location_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_invoices_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_invoices_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_invoices_parent_invoice_id_fkey"
            columns: ["parent_invoice_id"]
            isOneToOne: false
            referencedRelation: "internal_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_invoices_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_feedback: {
        Row: {
          comments: string | null
          created_at: string
          criteria: string
          id: string
          interview_id: string
          interviewer_id: string | null
          rating: number
        }
        Insert: {
          comments?: string | null
          created_at?: string
          criteria: string
          id?: string
          interview_id: string
          interviewer_id?: string | null
          rating: number
        }
        Update: {
          comments?: string | null
          created_at?: string
          criteria?: string
          id?: string
          interview_id?: string
          interviewer_id?: string | null
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "interview_feedback_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interview_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_feedback_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_schedules: {
        Row: {
          application_id: string
          created_at: string
          duration_minutes: number | null
          feedback: string | null
          id: string
          interview_round: number
          interview_type: string
          interviewer_id: string | null
          location_or_link: string | null
          rating: number | null
          recommendation: string | null
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          duration_minutes?: number | null
          feedback?: string | null
          id?: string
          interview_round?: number
          interview_type?: string
          interviewer_id?: string | null
          location_or_link?: string | null
          rating?: number | null
          recommendation?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          duration_minutes?: number | null
          feedback?: string | null
          id?: string
          interview_round?: number
          interview_type?: string
          interviewer_id?: string | null
          location_or_link?: string | null
          rating?: number | null
          recommendation?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_schedules_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_schedules_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          applied_at: string
          candidate_email: string
          candidate_name: string
          candidate_phone: string | null
          cover_letter: string | null
          created_at: string
          current_company: string | null
          current_designation: string | null
          current_stage: string
          expected_salary: number | null
          experience_years: number | null
          id: string
          job_opening_id: string
          linkedin_url: string | null
          notes: string | null
          notice_period_days: number | null
          portfolio_url: string | null
          referred_by: string | null
          rejection_reason: string | null
          resume_url: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          applied_at?: string
          candidate_email: string
          candidate_name: string
          candidate_phone?: string | null
          cover_letter?: string | null
          created_at?: string
          current_company?: string | null
          current_designation?: string | null
          current_stage?: string
          expected_salary?: number | null
          experience_years?: number | null
          id?: string
          job_opening_id: string
          linkedin_url?: string | null
          notes?: string | null
          notice_period_days?: number | null
          portfolio_url?: string | null
          referred_by?: string | null
          rejection_reason?: string | null
          resume_url?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          applied_at?: string
          candidate_email?: string
          candidate_name?: string
          candidate_phone?: string | null
          cover_letter?: string | null
          created_at?: string
          current_company?: string | null
          current_designation?: string | null
          current_stage?: string
          expected_salary?: number | null
          experience_years?: number | null
          id?: string
          job_opening_id?: string
          linkedin_url?: string | null
          notes?: string | null
          notice_period_days?: number | null
          portfolio_url?: string | null
          referred_by?: string | null
          rejection_reason?: string | null
          resume_url?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_opening_id_fkey"
            columns: ["job_opening_id"]
            isOneToOne: false
            referencedRelation: "job_openings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      job_openings: {
        Row: {
          closing_date: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          description: string | null
          designation_id: string | null
          employment_type: string
          id: string
          location: string | null
          openings_count: number
          posted_date: string | null
          remote_policy: string | null
          requirements: string | null
          salary_max: number | null
          salary_min: number | null
          show_salary: boolean | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          closing_date?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          designation_id?: string | null
          employment_type?: string
          id?: string
          location?: string | null
          openings_count?: number
          posted_date?: string | null
          remote_policy?: string | null
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          show_salary?: boolean | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          closing_date?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          designation_id?: string | null
          employment_type?: string
          id?: string
          location?: string | null
          openings_count?: number
          posted_date?: string | null
          remote_policy?: string | null
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          show_salary?: boolean | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_openings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_openings_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_openings_designation_id_fkey"
            columns: ["designation_id"]
            isOneToOne: false
            referencedRelation: "designations"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          leave_type_id: string
          pending_days: number
          total_days: number
          updated_at: string
          used_days: number
          year: number
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          leave_type_id: string
          pending_days?: number
          total_days?: number
          updated_at?: string
          used_days?: number
          year?: number
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          leave_type_id?: string
          pending_days?: number
          total_days?: number
          updated_at?: string
          used_days?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balances_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_by: string | null
          approved_on: string | null
          comments: string | null
          created_at: string
          days: number
          employee_id: string
          end_date: string
          id: string
          leave_type_id: string
          reason: string | null
          start_date: string
          status: string
          store_id: string | null
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          approved_on?: string | null
          comments?: string | null
          created_at?: string
          days: number
          employee_id: string
          end_date: string
          id?: string
          leave_type_id: string
          reason?: string | null
          start_date: string
          status?: string
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          approved_on?: string | null
          comments?: string | null
          created_at?: string
          days?: number
          employee_id?: string
          end_date?: string
          id?: string
          leave_type_id?: string
          reason?: string | null
          start_date?: string
          status?: string
          store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          carry_forward: boolean | null
          code: string
          color: string | null
          created_at: string
          encashable: boolean | null
          id: string
          max_days: number
          name: string
        }
        Insert: {
          carry_forward?: boolean | null
          code: string
          color?: string | null
          created_at?: string
          encashable?: boolean | null
          id?: string
          max_days?: number
          name: string
        }
        Update: {
          carry_forward?: boolean | null
          code?: string
          color?: string | null
          created_at?: string
          encashable?: boolean | null
          id?: string
          max_days?: number
          name?: string
        }
        Relationships: []
      }
      letter_templates: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          placeholders: Json | null
          type: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          placeholders?: Json | null
          type: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          placeholders?: Json | null
          type?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      offboarding_processes: {
        Row: {
          created_at: string
          created_by: string | null
          employee_id: string
          exit_reason: string | null
          exit_type: string
          handover_to: string | null
          id: string
          last_working_day: string
          notes: string | null
          notice_period_days: number | null
          resignation_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          employee_id: string
          exit_reason?: string | null
          exit_type?: string
          handover_to?: string | null
          id?: string
          last_working_day: string
          notes?: string | null
          notice_period_days?: number | null
          resignation_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          employee_id?: string
          exit_reason?: string | null
          exit_type?: string
          handover_to?: string | null
          id?: string
          last_working_day?: string
          notes?: string | null
          notice_period_days?: number | null
          resignation_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offboarding_processes_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_processes_handover_to_fkey"
            columns: ["handover_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      offboarding_tasks: {
        Row: {
          assigned_to: string | null
          category: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          department_id: string | null
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          offboarding_id: string
          order_index: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          offboarding_id: string
          order_index?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          offboarding_id?: string
          order_index?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offboarding_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_tasks_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offboarding_tasks_offboarding_id_fkey"
            columns: ["offboarding_id"]
            isOneToOne: false
            referencedRelation: "offboarding_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_processes: {
        Row: {
          completed_date: string | null
          created_at: string
          created_by: string | null
          employee_id: string
          expected_completion_date: string | null
          id: string
          notes: string | null
          start_date: string
          status: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          completed_date?: string | null
          created_at?: string
          created_by?: string | null
          employee_id: string
          expected_completion_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string
          status?: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          completed_date?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: string
          expected_completion_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string
          status?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_processes_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_processes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "onboarding_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_tasks: {
        Row: {
          assigned_to: string | null
          category: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          onboarding_id: string
          order_index: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          onboarding_id: string
          order_index?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          onboarding_id?: string
          order_index?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tasks_onboarding_id_fkey"
            columns: ["onboarding_id"]
            isOneToOne: false
            referencedRelation: "onboarding_processes"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_templates: {
        Row: {
          created_at: string
          created_by: string | null
          department_id: string | null
          description: string | null
          designation_id: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          tasks: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          designation_id?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          tasks?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          description?: string | null
          designation_id?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          tasks?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_templates_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_templates_designation_id_fkey"
            columns: ["designation_id"]
            isOneToOne: false
            referencedRelation: "designations"
            referencedColumns: ["id"]
          },
        ]
      }
      payslip_templates: {
        Row: {
          company_address: string | null
          company_logo_url: string | null
          company_name: string | null
          content: string
          created_at: string | null
          created_by: string | null
          footer_text: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          layout_config: Json | null
          name: string
          updated_at: string | null
        }
        Insert: {
          company_address?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          footer_text?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          layout_config?: Json | null
          name: string
          updated_at?: string | null
        }
        Update: {
          company_address?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          footer_text?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          layout_config?: Json | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payslips: {
        Row: {
          basic_salary: number
          created_at: string
          employee_id: string
          gross_earnings: number
          id: string
          net_pay: number
          pay_date: string
          pay_period: string
          status: string
          total_deductions: number
        }
        Insert: {
          basic_salary?: number
          created_at?: string
          employee_id: string
          gross_earnings?: number
          id?: string
          net_pay?: number
          pay_date: string
          pay_period: string
          status?: string
          total_deductions?: number
        }
        Update: {
          basic_salary?: number
          created_at?: string
          employee_id?: string
          gross_earnings?: number
          id?: string
          net_pay?: number
          pay_date?: string
          pay_period?: string
          status?: string
          total_deductions?: number
        }
        Relationships: [
          {
            foreignKeyName: "payslips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_change_requests: {
        Row: {
          created_at: string
          current_value: string | null
          employee_id: string
          field_name: string
          id: string
          new_value: string
          reason: string | null
          review_comments: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value?: string | null
          employee_id: string
          field_name: string
          id?: string
          new_value: string
          reason?: string | null
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value?: string | null
          employee_id?: string
          field_name?: string
          id?: string
          new_value?: string
          reason?: string | null
          review_comments?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_change_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_change_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      refresh_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refresh_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          permissions: Json
          role_type: string | null
          updated_at: string
          user_count: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          permissions?: Json
          role_type?: string | null
          updated_at?: string
          user_count?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          permissions?: Json
          role_type?: string | null
          updated_at?: string
          user_count?: number | null
        }
        Relationships: []
      }
      salary_structures: {
        Row: {
          basic_salary: number
          created_at: string
          effective_from: string
          employee_id: string
          hra: number | null
          id: string
          medical_allowance: number | null
          other_allowances: number | null
          other_deductions: number | null
          pf_deduction: number | null
          tax_deduction: number | null
          transport_allowance: number | null
          updated_at: string
        }
        Insert: {
          basic_salary?: number
          created_at?: string
          effective_from?: string
          employee_id: string
          hra?: number | null
          id?: string
          medical_allowance?: number | null
          other_allowances?: number | null
          other_deductions?: number | null
          pf_deduction?: number | null
          tax_deduction?: number | null
          transport_allowance?: number | null
          updated_at?: string
        }
        Update: {
          basic_salary?: number
          created_at?: string
          effective_from?: string
          employee_id?: string
          hra?: number | null
          id?: string
          medical_allowance?: number | null
          other_allowances?: number | null
          other_deductions?: number | null
          pf_deduction?: number | null
          tax_deduction?: number | null
          transport_allowance?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_structures_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_assignments: {
        Row: {
          created_at: string
          employee_id: string
          end_date: string | null
          id: string
          is_active: boolean | null
          shift_id: string
          start_date: string
          store_id: string | null
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          shift_id: string
          start_date: string
          store_id?: string | null
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          shift_id?: string
          start_date?: string
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_exchange_requests: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          request_date: string
          requester_id: string
          requester_shift_id: string
          responded_at: string | null
          response_note: string | null
          status: string
          target_employee_id: string
          target_shift_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          request_date: string
          requester_id: string
          requester_shift_id: string
          responded_at?: string | null
          response_note?: string | null
          status?: string
          target_employee_id: string
          target_shift_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          request_date?: string
          requester_id?: string
          requester_shift_id?: string
          responded_at?: string | null
          response_note?: string | null
          status?: string
          target_employee_id?: string
          target_shift_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_exchange_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_exchange_requests_requester_shift_id_fkey"
            columns: ["requester_shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_exchange_requests_target_employee_id_fkey"
            columns: ["target_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_exchange_requests_target_shift_id_fkey"
            columns: ["target_shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_rotations: {
        Row: {
          created_at: string
          description: string | null
          employee_ids: string[] | null
          id: string
          is_active: boolean | null
          name: string
          rotation_frequency: string
          rotation_pattern: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          employee_ids?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
          rotation_frequency?: string
          rotation_pattern?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          employee_ids?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
          rotation_frequency?: string
          rotation_pattern?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      shifts: {
        Row: {
          break_duration: number | null
          code: string
          color: string | null
          created_at: string
          end_time: string
          id: string
          is_active: boolean | null
          name: string
          start_time: string
        }
        Insert: {
          break_duration?: number | null
          code: string
          color?: string | null
          created_at?: string
          end_time: string
          id?: string
          is_active?: boolean | null
          name: string
          start_time: string
        }
        Update: {
          break_duration?: number | null
          code?: string
          color?: string | null
          created_at?: string
          end_time?: string
          id?: string
          is_active?: boolean | null
          name?: string
          start_time?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          address_city: string | null
          address_country: string | null
          address_state: string | null
          address_street: string | null
          address_zip_code: string | null
          closing_time: string | null
          code: string
          created_at: string
          currency: string | null
          date_format: string | null
          email: string | null
          id: string
          is_active: boolean | null
          locale: string | null
          manager_id: string | null
          name: string
          opening_time: string | null
          phone: string | null
          timezone: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          address_city?: string | null
          address_country?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip_code?: string | null
          closing_time?: string | null
          code: string
          created_at?: string
          currency?: string | null
          date_format?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          locale?: string | null
          manager_id?: string | null
          name: string
          opening_time?: string | null
          phone?: string | null
          timezone?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          address_city?: string | null
          address_country?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip_code?: string | null
          closing_time?: string | null
          code?: string
          created_at?: string
          currency?: string | null
          date_format?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          locale?: string | null
          manager_id?: string | null
          name?: string
          opening_time?: string | null
          phone?: string | null
          timezone?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      targeted_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          priority: string
          sent_at: string
          sent_by: string
          target_ids: Json | null
          target_type: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          priority?: string
          sent_at?: string
          sent_by: string
          target_ids?: Json | null
          target_type?: string
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          priority?: string
          sent_at?: string
          sent_by?: string
          target_ids?: Json | null
          target_type?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          is_internal: boolean | null
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_internal?: boolean | null
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_internal?: boolean | null
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "helpdesk_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          role_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          role_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          role_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          email_confirmed_at: string | null
          id: string
          is_active: boolean | null
          last_sign_in_at: string | null
          password_hash: string
          reset_token: string | null
          reset_token_expires: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          email_confirmed_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sign_in_at?: string | null
          password_hash: string
          reset_token?: string | null
          reset_token_expires?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          email_confirmed_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sign_in_at?: string | null
          password_hash?: string
          reset_token?: string | null
          reset_token_expires?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invoice_number: { Args: never; Returns: string }
      get_admin_user_ids: {
        Args: never
        Returns: {
          user_id: string
        }[]
      }
      get_department_employee_user_ids: {
        Args: { department_ids: string[] }
        Returns: {
          user_id: string
        }[]
      }
      get_employee_user_ids: {
        Args: { employee_ids: string[] }
        Returns: {
          user_id: string
        }[]
      }
      get_user_permissions: { Args: { _user_id: string }; Returns: Json }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_role_info: {
        Args: { _user_id: string }
        Returns: {
          permissions: Json
          role_id: string
          role_name: string
        }[]
      }
      has_module_permission: {
        Args: { _action: string; _module: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "hr" | "manager" | "employee" | "store_manager"
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
      app_role: ["admin", "hr", "manager", "employee", "store_manager"],
    },
  },
} as const
