// Created automatically by Cursor AI (2024-12-19)

export interface Agreement {
  id: string;
  matterId: string;
  type?: string;
  subtype?: string;
  status: string;
  effectiveDate?: string;
  termMonths?: number;
  autoRenew?: boolean;
  governingLaw?: string;
  currency?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Matter {
  id: string;
  orgId: string;
  name: string;
  counterparty?: string;
  region?: string;
  valueUsd?: number;
  stage?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClauseMatch {
  id: number;
  agreementVersionId: string;
  sectionId: string;
  libraryClauseId?: string;
  confidence?: number;
  coverage?: number;
  position?: string;
  rationale?: string;
  createdAt: string;
}

export interface Redline {
  id: string;
  agreementVersionId: string;
  changeSet: any;
  docxKey?: string;
  pdfKey?: string;
  summary?: string;
  createdAt: string;
}

export interface RiskReport {
  id: string;
  agreementVersionId: string;
  totalScore?: number;
  breakdown?: any;
  exceptions?: any;
  createdAt: string;
}

export interface Approval {
  id: string;
  agreementId: string;
  role: string;
  assignees: string[];
  dueAt?: string;
  status: string;
  decisionBy?: string;
  decisionAt?: string;
  comment?: string;
  createdAt: string;
}

export interface Signature {
  id: string;
  agreementId: string;
  provider: string;
  envelopeId?: string;
  status: string;
  recipients?: any;
  sentAt?: string;
  completedAt?: string;
  files?: any;
  createdAt: string;
}

export interface Obligation {
  id: string;
  agreementId: string;
  name: string;
  owner?: string;
  dueAt?: string;
  sourceSectionId?: string;
  frequency?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryClause {
  id: string;
  orgId: string;
  name: string;
  category: string;
  text: string;
  jurisdiction?: string;
  versions?: any;
  embedding?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Playbook {
  id: string;
  orgId: string;
  name: string;
  scope?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  agreementVersionId: string;
  sectionId?: string;
  authorId: string;
  body: string;
  anchor?: number;
  createdAt: string;
}

export interface Thread {
  id: string;
  matterId: string;
  counterpartyEmail?: string;
  subject?: string;
  stance?: any;
  createdAt: string;
}

export interface Message {
  id: number;
  threadId: string;
  sender: string;
  body: string;
  ts: string;
}
