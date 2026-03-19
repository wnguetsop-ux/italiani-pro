// ============================================================
// ITALIANIPRO - TypeScript Types
// ============================================================

export type UserRole = 'super_admin' | 'admin' | 'agent' | 'coach' | 'candidate' | 'sponsor'
export type DossierStatus = 'draft' | 'submitted' | 'incomplete' | 'in_review' | 'pending_payment' | 'in_progress' | 'awaiting_client' | 'ready' | 'suspended' | 'archived' | 'completed'
export type DocumentStatus = 'pending' | 'uploaded' | 'in_review' | 'rejected' | 'approved' | 'expired'
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
export type FlussiCategory = 'agricultural_seasonal' | 'tourism_seasonal' | 'non_seasonal_general' | 'home_care' | 'autonomous_italian_origin' | 'refugees_stateless'

export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  country_code: string
  preferred_lang: 'fr' | 'en' | 'it'
  role: UserRole
  avatar_url?: string
  is_active: boolean
  last_login_at?: string
  created_at: string
}

export interface CandidateProfile {
  id: string
  user_id: string
  user?: User
  birth_date?: string
  birth_place?: string
  nationality: string
  current_city?: string
  current_country: string
  profession?: string
  experience_years: number
  education_level?: string
  languages_spoken: string[]
  skills: string[]
  target_sector?: string
  target_region_italy?: string
  has_italy_contacts: boolean
  previous_italy_stay: boolean
  completeness_score: number
  quality_score: number
  readiness_score: number
  dossier_status: DossierStatus
  is_urgent: boolean
  priority_level: number
  assigned_agent_id?: string
  assigned_agent?: User
  assigned_coach_id?: string
  tags: string[]
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  candidate_id: string
  document_type_id?: string
  document_type?: DocumentType
  name: string
  original_name?: string
  file_url?: string
  file_size_bytes?: number
  mime_type?: string
  status: DocumentStatus
  rejection_reason?: string
  expires_at?: string
  is_expired: boolean
  version: number
  notes?: string
  uploaded_by?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}

export interface DocumentType {
  id: string
  name_fr: string
  name_en: string
  category: string
  description_fr?: string
  description_en?: string
  is_required: boolean
  accepted_formats: string[]
  max_size_mb: number
  validity_months?: number
  display_order: number
}

export interface Package {
  id: string
  name_fr: string
  name_en: string
  description_fr?: string
  description_en?: string
  pack_type: string
  price_xaf: number
  price_eur?: number
  features: string[]
  duration_days?: number
  is_active: boolean
  display_order: number
}

export interface Order {
  id: string
  candidate_id: string
  sponsor_id?: string
  package_id: string
  package?: Package
  base_price_xaf: number
  discount_amount: number
  promo_code?: string
  final_price_xaf: number
  payment_status: PaymentStatus
  started_at?: string
  expires_at?: string
  completed_at?: string
  created_at: string
}

export interface Payment {
  id: string
  order_id: string
  amount_xaf: number
  currency: string
  provider: string
  provider_ref?: string
  status: PaymentStatus
  is_deposit: boolean
  paid_at?: string
  created_at: string
}

export interface FlussiCalendarEvent {
  id: string
  year: number
  click_day_date: string
  category: FlussiCategory
  title_fr: string
  title_en?: string
  description_fr?: string
  max_quota?: number
  status: 'upcoming' | 'active' | 'passed'
  required_docs: string[]
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  data: Record<string, unknown>
  is_read: boolean
  action_url?: string
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender?: User
  content: string
  is_read: boolean
  is_internal: boolean
  attachment_url?: string
  created_at: string
}

export interface Appointment {
  id: string
  candidate_id: string
  agent_id: string
  agent?: User
  title: string
  description?: string
  appointment_type: string
  scheduled_at: string
  duration_minutes: number
  status: AppointmentStatus
  meet_url?: string
  notes?: string
  created_at: string
}

export interface Proof {
  id: string
  candidate_id: string
  title: string
  description?: string
  proof_type: string
  status: 'pending' | 'submitted' | 'validated' | 'rejected'
  hours_spent?: number
  submitted_by?: string
  validated_by?: string
  validated_at?: string
  proof_files?: ProofFile[]
  created_at: string
}

export interface ProofFile {
  id: string
  proof_id: string
  file_name: string
  file_url: string
  file_type: string
  created_at: string
}

// Admin dashboard stats
export interface AdminDashboardStats {
  total_candidates: number
  new_this_week: number
  dossiers_incomplete: number
  dossiers_urgent: number
  pending_payments: number
  todays_appointments: number
  revenue_today_xaf: number
  revenue_week_xaf: number
  revenue_month_xaf: number
  pending_document_reviews: number
  unread_messages: number
  open_tickets: number
  documents_expiring_soon: number
  flussi_days_until_next: number
}

export interface CandidateDashboardData {
  profile: CandidateProfile
  completeness_score: number
  documents_uploaded: number
  documents_required: number
  documents_pending: number
  active_order?: Order
  next_appointment?: Appointment
  unread_messages: number
  recent_proofs: Proof[]
  timeline_events: TimelineEvent[]
  flussi_events: FlussiCalendarEvent[]
}

export interface TimelineEvent {
  id: string
  date: string
  type: 'document' | 'payment' | 'appointment' | 'status_change' | 'note' | 'proof'
  title: string
  description?: string
  status?: string
  is_completed: boolean
}
