import { AdvancedSOPRule } from './advanced';

/**
 * SOP (Standard Operating Procedure) Management Types
 */

export interface SOP {
  id: string;
  name: string;
  organisation_name: string;
  department: string;
  status: 'draft' | 'active' | 'archived' | 'deleted';
  rules_count: number;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by?: string;
  deleted_at?: string;
  deleted_by?: string;
  previous_status?: 'draft' | 'active' | 'archived'; // For restoration
  rules: AdvancedSOPRule[];
  documents?: SOPDocument[];
}

export interface SOPDocument {
  id: string;
  sop_id: string;
  file_name: string;
  file_type: 'pdf' | 'docx' | 'csv' | 'xlsx';
  file_size: number;
  uploaded_at: string;
  uploaded_by: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'error';
  rules_extracted: number;
  error_message?: string;
}

export interface CreateSOPRequest {
  name: string;
  organisation_name: string;
  department: string;
  created_by: string;
}

export interface RecentActivity {
  id: string;
  type: 'sop_created' | 'document_uploaded' | 'document_processed' | 'rule_created' | 'rule_updated' | 'sop_deleted' | 'sop_restored' | 'sop_permanently_deleted';
  sop_id?: string;
  sop_name?: string;
  document_name?: string;
  rule_id?: string;
  description: string;
  user: string;
  timestamp: string;
  status: 'active' | 'review' | 'pending' | 'completed' | 'error';
}

export interface ProcessingQueueItem {
  id: string;
  sop_id: string;
  sop_name: string;
  document_name: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  progress: number;
  rules_extracted: number;
  estimated_time_remaining: number;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

export interface DashboardStats {
  total_sops: number;
  active_sops: number;
  draft_sops: number;
  deleted_sops: number;
  total_rules: number;
  documents_processing: number;
  recent_activity_count: number;
}
