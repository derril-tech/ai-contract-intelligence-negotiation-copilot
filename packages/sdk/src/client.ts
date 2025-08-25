// Created automatically by Cursor AI (2024-12-19)
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { 
  Agreement, 
  Matter, 
  ClauseMatch, 
  Redline, 
  RiskReport, 
  Approval, 
  Signature, 
  Obligation,
  LibraryClause,
  Playbook,
  Comment,
  Thread,
  Message
} from './types';

export class ContractIntelligenceClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:3001/v1', config?: AxiosRequestConfig) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    });

    // Add request interceptor for auth
    this.client.interceptors.request.use((config) => {
      const token = this.getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    // TODO: Implement token retrieval from storage
    return localStorage.getItem('auth_token');
  }

  // Matters API
  async createMatter(matter: Partial<Matter>): Promise<Matter> {
    const response = await this.client.post('/matters', matter);
    return response.data;
  }

  async getMatters(params?: any): Promise<{ data: Matter[]; meta: any }> {
    const response = await this.client.get('/matters', { params });
    return response.data;
  }

  async getMatter(id: string): Promise<Matter> {
    const response = await this.client.get(`/matters/${id}`);
    return response.data;
  }

  async updateMatter(id: string, matter: Partial<Matter>): Promise<Matter> {
    const response = await this.client.put(`/matters/${id}`, matter);
    return response.data;
  }

  async deleteMatter(id: string): Promise<void> {
    await this.client.delete(`/matters/${id}`);
  }

  // Agreements API
  async createAgreement(agreement: Partial<Agreement>): Promise<Agreement> {
    const response = await this.client.post('/agreements', agreement);
    return response.data;
  }

  async getAgreements(params?: any): Promise<{ data: Agreement[]; meta: any }> {
    const response = await this.client.get('/agreements', { params });
    return response.data;
  }

  async getAgreement(id: string): Promise<Agreement> {
    const response = await this.client.get(`/agreements/${id}`);
    return response.data;
  }

  async updateAgreement(id: string, agreement: Partial<Agreement>): Promise<Agreement> {
    const response = await this.client.put(`/agreements/${id}`, agreement);
    return response.data;
  }

  async deleteAgreement(id: string): Promise<void> {
    await this.client.delete(`/agreements/${id}`);
  }

  // Library API
  async createLibraryClause(clause: Partial<LibraryClause>): Promise<LibraryClause> {
    const response = await this.client.post('/library/clauses', clause);
    return response.data;
  }

  async searchLibrary(query: string, limit: number = 10): Promise<LibraryClause[]> {
    const response = await this.client.get('/library/search', { 
      params: { q: query, k: limit } 
    });
    return response.data;
  }

  // Playbooks API
  async createPlaybook(playbook: Partial<Playbook>): Promise<Playbook> {
    const response = await this.client.post('/playbooks', playbook);
    return response.data;
  }

  async getPlaybooks(params?: any): Promise<{ data: Playbook[]; meta: any }> {
    const response = await this.client.get('/playbooks', { params });
    return response.data;
  }

  // Redline API
  async generateRedline(agreementId: string, playbookId: string): Promise<Redline> {
    const response = await this.client.post(`/agreements/${agreementId}/redline`, {
      playbook_id: playbookId
    });
    return response.data;
  }

  async getRedline(agreementId: string, redlineId: string): Promise<Redline> {
    const response = await this.client.get(`/agreements/${agreementId}/redlines/${redlineId}`);
    return response.data;
  }

  // Risk API
  async generateRiskReport(agreementId: string): Promise<RiskReport> {
    const response = await this.client.post(`/agreements/${agreementId}/risk`);
    return response.data;
  }

  async getRiskReport(agreementId: string): Promise<RiskReport> {
    const response = await this.client.get(`/agreements/${agreementId}/risk`);
    return response.data;
  }

  // Comments API
  async createComment(agreementId: string, comment: Partial<Comment>): Promise<Comment> {
    const response = await this.client.post(`/agreements/${agreementId}/comments`, comment);
    return response.data;
  }

  async getComments(agreementId: string): Promise<Comment[]> {
    const response = await this.client.get(`/agreements/${agreementId}/comments`);
    return response.data;
  }

  // Approvals API
  async createApproval(agreementId: string, approval: Partial<Approval>): Promise<Approval> {
    const response = await this.client.post(`/agreements/${agreementId}/approvals`, approval);
    return response.data;
  }

  async getApprovals(agreementId: string): Promise<Approval[]> {
    const response = await this.client.get(`/agreements/${agreementId}/approvals`);
    return response.data;
  }

  async approveApproval(approvalId: string, comment?: string): Promise<Approval> {
    const response = await this.client.post(`/approvals/${approvalId}/decision`, {
      decision: 'approve',
      comment
    });
    return response.data;
  }

  async rejectApproval(approvalId: string, comment?: string): Promise<Approval> {
    const response = await this.client.post(`/approvals/${approvalId}/decision`, {
      decision: 'reject',
      comment
    });
    return response.data;
  }

  // Signature API
  async prepareSignature(agreementId: string, provider: string, recipients: any[]): Promise<Signature> {
    const response = await this.client.post('/signature/prepare', {
      agreement_id: agreementId,
      provider,
      recipients
    });
    return response.data;
  }

  async getSignatureStatus(signatureId: string): Promise<Signature> {
    const response = await this.client.get(`/signature/${signatureId}/status`);
    return response.data;
  }

  // Obligations API
  async extractObligations(agreementId: string): Promise<Obligation[]> {
    const response = await this.client.post(`/agreements/${agreementId}/obligations/extract`);
    return response.data;
  }

  async getObligations(agreementId: string): Promise<Obligation[]> {
    const response = await this.client.get(`/agreements/${agreementId}/obligations`);
    return response.data;
  }

  async updateObligation(obligationId: string, updates: Partial<Obligation>): Promise<Obligation> {
    const response = await this.client.patch(`/obligations/${obligationId}`, updates);
    return response.data;
  }

  // Email API
  async createThread(thread: Partial<Thread>): Promise<Thread> {
    const response = await this.client.post('/threads', thread);
    return response.data;
  }

  async getThreads(matterId: string): Promise<Thread[]> {
    const response = await this.client.get(`/matters/${matterId}/threads`);
    return response.data;
  }

  async addMessage(threadId: string, message: Partial<Message>): Promise<Message> {
    const response = await this.client.post(`/threads/${threadId}/message`, message);
    return response.data;
  }

  // Exports API
  async exportRiskReport(agreementId: string): Promise<{ url: string }> {
    const response = await this.client.post('/exports/risk', {
      agreement_id: agreementId
    });
    return response.data;
  }

  async exportApprovalPack(agreementId: string): Promise<{ url: string }> {
    const response = await this.client.post('/exports/approval-pack', {
      agreement_id: agreementId
    });
    return response.data;
  }
}
