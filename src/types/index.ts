export interface User {
  id: string
  email: string
  name: string
  plan: 'free' | 'pro'
  logoStorageId?: string
  subscriptionStatus: 'active' | 'past_due' | 'cancelled' | 'none'
  planExpiresAt?: number
}

export interface Template {
  id: string
  name: string
  description: string
  category: 'contract' | 'nda' | 'proposal' | 'invoice' | 'other'
  isSystemTemplate: boolean
  ownerId?: string
  pdfStorageId: string
  fields: Field[]
  variables: Variable[]
}

export interface Field {
  id: string
  type: 'signature' | 'date' | 'text' | 'initials' | 'checkbox'
  label: string
  x: number
  y: number
  width: number
  height: number
  page: number
  assignedTo: 'sender' | 'recipient' | 'recipient_2' | 'recipient_3'
  required: boolean
}

export interface Variable {
  name: string
  label: string
  type: 'text' | 'date' | 'textarea'
  defaultValue?: string
  required: boolean
}

export interface Document {
  id: string
  ownerId: string
  templateId?: string
  title: string
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'expired' | 'voided'
  originalPdfStorageId: string
  signedPdfStorageId?: string
  variableValues: Record<string, string>
  fields: Field[]
  createdAt: number
  sentAt?: number
  completedAt?: number
  expiresAt?: number
  voidedReason?: string
}

export interface Recipient {
  id: string
  documentId: string
  email: string
  name: string
  role: 'signer' | 'cc'
  order: number
  status: 'pending' | 'viewed' | 'signed'
  signedAt?: number
  accessToken: string
}

export interface AuditEntry {
  id: string
  documentId: string
  event: 'created' | 'sent' | 'viewed' | 'signed' | 'voided' | 'downloaded'
  actorEmail: string
  ipAddress: string
  userAgent: string
  timestamp: number
}
