/**
 * Backend API Service
 * Handles all communication with the backend API
 * Can work with real backend or simulated LocalStorage backend
 */

import { SOP, SOPDocument, CreateSOPRequest, RecentActivity, ProcessingQueueItem } from '@/types/sop-management';
import { AdvancedSOPRule } from '@/types/advanced';

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const USE_MOCK_BACKEND = import.meta.env.VITE_USE_MOCK_BACKEND !== 'false'; // Default to mock

/**
 * Backend API Service
 */
export class BackendApiService {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (USE_MOCK_BACKEND) {
      return this.mockRequest<T>(endpoint, options);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Mock backend using LocalStorage (for development)
   */
  private static async mockRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body as string) : null;

    // Route to appropriate mock handler
    if (endpoint.startsWith('/sops')) {
      return this.handleSOPMockRequest<T>(endpoint, method, body);
    } else if (endpoint.startsWith('/rules')) {
      return this.handleRuleMockRequest<T>(endpoint, method, body);
    } else if (endpoint.startsWith('/documents')) {
      return this.handleDocumentMockRequest<T>(endpoint, method, body);
    } else if (endpoint.startsWith('/processing-queue')) {
      return this.handleQueueMockRequest<T>(endpoint, method, body);
    } else if (endpoint.startsWith('/activity')) {
      return this.handleActivityMockRequest<T>(endpoint, method, body);
    }

    throw new Error(`Mock endpoint not implemented: ${endpoint}`);
  }

  /**
   * Mock SOP requests
   */
  private static handleSOPMockRequest<T>(endpoint: string, method: string, body: any): T {
    const STORAGE_KEY = 'billblaze_sops';
    const sops: SOP[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    if (method === 'POST' && endpoint === '/sops') {
      // Create SOP
      const newSOP: SOP = {
        id: `sop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...body,
        status: 'draft',
        rules_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        rules: [],
        documents: []
      };
      sops.push(newSOP);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sops));
      return newSOP as T;
    }

    if (method === 'GET' && endpoint === '/sops') {
      // List SOPs
      return sops as T;
    }

    if (method === 'GET' && endpoint.match(/^\/sops\/[^/]+$/)) {
      // Get single SOP
      const id = endpoint.split('/')[2];
      const sop = sops.find(s => s.id === id);
      if (!sop) throw new Error('SOP not found');
      return sop as T;
    }

    if (method === 'PUT' && endpoint.match(/^\/sops\/[^/]+$/)) {
      // Update SOP
      const id = endpoint.split('/')[2];
      const index = sops.findIndex(s => s.id === id);
      if (index === -1) throw new Error('SOP not found');
      
      sops[index] = {
        ...sops[index],
        ...body,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sops));
      return sops[index] as T;
    }

    if (method === 'POST' && endpoint.match(/^\/sops\/[^/]+\/rules$/)) {
      // Add rules to SOP
      const id = endpoint.split('/')[2];
      const index = sops.findIndex(s => s.id === id);
      if (index === -1) throw new Error('SOP not found');
      
      sops[index].rules.push(...body.rules);
      sops[index].rules_count = sops[index].rules.length;
      
      // Auto-transition Draft → Active
      if (sops[index].status === 'draft' && sops[index].rules_count > 0) {
        sops[index].status = 'active';
      }
      
      sops[index].updated_at = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sops));
      return sops[index] as T;
    }

    if (method === 'GET' && endpoint.match(/^\/sops\/[^/]+\/rules$/)) {
      // Get rules for SOP
      const id = endpoint.split('/')[2];
      const sop = sops.find(s => s.id === id);
      if (!sop) throw new Error('SOP not found');
      return sop.rules as T;
    }

    throw new Error(`Mock SOP endpoint not implemented: ${method} ${endpoint}`);
  }

  /**
   * Mock rule requests
   */
  private static handleRuleMockRequest<T>(endpoint: string, method: string, body: any): T {
    const STORAGE_KEY = 'billblaze_sops';
    const sops: SOP[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    if (method === 'PUT' && endpoint.match(/^\/rules\/[^/]+$/)) {
      // Update rule
      const ruleId = endpoint.split('/')[2];
      
      for (const sop of sops) {
        const ruleIndex = sop.rules.findIndex(r => r.rule_id === ruleId);
        if (ruleIndex !== -1) {
          sop.rules[ruleIndex] = { ...sop.rules[ruleIndex], ...body };
          sop.updated_at = new Date().toISOString();
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sops));
          return sop.rules[ruleIndex] as T;
        }
      }
      
      throw new Error('Rule not found');
    }

    throw new Error(`Mock rule endpoint not implemented: ${method} ${endpoint}`);
  }

  /**
   * Mock document requests
   */
  private static handleDocumentMockRequest<T>(endpoint: string, method: string, body: any): T {
    const STORAGE_KEY = 'billblaze_sops';
    const sops: SOP[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    if (method === 'PUT' && endpoint.match(/^\/documents\/[^/]+\/status$/)) {
      // Update document status
      const docId = endpoint.split('/')[2];
      
      for (const sop of sops) {
        if (!sop.documents) continue;
        const docIndex = sop.documents.findIndex(d => d.id === docId);
        if (docIndex !== -1) {
          sop.documents[docIndex] = { ...sop.documents[docIndex], ...body };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sops));
          return sop.documents[docIndex] as T;
        }
      }
      
      throw new Error('Document not found');
    }

    throw new Error(`Mock document endpoint not implemented: ${method} ${endpoint}`);
  }

  /**
   * Mock queue requests
   */
  private static handleQueueMockRequest<T>(endpoint: string, method: string, body: any): T {
    const STORAGE_KEY = 'billblaze_processing_queue';
    const queue: ProcessingQueueItem[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    if (method === 'GET' && endpoint === '/processing-queue') {
      return queue as T;
    }

    if (method === 'POST' && endpoint === '/processing-queue') {
      queue.push(body);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
      return body as T;
    }

    if (method === 'PUT' && endpoint.match(/^\/processing-queue\/[^/]+$/)) {
      const id = endpoint.split('/')[2];
      const index = queue.findIndex(q => q.id === id);
      if (index !== -1) {
        queue[index] = { ...queue[index], ...body };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
        return queue[index] as T;
      }
      throw new Error('Queue item not found');
    }

    throw new Error(`Mock queue endpoint not implemented: ${method} ${endpoint}`);
  }

  /**
   * Mock activity requests
   */
  private static handleActivityMockRequest<T>(endpoint: string, method: string, body: any): T {
    const STORAGE_KEY = 'billblaze_recent_activity';
    const activities: RecentActivity[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

    if (method === 'GET' && endpoint === '/activity/recent') {
      return activities.slice(0, 5) as T;
    }

    if (method === 'POST' && endpoint === '/activity') {
      activities.unshift(body);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activities.slice(0, 100)));
      return body as T;
    }

    throw new Error(`Mock activity endpoint not implemented: ${method} ${endpoint}`);
  }

  // ==================== PUBLIC API METHODS ====================

  /**
   * Create SOP
   */
  static async createSOP(request: CreateSOPRequest): Promise<SOP> {
    return this.request<SOP>('/sops', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get all SOPs
   */
  static async getAllSOPs(): Promise<SOP[]> {
    return this.request<SOP[]>('/sops');
  }

  /**
   * Get SOP by ID
   */
  static async getSOPById(id: string): Promise<SOP> {
    return this.request<SOP>(`/sops/${id}`);
  }

  /**
   * Update SOP
   */
  static async updateSOP(id: string, updates: Partial<SOP>): Promise<SOP> {
    return this.request<SOP>(`/sops/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Add rules to SOP
   */
  static async addRulesToSOP(sopId: string, rules: AdvancedSOPRule[]): Promise<SOP> {
    return this.request<SOP>(`/sops/${sopId}/rules`, {
      method: 'POST',
      body: JSON.stringify({ rules }),
    });
  }

  /**
   * Get rules for SOP
   */
  static async getRulesForSOP(sopId: string): Promise<AdvancedSOPRule[]> {
    return this.request<AdvancedSOPRule[]>(`/sops/${sopId}/rules`);
  }

  /**
   * Update rule
   */
  static async updateRule(ruleId: string, updates: Partial<AdvancedSOPRule>): Promise<AdvancedSOPRule> {
    return this.request<AdvancedSOPRule>(`/rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Update document status
   */
  static async updateDocumentStatus(
    documentId: string,
    status: SOPDocument['processing_status'],
    rulesExtracted?: number,
    errorMessage?: string
  ): Promise<SOPDocument> {
    return this.request<SOPDocument>(`/documents/${documentId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ processing_status: status, rules_extracted: rulesExtracted, error_message: errorMessage }),
    });
  }

  /**
   * Get processing queue
   */
  static async getProcessingQueue(): Promise<ProcessingQueueItem[]> {
    return this.request<ProcessingQueueItem[]>('/processing-queue');
  }

  /**
   * Add to processing queue
   */
  static async addToQueue(item: ProcessingQueueItem): Promise<ProcessingQueueItem> {
    return this.request<ProcessingQueueItem>('/processing-queue', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  /**
   * Update queue item
   */
  static async updateQueueItem(id: string, updates: Partial<ProcessingQueueItem>): Promise<ProcessingQueueItem> {
    return this.request<ProcessingQueueItem>(`/processing-queue/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Get recent activity
   */
  static async getRecentActivity(limit: number = 5): Promise<RecentActivity[]> {
    return this.request<RecentActivity[]>(`/activity/recent?limit=${limit}`);
  }

  /**
   * Add activity
   */
  static async addActivity(activity: RecentActivity): Promise<RecentActivity> {
    return this.request<RecentActivity>('/activity', {
      method: 'POST',
      body: JSON.stringify(activity),
    });
  }
}
