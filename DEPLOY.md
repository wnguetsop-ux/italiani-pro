# 🚀 ITALIANIPRO — Guide de déploiement complet (Firebase)
# De zéro à production sur VS Code

---

## PRÉ-REQUIS LOCAUX

- Node.js 18+ → https://nodejs.org
- Git → https://git-scm.com
- Compte Firebase gratuit (Spark) → https://firebase.google.com
- Compte Vercel gratuit → https://vercel.com
- VS Code → https://code.visualstudio.com

---

## ÉTAPE 1 — OUVRIR LE PROJET DANS VS CODE

```powershell
# Ouvrir le terminal dans VS Code (Ctrl+`)
cd italiani-pro
npm install
```

---

## ÉTAPE 2 — CRÉER LE PROJET FIREBASE

1. Aller sur https://console.firebase.google.com
2. Cliquer **"Créer un projet"**
3. Nom : `italiani-pro`
4. Désactiver Google Analytics (optionnel)
5. Attendre la création (~1 minute)

---

## ÉTAPE 3 — ACTIVER AUTHENTICATION

Firebase Console → **Authentication → Commencer**
- Activer **E-mail/Mot de passe** → Enregistrer

---

## ÉTAPE 4 — ACTIVER FIRESTORE

Firebase Console → **Firestore Database → Créer une base de données**
- Mode : **Production**
- Région : `europe-west1` (Belgique — proche de l'Italie)
- Cliquer **Activer**

### Configurer les règles Firestore
Firebase Console → Firestore → **Règles** → Remplacer par :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Utilisateurs — lecture/écriture du profil perso
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin','super_admin','agent','coach'];
    }

    // Profils candidats
    match /candidate_profiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin','super_admin','agent','coach'];
    }

    // Documents
    match /documents/{docId} {
      allow read, write: if request.auth != null;
    }

    // Notifications — propres à l'utilisateur
    match /notifications/{notifId} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }

    // Flussi calendar — lecture publique
    match /flussi_events/{eventId} {
      allow read: if true;
    }

    // Packages — lecture publique
    match /packages/{packId} {
      allow read: if true;
    }

    // Tout le reste — admin seulement
    match /{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin','super_admin'];
    }
  }
}
```

---

## ÉTAPE 5 — ACTIVER STORAGE

Firebase Console → **Storage → Commencer**
- Mode : **Production**
- Région : `europe-west1`

### Règles Storage :
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /documents/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null;
    }
  }
}
```

---

## ÉTAPE 6 — RÉCUPÉRER LES CLÉS FIREBASE (CLIENT)

Firebase Console → **Paramètres du projet (⚙️) → Général**
→ **"Tes applications" → Ajouter une app Web (</>)**
- Nom : `italiani-pro-web`
- Copier le bloc `firebaseConfig`

---

## ÉTAPE 7 — RÉCUPÉRER LES CLÉS FIREBASE ADMIN (SERVEUR)

Firebase Console → **Paramètres du projet → Comptes de service**
→ Cliquer **"Générer une nouvelle clé privée"**
→ Télécharger le fichier JSON
→ Ouvrir le fichier et copier :
- `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
- `private_key`  → `FIREBASE_ADMIN_PRIVATE_KEY`

---

## ÉTAPE 8 — CONFIGURER .env.local

```powershell
# Dans le terminal VS Code
copy .env.example .env.local
```

Ouvrir `.env.local` et remplir **toutes** les valeurs :

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=italiani-pro.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=italiani-pro
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=italiani-pro.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@italiani-pro.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nVOTRE_CLE\n-----END PRIVATE KEY-----\n"

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ IMPORTANT : La clé privée Firebase doit garder les `\n` à l'intérieur des guillemets.

---

## ÉTAPE 9 — CRÉER LE PREMIER ADMIN

```powershell
npm run dev
```

1. Aller sur http://localhost:3000/register
2. Créer un compte avec votre email admin
3. Dans Firebase Console → Firestore → Collection `users` → votre document
4. Changer le champ `role` de `"candidate"` à `"super_admin"`
5. Accéder à http://localhost:3000/admin/dashboard ✅

---

## ÉTAPE 10 — BUILD LOCAL

```powershell
npm run build
npm run start
```

---

## ÉTAPE 11 — DÉPLOIEMENT SUR VERCEL

```powershell
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer (depuis le dossier du projet)
vercel

# Répondre :
# Set up and deploy? → Y
# Project name → italiani-pro
# Directory → ./
```

### Ajouter les variables d'environnement sur Vercel :
```powershell
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production
vercel env add FIREBASE_ADMIN_CLIENT_EMAIL production
vercel env add FIREBASE_ADMIN_PRIVATE_KEY production
vercel env add NEXT_PUBLIC_APP_URL production
```

### Déployer en production :
```powershell
vercel --prod
```

---

## ÉTAPE 12 — METTRE À JOUR APP_URL

Dans Vercel → Project → Settings → Environment Variables
- Modifier `NEXT_PUBLIC_APP_URL` = `https://italiani-pro.vercel.app`
- Redéployer : `vercel --prod`

---

## TOUTES LES PAGES DISPONIBLES

| URL | Description |
|-----|-------------|
| `/` | Landing page publique |
| `/login` | Connexion Firebase Auth |
| `/register` | Inscription 3 étapes + Firebase |
| `/dashboard` | Dashboard candidat |
| `/documents` | Gestion documents |
| `/checklist` | Checklist dossier |
| `/timeline` | Parcours candidat |
| `/payments` | Paiements & jalons |
| `/messages` | Messagerie |
| `/profile` | Profil candidat |
| `/flussi` | Calendrier Flussi |
| `/admin/dashboard` | Dashboard admin |
| `/admin/candidates` | Liste candidats |
| `/admin/pipeline` | Kanban pipeline |
| `/admin/finance` | Finance |
| `/admin/analytics` | Analytics |
| `/admin/team` | Équipe |

---

## COMMANDES RÉSUMÉ

```powershell
npm install          # Installer les dépendances
npm run dev          # Développement → localhost:3000
npm run build        # Build production
npm run start        # Serveur prod local
vercel               # Déployer preview
vercel --prod        # Déployer production
```

---

## PROBLÈMES COURANTS

### "Cannot find module firebase"
```powershell
npm install firebase firebase-admin
```

### Erreur auth/configuration-not-found
→ Vérifier que NEXT_PUBLIC_FIREBASE_API_KEY est bien rempli dans .env.local

### Port 3000 occupé
```powershell
npm run dev -- -p 3001
```

### Build échoue TypeScript
```powershell
npx tsc --noEmit
# Corriger les erreurs affichées
```

### Erreur private key Firebase Admin
→ La clé doit être entre guillemets doubles avec \n littéraux :
```env
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nABC...\n-----END PRIVATE KEY-----\n"
```

---

## EXTENSIONS VS CODE RECOMMANDÉES

- **Tailwind CSS IntelliSense** — autocomplete classes
- **ES7+ React/Redux snippets** — snippets React
- **Prettier** — formatage
- **GitLens** — historique Git
- **Firebase** — extension officielle Firebase

---

Contact : associazionelacolom75@gmail.com | WhatsApp : +39 329 963 9430
