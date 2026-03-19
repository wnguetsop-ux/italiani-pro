# ItalianiPro — Plateforme d'accompagnement candidature Italie

> **Plateforme premium d'accompagnement documentaire pour la préparation de candidature vers l'Italie.**
> Conçue pour les candidats camerounais et africains francophones/anglophones.

---

## ⚠️ Disclaimer légal obligatoire

ItalianiPro est une **plateforme d'accompagnement documentaire uniquement**.  
Elle ne garantit et n'obtient PAS :
- d'emploi en Italie
- de visa de travail
- de nulla osta (autorisation de travail préalable)

La demande officielle de nulla osta est effectuée par **l'employeur** via le portail officiel Sportello Unico delle Immigrazioni. ItalianiPro n'intervient pas dans ce processus officiel.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS v3 + CSS custom |
| Base de données | Supabase (PostgreSQL 15) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Paiements | CinetPay (MTN Money, Orange Money, XAF) |
| Hébergement | Vercel |
| Email | Resend |

---

## Fonctionnalités MVP

### Espace candidat
- ✅ Inscription / connexion sécurisée
- ✅ Onboarding guidé (3 étapes)
- ✅ Dashboard avec scores (complétude, qualité, préparation)
- ✅ Upload et gestion de documents
- ✅ Checklist personnalisée des pièces requises
- ✅ Timeline d'avancement du dossier
- ✅ Espace preuves de travail horodatées
- ✅ Paiements Mobile Money (MTN, Orange via CinetPay)
- ✅ Messagerie avec l'équipe
- ✅ Calendrier Flussi 2027-2028 avec compte à rebours
- ✅ Notifications en temps réel

### Espace admin
- ✅ Dashboard admin ultra-complet
- ✅ Gestion de tous les candidats
- ✅ Pipeline Kanban des dossiers
- ✅ Finance et revenus
- ✅ Gestion de l'équipe (agents, coaches)
- ✅ Tâches quotidiennes et alertes
- ✅ Analytics et performance

---

## Décret Flussi 2027 — Dates intégrées

| Date | Catégorie |
|------|-----------|
| 12 janvier 2027 | Saisonniers Agricoles |
| 9 février 2027 | Saisonniers Tourisme |
| 16 février 2027 | Non Saisonniers Généraux |
| 18 février 2027 | Assistance Familiale / Domicile |

---

## Installation rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés Supabase

# 3. Exécuter le schéma SQL dans Supabase
# Copier sql/01_schema.sql dans Supabase SQL Editor

# 4. Démarrer
npm run dev
```

📖 **Guide de déploiement complet** → voir [DEPLOY.md](./DEPLOY.md)

---

## Structure de base de données

Tables principales : `users`, `candidate_profiles`, `documents`, `document_types`, `orders`, `payments`, `milestones`, `conversations`, `messages`, `appointments`, `notifications`, `legal_consents`, `activity_logs`, `flussi_calendar_events`, `packages`, `proofs`, `proof_files`, `cv_versions`, `cover_letters`, `internal_notes`, `support_tickets`, `knowledge_articles`, `referrals`, `promo_codes`

---

## Licence

Usage commercial — Propriété de ItalianiPro.  
Contact : contact@italianipro.com
