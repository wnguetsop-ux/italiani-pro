-- ============================================================
-- ITALIANIPRO - Complete Database Schema
-- Compatible with: PostgreSQL 15+ / Supabase
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'super_admin', 'admin', 'agent', 'coach', 'candidate', 'sponsor'
);

CREATE TYPE dossier_status AS ENUM (
  'draft',          -- Brouillon, non soumis
  'submitted',      -- Soumis par le candidat
  'incomplete',     -- Pièces manquantes
  'in_review',      -- En cours de vérification
  'pending_payment',-- En attente de paiement
  'in_progress',    -- En cours d'accompagnement
  'awaiting_client',-- En attente action client
  'ready',          -- Dossier prêt
  'suspended',      -- Suspendu (non-paiement etc.)
  'archived',       -- Archivé
  'completed'       -- Terminé
);

CREATE TYPE document_status AS ENUM (
  'pending',        -- En attente upload
  'uploaded',       -- Uploadé
  'in_review',      -- En vérification
  'rejected',       -- Rejeté (corrections requises)
  'approved',       -- Validé
  'expired'         -- Expiré
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'processing',
  'paid',
  'failed',
  'refunded',
  'partially_refunded'
);

CREATE TYPE application_status AS ENUM (
  'draft',
  'prepared',
  'submitted',
  'under_review',
  'awaiting_documents',
  'completed',
  'rejected',
  'withdrawn'
);

CREATE TYPE proof_status AS ENUM (
  'pending',
  'submitted',
  'validated',
  'rejected'
);

CREATE TYPE appointment_status AS ENUM (
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TYPE ticket_status AS ENUM (
  'open',
  'in_progress',
  'waiting_response',
  'resolved',
  'closed'
);

CREATE TYPE pack_type AS ENUM (
  'cv_optimization',
  'complete_file',
  'application_support',
  'premium_coaching',
  'interview_prep',
  'urgent_priority',
  'custom'
);

CREATE TYPE notification_type AS ENUM (
  'document_required',
  'document_approved',
  'document_rejected',
  'payment_due',
  'payment_received',
  'appointment_reminder',
  'status_change',
  'message_received',
  'flussi_alert',
  'dossier_ready',
  'correction_required',
  'promo',
  'system'
);

CREATE TYPE flussi_category AS ENUM (
  'agricultural_seasonal',
  'tourism_seasonal',
  'non_seasonal_general',
  'home_care',
  'autonomous_italian_origin',
  'refugees_stateless'
);

CREATE TYPE language_code AS ENUM ('fr', 'en', 'it');

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Users (extends Supabase auth.users)
CREATE TABLE users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL UNIQUE,
  full_name       TEXT NOT NULL,
  phone           TEXT,
  country_code    TEXT DEFAULT 'CM',
  preferred_lang  language_code DEFAULT 'fr',
  role            user_role DEFAULT 'candidate',
  avatar_url      TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Candidate profiles (extended info for candidates)
CREATE TABLE candidate_profiles (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Personal info
  birth_date            DATE,
  birth_place           TEXT,
  nationality           TEXT DEFAULT 'Camerounaise',
  current_city          TEXT,
  current_country       TEXT DEFAULT 'CM',
  
  -- Professional info
  profession            TEXT,
  experience_years      INT DEFAULT 0,
  education_level       TEXT, -- 'bac','licence','master','doctorat','none'
  languages_spoken      TEXT[] DEFAULT '{}',
  skills                TEXT[] DEFAULT '{}',
  
  -- Italy info
  target_sector         TEXT, -- 'agriculture','tourism','construction','care','other'
  target_region_italy   TEXT,
  has_italy_contacts    BOOLEAN DEFAULT FALSE,
  previous_italy_stay   BOOLEAN DEFAULT FALSE,
  
  -- Scores (calculated)
  completeness_score    INT DEFAULT 0, -- 0-100
  quality_score         INT DEFAULT 0, -- 0-100
  readiness_score       INT DEFAULT 0, -- 0-100
  
  -- Status & priority
  dossier_status        dossier_status DEFAULT 'draft',
  is_urgent             BOOLEAN DEFAULT FALSE,
  priority_level        INT DEFAULT 3, -- 1=highest, 5=lowest
  
  -- Assignment
  assigned_agent_id     UUID REFERENCES users(id),
  assigned_coach_id     UUID REFERENCES users(id),
  
  -- Internal
  internal_notes_count  INT DEFAULT 0,
  tags                  TEXT[] DEFAULT '{}',
  
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Sponsors (someone paying for a candidate)
CREATE TABLE sponsors (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  relation        TEXT, -- 'parent','sibling','friend','employer','other'
  country         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Sponsor-Candidate link
CREATE TABLE sponsor_candidates (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sponsor_id   UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  is_primary   BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sponsor_id, candidate_id)
);

-- ============================================================
-- DOCUMENTS
-- ============================================================

CREATE TABLE document_types (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_fr         TEXT NOT NULL,
  name_en         TEXT NOT NULL,
  name_it         TEXT,
  category        TEXT NOT NULL, -- 'identity','professional','education','financial','other'
  description_fr  TEXT,
  description_en  TEXT,
  is_required     BOOLEAN DEFAULT TRUE,
  accepted_formats TEXT[] DEFAULT '{pdf,jpg,jpeg,png}',
  max_size_mb     INT DEFAULT 10,
  validity_months INT, -- null = no expiry
  display_order   INT DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE documents (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id     UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  document_type_id UUID REFERENCES document_types(id),
  
  -- File info
  name             TEXT NOT NULL,
  original_name    TEXT,
  file_url         TEXT,
  file_path        TEXT, -- Supabase storage path
  file_size_bytes  BIGINT,
  mime_type        TEXT,
  
  -- Status
  status           document_status DEFAULT 'pending',
  rejection_reason TEXT,
  expires_at       DATE,
  is_expired       BOOLEAN GENERATED ALWAYS AS (expires_at IS NOT NULL AND expires_at < CURRENT_DATE) STORED,
  
  -- Versioning
  version          INT DEFAULT 1,
  previous_version_id UUID REFERENCES documents(id),
  
  -- Metadata
  uploaded_by      UUID REFERENCES users(id),
  reviewed_by      UUID REFERENCES users(id),
  reviewed_at      TIMESTAMPTZ,
  notes            TEXT,
  
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE document_requests (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id     UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  document_type_id UUID REFERENCES document_types(id),
  requested_by     UUID REFERENCES users(id),
  custom_message   TEXT,
  due_date         DATE,
  is_urgent        BOOLEAN DEFAULT FALSE,
  fulfilled_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CV & LETTERS
-- ============================================================

CREATE TABLE cv_versions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id     UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  version_number   INT NOT NULL DEFAULT 1,
  label            TEXT, -- 'Version initiale', 'V2 après coaching'
  file_url         TEXT,
  file_path        TEXT,
  is_current       BOOLEAN DEFAULT FALSE,
  language         language_code DEFAULT 'fr',
  notes            TEXT,
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cover_letters (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id     UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  content          TEXT,
  file_url         TEXT,
  language         language_code DEFAULT 'fr',
  target_sector    TEXT,
  template_id      UUID,
  is_final         BOOLEAN DEFAULT FALSE,
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE letter_templates (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_fr         TEXT NOT NULL,
  title_en         TEXT,
  category         TEXT, -- 'motivation','presentation','recommendation'
  language         language_code DEFAULT 'fr',
  content          TEXT NOT NULL,
  variables        TEXT[] DEFAULT '{}', -- e.g. {candidate_name}, {sector}
  is_active        BOOLEAN DEFAULT TRUE,
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- APPLICATIONS (Candidatures)
-- ============================================================

CREATE TABLE applications (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id     UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  status           application_status DEFAULT 'draft',
  flussi_year      INT,
  flussi_category  flussi_category,
  target_date      DATE, -- click day target date
  submitted_at     TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE application_targets (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id   UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  employer_name    TEXT,
  employer_region  TEXT,
  sector           TEXT,
  position         TEXT,
  contact_info     TEXT,
  status           TEXT DEFAULT 'identified', -- 'identified','contacted','interested','confirmed'
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROOFS OF WORK (Preuves de travail)
-- ============================================================

CREATE TABLE proofs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id     UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  proof_type       TEXT NOT NULL, -- 'cv_update','letter_draft','document_review','coaching_session','research','other'
  status           proof_status DEFAULT 'pending',
  hours_spent      DECIMAL(4,2),
  submitted_by     UUID REFERENCES users(id),
  validated_by     UUID REFERENCES users(id),
  validated_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE proof_files (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proof_id         UUID NOT NULL REFERENCES proofs(id) ON DELETE CASCADE,
  file_name        TEXT NOT NULL,
  file_url         TEXT NOT NULL,
  file_path        TEXT,
  file_type        TEXT, -- 'screenshot','pdf','video','audio','document'
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PACKAGES & PAYMENTS
-- ============================================================

CREATE TABLE packages (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_fr          TEXT NOT NULL,
  name_en          TEXT NOT NULL,
  description_fr   TEXT,
  description_en   TEXT,
  pack_type        pack_type NOT NULL,
  price_xaf        BIGINT NOT NULL, -- Price in CFA francs
  price_eur        DECIMAL(10,2),
  features         JSONB DEFAULT '[]', -- list of included features
  duration_days    INT,               -- service duration
  is_active        BOOLEAN DEFAULT TRUE,
  display_order    INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id     UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  sponsor_id       UUID REFERENCES sponsors(id),
  package_id       UUID NOT NULL REFERENCES packages(id),
  
  -- Pricing
  base_price_xaf   BIGINT NOT NULL,
  discount_amount  BIGINT DEFAULT 0,
  promo_code       TEXT,
  final_price_xaf  BIGINT NOT NULL,
  
  -- Status
  payment_status   payment_status DEFAULT 'pending',
  
  -- Dates
  started_at       TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  
  -- Meta
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id         UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Amount
  amount_xaf       BIGINT NOT NULL,
  amount_eur       DECIMAL(10,2),
  currency         TEXT DEFAULT 'XAF',
  
  -- Provider
  provider         TEXT NOT NULL, -- 'cinetpay','stripe','manual','cash'
  provider_ref     TEXT,          -- external transaction ID
  provider_data    JSONB,         -- raw webhook data
  
  -- Status
  status           payment_status DEFAULT 'pending',
  is_deposit       BOOLEAN DEFAULT FALSE,
  milestone_id     UUID,
  
  -- Dates
  paid_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE milestones (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id         UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  title_fr         TEXT NOT NULL,
  title_en         TEXT,
  description      TEXT,
  amount_xaf       BIGINT NOT NULL,
  due_date         DATE,
  payment_status   payment_status DEFAULT 'pending',
  is_unlocked      BOOLEAN DEFAULT FALSE, -- unlocked when admin validates proof
  unlocked_at      TIMESTAMPTZ,
  paid_at          TIMESTAMPTZ,
  display_order    INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoices (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id       UUID NOT NULL REFERENCES payments(id),
  order_id         UUID NOT NULL REFERENCES orders(id),
  invoice_number   TEXT UNIQUE NOT NULL,
  issued_to_name   TEXT NOT NULL,
  issued_to_email  TEXT,
  amount_xaf       BIGINT NOT NULL,
  vat_amount       BIGINT DEFAULT 0,
  file_url         TEXT,
  issued_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE promo_codes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code             TEXT UNIQUE NOT NULL,
  discount_type    TEXT DEFAULT 'percent', -- 'percent','fixed_xaf'
  discount_value   INT NOT NULL,
  max_uses         INT,
  used_count       INT DEFAULT 0,
  valid_from       TIMESTAMPTZ DEFAULT NOW(),
  valid_until      TIMESTAMPTZ,
  is_active        BOOLEAN DEFAULT TRUE,
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE referrals (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id      UUID NOT NULL REFERENCES users(id),
  referred_id      UUID NOT NULL REFERENCES users(id),
  referral_code    TEXT NOT NULL,
  reward_amount    BIGINT DEFAULT 0,
  reward_paid      BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MESSAGING
-- ============================================================

CREATE TABLE conversations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id     UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  subject          TEXT,
  is_archived      BOOLEAN DEFAULT FALSE,
  last_message_at  TIMESTAMPTZ,
  unread_count     INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id        UUID NOT NULL REFERENCES users(id),
  content          TEXT NOT NULL,
  is_read          BOOLEAN DEFAULT FALSE,
  is_internal      BOOLEAN DEFAULT FALSE, -- admin-only notes
  attachment_url   TEXT,
  attachment_type  TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- APPOINTMENTS
-- ============================================================

CREATE TABLE appointments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id     UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  agent_id         UUID NOT NULL REFERENCES users(id),
  
  title            TEXT NOT NULL,
  description      TEXT,
  appointment_type TEXT NOT NULL, -- 'coaching','review','interview_prep','kickoff','followup'
  
  scheduled_at     TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 60,
  timezone         TEXT DEFAULT 'Africa/Douala',
  
  status           appointment_status DEFAULT 'scheduled',
  meet_url         TEXT, -- Google Meet / Zoom
  recording_url    TEXT,
  notes            TEXT,
  
  reminder_sent    BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type             notification_type NOT NULL,
  title            TEXT NOT NULL,
  message          TEXT NOT NULL,
  data             JSONB DEFAULT '{}',
  is_read          BOOLEAN DEFAULT FALSE,
  action_url       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LEGAL & COMPLIANCE
-- ============================================================

CREATE TABLE legal_consents (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type     TEXT NOT NULL, -- 'rgpd','cgu','disclaimer_no_guarantee','electronic_signature'
  version          TEXT DEFAULT '1.0',
  ip_address       TEXT,
  user_agent       TEXT,
  consented_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUPPORT
-- ============================================================

CREATE TABLE support_tickets (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject          TEXT NOT NULL,
  description      TEXT NOT NULL,
  category         TEXT DEFAULT 'general', -- 'payment','document','technical','other'
  status           ticket_status DEFAULT 'open',
  priority         INT DEFAULT 3, -- 1=urgent, 5=low
  assigned_to      UUID REFERENCES users(id),
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ticket_replies (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id        UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id),
  content          TEXT NOT NULL,
  is_internal      BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INTERNAL TOOLS
-- ============================================================

CREATE TABLE internal_notes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id     UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  author_id        UUID NOT NULL REFERENCES users(id),
  content          TEXT NOT NULL,
  is_pinned        BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activity_logs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id         UUID REFERENCES users(id),
  target_user_id   UUID REFERENCES users(id),
  action           TEXT NOT NULL, -- 'document.uploaded', 'payment.received', etc.
  entity_type      TEXT,          -- 'document','payment','dossier', etc.
  entity_id        UUID,
  metadata         JSONB DEFAULT '{}',
  ip_address       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE admin_tasks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assigned_to      UUID REFERENCES users(id),
  candidate_id     UUID REFERENCES candidate_profiles(id),
  title            TEXT NOT NULL,
  description      TEXT,
  due_date         DATE,
  is_completed     BOOLEAN DEFAULT FALSE,
  priority         INT DEFAULT 3,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tags (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL UNIQUE,
  color            TEXT DEFAULT '#4a7ec3',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- KNOWLEDGE BASE
-- ============================================================

CREATE TABLE knowledge_articles (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_fr         TEXT NOT NULL,
  title_en         TEXT,
  title_it         TEXT,
  slug             TEXT UNIQUE NOT NULL,
  content_fr       TEXT,
  content_en       TEXT,
  category         TEXT, -- 'flussi','documents','process','tips','legal'
  is_published     BOOLEAN DEFAULT FALSE,
  view_count       INT DEFAULT 0,
  created_by       UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FLUSSI CALENDAR
-- ============================================================

CREATE TABLE flussi_calendar_events (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year             INT NOT NULL,
  click_day_date   DATE NOT NULL,
  category         flussi_category NOT NULL,
  title_fr         TEXT NOT NULL,
  title_en         TEXT,
  description_fr   TEXT,
  max_quota        INT,
  status           TEXT DEFAULT 'upcoming', -- 'upcoming','active','passed'
  required_docs    JSONB DEFAULT '[]',      -- list of required documents
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Flussi 2027 data
INSERT INTO flussi_calendar_events (year, click_day_date, category, title_fr, title_en, description_fr, status) VALUES
(2027, '2027-01-12', 'agricultural_seasonal',       'Travailleurs saisonniers agricoles',    'Agricultural Seasonal Workers',    'Quota pour les travailleurs saisonniers dans le secteur agricole.', 'upcoming'),
(2027, '2027-02-09', 'tourism_seasonal',             'Travailleurs saisonniers tourisme',     'Tourism Seasonal Workers',         'Quota pour les travailleurs saisonniers dans le tourisme et hôtellerie.', 'upcoming'),
(2027, '2027-02-16', 'non_seasonal_general',         'Travailleurs non saisonniers généraux', 'Non-Seasonal General Workers',     'Quota pour les travailleurs non saisonniers, multisecteurs.', 'upcoming'),
(2027, '2027-02-18', 'home_care',                    'Assistance familiale / domicile',       'Home Care Workers',                'Quota pour les travailleurs dans l''aide à domicile et assistance familiale.', 'upcoming'),
(2028, '2028-01-12', 'agricultural_seasonal',        'Travailleurs saisonniers agricoles',    'Agricultural Seasonal Workers',    'Quota pour les travailleurs saisonniers dans le secteur agricole.', 'upcoming'),
(2028, '2028-02-09', 'tourism_seasonal',             'Travailleurs saisonniers tourisme',     'Tourism Seasonal Workers',         'Quota pour les travailleurs saisonniers dans le tourisme.', 'upcoming'),
(2028, '2028-02-16', 'non_seasonal_general',         'Travailleurs non saisonniers généraux', 'Non-Seasonal General Workers',     'Quota pour les travailleurs non saisonniers, multisecteurs.', 'upcoming'),
(2028, '2028-02-18', 'home_care',                    'Assistance familiale / domicile',       'Home Care Workers',                'Quota pour les travailleurs dans l''aide à domicile.', 'upcoming');

-- Insert default document types
INSERT INTO document_types (name_fr, name_en, category, description_fr, is_required, validity_months, display_order) VALUES
('Passeport valide',                  'Valid Passport',           'identity',      'Passeport en cours de validité (minimum 6 mois)',          TRUE, 60, 1),
('Acte de naissance',                 'Birth Certificate',        'identity',      'Acte de naissance officiel',                               TRUE, NULL, 2),
('Casier judiciaire',                 'Criminal Record',          'identity',      'Extrait de casier judiciaire récent (moins de 3 mois)',     TRUE, 3,  3),
('CV actualisé',                      'Updated CV',               'professional',  'Curriculum vitae en français et/ou en anglais',            TRUE, NULL, 4),
('Diplômes et certificats',           'Diplomas & Certificates',  'education',     'Copies des diplômes et attestations de formation',         TRUE, NULL, 5),
('Lettres de recommandation',         'Recommendation Letters',   'professional',  'Lettres d''anciens employeurs',                            FALSE, NULL, 6),
('Justificatif de domicile',          'Proof of Address',         'identity',      'Facture récente ou contrat de bail',                       TRUE, 3,  7),
('Photo d''identité récente',         'Recent ID Photo',          'identity',      'Photo biométrique récente (moins de 6 mois)',              TRUE, 6,  8),
('Contrat de travail proposé',        'Employment Contract',      'professional',  'Offre ou contrat de l''employeur en Italie',               FALSE, NULL, 9),
('Relevés bancaires',                 'Bank Statements',          'financial',     'Derniers relevés de compte bancaire (3 mois)',             FALSE, 3,  10),
('Attestation de formation linguistique', 'Language Training Certificate', 'education', 'Attestation niveau de langue (français/anglais/italien)', FALSE, NULL, 11),
('Lettre de motivation',              'Cover Letter',             'professional',  'Lettre de motivation personnalisée',                       TRUE, NULL, 12);

-- Insert default packages
INSERT INTO packages (name_fr, name_en, description_fr, pack_type, price_xaf, price_eur, features, duration_days, display_order) VALUES
('Pack CV + Optimisation',        'CV + Optimization Pack',    'Analyse et optimisation complète de votre CV pour le marché italien',       'cv_optimization',      45000,  70,  '["Analyse CV","Corrections professionnelles","Version française & anglaise","Lettre type incluse"]', 14,  1),
('Pack Dossier Complet',          'Complete File Pack',        'Préparation et vérification complète de tous vos documents',                'complete_file',       120000, 185, '["Checklist personnalisée","Vérification documents","Scan qualité","Conseil expiration","Export PDF"]', 30,  2),
('Pack Candidature Accompagnée',  'Application Support Pack',  'Accompagnement personnalisé dans votre démarche de candidature',            'application_support', 195000, 300, '["Tout le Pack Dossier","CV optimisé","3 lettres de motivation","Suivi candidature","Messages illimités"]', 60,  3),
('Pack Premium Coaching',         'Premium Coaching Pack',     'L''expérience d''accompagnement la plus complète disponible',               'premium_coaching',    350000, 540, '["Tout l''accompagnement","4 séances coaching vidéo","Simulation entretien","Priorité dossier","Suivi 90 jours"]', 90,  4),
('Pack Préparation Entretien',    'Interview Preparation Pack','Préparez-vous aux entretiens avec employeurs italiens',                     'interview_prep',       65000,  100, '["2 sessions simulation","Questions types","Feedback détaillé","Fiche mémo"]', 21,  5),
('Pack Urgence / Prioritaire',    'Urgent Priority Pack',      'Traitement express de votre dossier en 72h',                               'urgent_priority',      85000,  130, '["Traitement 72h","Agent dédié","Support direct","Rapport express"]', 7,   6);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_candidate_profiles_user       ON candidate_profiles(user_id);
CREATE INDEX idx_candidate_profiles_agent      ON candidate_profiles(assigned_agent_id);
CREATE INDEX idx_candidate_profiles_status     ON candidate_profiles(dossier_status);
CREATE INDEX idx_candidate_profiles_urgent     ON candidate_profiles(is_urgent) WHERE is_urgent = TRUE;
CREATE INDEX idx_documents_candidate           ON documents(candidate_id);
CREATE INDEX idx_documents_status              ON documents(status);
CREATE INDEX idx_documents_expired             ON documents(is_expired) WHERE is_expired = TRUE;
CREATE INDEX idx_payments_order                ON payments(order_id);
CREATE INDEX idx_payments_status               ON payments(status);
CREATE INDEX idx_notifications_user_unread     ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_activity_logs_actor           ON activity_logs(actor_id);
CREATE INDEX idx_activity_logs_entity          ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_messages_conversation         ON messages(conversation_id);
CREATE INDEX idx_flussi_events_year            ON flussi_calendar_events(year, click_day_date);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_notes ENABLE ROW LEVEL SECURITY;

-- Users: can read own profile
CREATE POLICY "users_read_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

-- Candidate profiles: own profile + assigned agents/admins
CREATE POLICY "candidates_read_own" ON candidate_profiles FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','super_admin','agent','coach'))
  );

-- Documents: own documents + admins/agents
CREATE POLICY "documents_read_own" ON documents FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM candidate_profiles cp WHERE cp.id = candidate_id AND cp.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','super_admin','agent'))
  );

-- Internal notes: admins & agents only
CREATE POLICY "internal_notes_staff_only" ON internal_notes FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin','super_admin','agent','coach')));

-- Notifications: own only
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at              BEFORE UPDATE ON users              FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_candidate_profiles_updated_at BEFORE UPDATE ON candidate_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_documents_updated_at          BEFORE UPDATE ON documents          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated_at             BEFORE UPDATE ON orders             FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_appointments_updated_at       BEFORE UPDATE ON appointments       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cover_letters_updated_at      BEFORE UPDATE ON cover_letters      FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-calculate completeness score
CREATE OR REPLACE FUNCTION recalculate_completeness_score(p_candidate_id UUID)
RETURNS INT AS $$
DECLARE
  total_required INT;
  uploaded_approved INT;
  score INT;
BEGIN
  SELECT COUNT(*) INTO total_required
  FROM document_types WHERE is_required = TRUE AND is_active = TRUE;

  SELECT COUNT(*) INTO uploaded_approved
  FROM documents d
  JOIN document_types dt ON d.document_type_id = dt.id
  WHERE d.candidate_id = p_candidate_id
    AND d.status IN ('uploaded','in_review','approved')
    AND dt.is_required = TRUE;

  IF total_required = 0 THEN RETURN 0; END IF;
  score := ROUND((uploaded_approved::DECIMAL / total_required) * 100);
  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;

-- Update score on document status change
CREATE OR REPLACE FUNCTION trigger_update_completeness()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE candidate_profiles
  SET completeness_score = recalculate_completeness_score(NEW.candidate_id)
  WHERE id = NEW.candidate_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_document_completeness
  AFTER INSERT OR UPDATE OF status ON documents
  FOR EACH ROW EXECUTE FUNCTION trigger_update_completeness();

-- Auto-generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT := TO_CHAR(NOW(), 'YYYY');
  count_part TEXT;
BEGIN
  SELECT LPAD((COUNT(*) + 1)::TEXT, 5, '0') INTO count_part FROM invoices;
  RETURN 'INV-' || year_part || '-' || count_part;
END;
$$ LANGUAGE plpgsql;
