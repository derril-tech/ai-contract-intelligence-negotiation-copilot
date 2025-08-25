// Created automatically by Cursor AI (2024-12-19)
import { z } from 'zod';

export const agreementSchema = z.object({
  id: z.string(),
  matterId: z.string(),
  type: z.string().optional(),
  subtype: z.string().optional(),
  status: z.string(),
  effectiveDate: z.string().optional(),
  termMonths: z.number().optional(),
  autoRenew: z.boolean().optional(),
  governingLaw: z.string().optional(),
  currency: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const matterSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  name: z.string(),
  counterparty: z.string().optional(),
  region: z.string().optional(),
  valueUsd: z.number().optional(),
  stage: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const clauseMatchSchema = z.object({
  id: z.number(),
  agreementVersionId: z.string(),
  sectionId: z.string(),
  libraryClauseId: z.string().optional(),
  confidence: z.number().optional(),
  coverage: z.number().optional(),
  position: z.string().optional(),
  rationale: z.string().optional(),
  createdAt: z.string(),
});

export const redlineSchema = z.object({
  id: z.string(),
  agreementVersionId: z.string(),
  changeSet: z.any(),
  docxKey: z.string().optional(),
  pdfKey: z.string().optional(),
  summary: z.string().optional(),
  createdAt: z.string(),
});

export const riskReportSchema = z.object({
  id: z.string(),
  agreementVersionId: z.string(),
  totalScore: z.number().optional(),
  breakdown: z.any().optional(),
  exceptions: z.any().optional(),
  createdAt: z.string(),
});

export const approvalSchema = z.object({
  id: z.string(),
  agreementId: z.string(),
  role: z.string(),
  assignees: z.array(z.string()),
  dueAt: z.string().optional(),
  status: z.string(),
  decisionBy: z.string().optional(),
  decisionAt: z.string().optional(),
  comment: z.string().optional(),
  createdAt: z.string(),
});

export const signatureSchema = z.object({
  id: z.string(),
  agreementId: z.string(),
  provider: z.string(),
  envelopeId: z.string().optional(),
  status: z.string(),
  recipients: z.any().optional(),
  sentAt: z.string().optional(),
  completedAt: z.string().optional(),
  files: z.any().optional(),
  createdAt: z.string(),
});

export const obligationSchema = z.object({
  id: z.string(),
  agreementId: z.string(),
  name: z.string(),
  owner: z.string().optional(),
  dueAt: z.string().optional(),
  sourceSectionId: z.string().optional(),
  frequency: z.string().optional(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const libraryClauseSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  name: z.string(),
  category: z.string(),
  text: z.string(),
  jurisdiction: z.string().optional(),
  versions: z.any().optional(),
  embedding: z.any().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const playbookSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  name: z.string(),
  scope: z.any().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const commentSchema = z.object({
  id: z.string(),
  agreementVersionId: z.string(),
  sectionId: z.string().optional(),
  authorId: z.string(),
  body: z.string(),
  anchor: z.number().optional(),
  createdAt: z.string(),
});

export const threadSchema = z.object({
  id: z.string(),
  matterId: z.string(),
  counterpartyEmail: z.string().optional(),
  subject: z.string().optional(),
  stance: z.any().optional(),
  createdAt: z.string(),
});

export const messageSchema = z.object({
  id: z.number(),
  threadId: z.string(),
  sender: z.string(),
  body: z.string(),
  ts: z.string(),
});
