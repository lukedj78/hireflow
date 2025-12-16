# Relazione tecnica e piano operativo
## Piattaforma AI per Recruiting, Matching e Gestione HR: **HireFlow**

---

## 1. Obiettivo del progetto
Realizzare **HireFlow**, una piattaforma **B2B SaaS AI-driven** per la gestione completa del processo di recruiting:
- Pubblicazione e gestione annunci di lavoro
- Raccolta candidature e CV
- Matching intelligente domanda ↔ offerta
- Gestione pipeline di selezione
- Comunicazioni automatiche tra HR e candidati
- Supporto decisionale HR tramite AI

Il sistema deve essere:
- Scalabile
- Automatizzato
- GDPR-aware
- Basato su **Next.js + AI + n8n**

---

## 2. Architettura generale

> **Nota architetturale**: per la gestione del database e degli **embedding vettoriali** viene utilizzato **Turso (SQLite distribuito + libSQL)**.

### 2.1 Componenti principali

**Frontend / App**
- Next.js (App Router)
- Dashboard HR
- Area candidati
- Gestione annunci, pipeline, comunicazioni
- **Gestione UI e componenti tramite ShadCN UI**
- **Branding e colori aziendali** definiti come da guideline

**Backend applicativo**
- Server Actions (Next.js)
- Business logic
- Autenticazione (Better Auth)
- Autorizzazioni multi-tenant
- **Pagamenti e billing (Polar)**

**AI Layer**
- **Vercel AI Gateway**
- Embeddings semantici
- Classificazione e ranking
- Generazione testi (email, feedback)

**Automation Layer**
- n8n self-hosted
- Workflow asincroni
- Comunicazioni
- Job batch

**Database (core + vector search)**
- **Turso (libSQL / SQLite distribuito)**
- Tabelle relazionali (aziende, annunci, candidati)
- Tabelle vettoriali per embeddings
- Repliche edge per bassa latenza
- Drizzle ORM (adapter libSQL)

---

### 2.2 Flusso alto livello

```
User Action (App)
   ↓
Server Action (Next.js)
   ↓
DB update + Webhook
   ↓
n8n Workflow
   ↓
AI Processing / Automation
   ↓
DB update + Notifications
```

---

### 2.3 Brand Identity e Color Analysis – HireFlow (ShadCN UI)

#### 1. Obiettivi della brand identity
- Trasmettere **professionalità e affidabilità** nel recruiting B2B
- Comunicare **innovazione e AI-driven**
- Rendere **chiara la navigazione e l’UX** grazie a colori coerenti
- Avere un’identità **riconoscibile** su web, email, dashboard e materiali marketing

#### 2. Palette colori consigliata

| Colore | Uso principale | Significato / funzione |
|--------|----------------|----------------------|
| **Blu scuro (#1D4ED8)** | Header, Navbar, CTA principali | Professionalità, fiducia, stabilità |
| **Blu chiaro (#3B82F6)** | Hover, secondary buttons, highlights | Dinamicità, modernità |
| **Grigio chiaro (#F3F4F6)** | Background, cards | Neutralità, leggibilità, contrasto |
| **Bianco (#FFFFFF)** | Background, modals | Pulizia, leggibilità |
| **Verde (#10B981)** | Success messages, indicatori positivi | Successo, approvazione |
| **Rosso (#EF4444)** | Error messages, alert | Allerta, attenzione |

#### 3. Tipografia e iconografia
- **Font principale:** Inter / Roboto
- **Font secondario:** Poppins per titoli / elementi enfatizzati
- **Iconografia:** Lucide React + componenti ShadCN UI

#### 4. Applicazione nei componenti principali
- **Dashboard HR:** Header blu scuro, card grigio chiaro, pulsanti primari blu tramite ShadCN
- **Pipeline candidature:** Indicatori stato con verde/rosso
- **Comunicazioni:** Email template brandizzato con colori e font coerenti
- **Notifiche:** Badge colore coerente con stato (verde success / rosso errore)

#### 5. Linee guida strategiche
- Coerenza dei colori tra app, email e landing page
- Accessibilità (contrasto minimo 4.5:1 per testi principali)
- Uso limitato di colori “accento” per evidenziare azioni chiave
- Possibilità di **theme switching** (light/dark) mantenendo palette base
- **Gestione componenti UI tramite ShadCN per standardizzazione e rapid prototyping**

---

## 3. Modello dati (concettuale)

### Entità principali
- Company
- User (HR / Recruiter)
- JobPosting
- Candidate
- Application
- PipelineStage
- CommunicationLog
- AIMatchScore
- Subscription / Invoice (Polar)

### Concetti chiave
- Ogni candidatura ha uno **stato**
- Ogni cambio stato genera **eventi**
- Gli eventi attivano **workflow n8n**
- Billing e pagamenti gestiti tramite **Polar**, integrato nel workflow
- **Color palette e branding** applicati coerentemente nell'interfaccia

---

## 4. Ruoli chiave dei componenti

### 4.0 Turso (Database + Vector Store)
- Fonte di verità applicativa
- Persistenza multi-tenant
- Storage embedding CV / Job Description
- Similarity search (cosine / dot-product)
- Replica edge per performance
- Tecnologie: Turso + Drizzle ORM

### 4.1 Next.js (core applicativo)
- UI/UX coerente con **brand colors / ShadCN**
- Autorizzazioni
- Stato applicativo
- Trigger eventi
- Billing / pagamenti (Polar)

### 4.2 AI Layer
- Parsing CV / JD
- Embeddings e matching score
- Generazione testi
- Explainability
- Sincrono e asincrono (via n8n)

### 4.3 n8n (motore di automazione)
- Orchestrazione workflow
- Comunicazioni
- Job asincroni
- Reminder
- Report
- Sync esterni

---

## 5. Piano operativo step-by-step

### FASE 1 – Fondamenta (Settimane 1–2)
- Step 0: Setup pagamenti e fatturazione con Polar
- Step 1: Setup infrastruttura (Next.js, Turso, n8n) + brand colors ShadCN
- Step 2: Autenticazione e aziende (Better Auth, multi-tenant)

### FASE 2 – Annunci e candidature (Settimane 3–4)
- CRUD JobPosting
- Form candidatura + upload CV
- Evento `application.created`

### FASE 3 – Parsing CV e JD con AI (Settimane 5–6)
- Workflow n8n per parsing CV + JD via AI Gateway
- Salvataggio dati strutturati su Turso

### FASE 4 – Matching intelligente (Settimane 7–8)
- Generazione embedding CV / JD
- Similarity search via Turso
- Calcolo score finale
- Explainability AI
- Output: Ranking candidati

### FASE 5 – Pipeline recruiting (Settimane 9–10)
- Stati candidatura: Applied → Screening → Interview → Offer → Hired / Rejected
- Ogni cambio stato trigger workflow n8n

### FASE 6 – Comunicazioni automatiche (Settimane 11–12)
- Email AI
- Reminder candidati fermi
- Log comunicazioni

### FASE 7 – Assistente HR (Settimane 13–14)
- HR Copilot: riassunti CV, suggerimenti candidati, domande colloquio
- Sincronizzazione AI via Server Actions

### FASE 8 – Analytics e ottimizzazione (Settimane 15–16)
- Tempo medio assunzione
- Conversioni per fase
- Qualità match
- Batch processing AI, caching, limiti per piano

---

## 6. Integrazione App ↔ AI ↔ n8n ↔ Turso ↔ Polar
- App = evento
- n8n = orchestrazione
- AI = decisione
- Turso = fonte di verità + vector store
- Polar = gestione abbonamenti / invoice / pagamenti
- Workflow idempotenti, tracciamento risultati AI, fallback manuale possibile

---

## 7. Rischi e mitigazioni
| Rischio | Mitigazione |
|---|---|
| AI imprecisa | Explainability + override |
| Costi AI | Rate limit + batch |
| GDPR | Consensi + retention |
| Complessità | MVP verticale |
| Pagamenti / fatturazione | Monitor Polar + logging |

---

## 8. Analisi tempi, costi e ricavi

### 8.1 Timeline sviluppo
| Fase | Durata | Output |
|---|---|---|
| Fondamenta | 2 settimane | Infra + auth + Polar |
| Annunci + candidature | 2 settimane | Core ATS |
| Parsing AI | 2 settimane | CV/JD strutturati |
| Matching AI | 2 settimane | Ranking candidati |
| Pipeline | 2 settimane | Workflow recruiting |
| Comunicazioni | 2 settimane | Email + reminder |
| HR Copilot | 2 settimane | AI assistente |
| Analytics + ottimizzazioni | 2 settimane | Cost control |
**Totale:** ~16 settimane (4 mesi)

### 8.2 Costi operativi mensili (stima)
| Voce | Costo mensile |
|---|---|
| Turso | 0–25 € |
| VPS (n8n + app) | 20–40 € |
| AI (AI Gateway) | 100–400 € |
| Email (Resend) | 10–30 € |
| Polar | % transazioni |
| Logging / Monitoring | 10–20 € |
| Dominio / tools | 10 € |
**Totale stimato:** 150–525 €/mese + fee Polar

### 8.3 Modello di pricing (SaaS B2B + Polar)
| Piano | Prezzo | Target |
|---|---|---|
| Starter | 49 €/mese | PMI |
| Pro | 99 €/mese | HR team |
| Agency | 199 €/mese | Agenzie recruiting |
| Enterprise | Custom | Aziende strutturate |

### 8.4 Proiezione ricavi (12 mesi)
- Scenario conservativo: 20 Starter + 10 Pro → MRR ~2.000 €
- Scenario realistico: 40 Starter + 25 Pro + 5 Agency → MRR ~6.500 €
- Scenario ottimistico: 80 Starter + 50 Pro + 15 Agency → MRR ~15.000 €

### 8.5 Margini e rendita
- Costi fissi bassi
- Costi AI variabili controllabili
- Margine lordo stimato: 70–85%
- HireFlow diventa fortemente profittevole e semi-passivo su scala

---

## 9. Risultato finale
**HireFlow** è una piattaforma recruiting AI-first, automatizzata, difendibile e scalabile, con:
- Forte valore per HR
- Riduzione lavoro manuale
- Gestione sicura di pagamenti e fatturazione
- **Identità visiva coerente (colori aziendali, ShadCN UI, branding)**
- Rendita ricorrente B2B