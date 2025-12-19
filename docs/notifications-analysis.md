# Analisi del Sistema di Notifiche e Trigger Points

Questo documento fornisce una mappatura completa del sistema di notifiche e dei punti di attivazione (trigger points) all'interno di HireFlow. Serve come riferimento per future modifiche, debugging e per garantire la coerenza delle comunicazioni verso utenti e candidati.

## 1. Canali di Comunicazione

Attualmente il sistema utilizza quattro canali principali per le comunicazioni e le automazioni:

1.  **Email (Resend)**:
    *   Gestito via `lib/email.tsx`.
    *   Utilizza template React Email con styling Tailwind CSS.
    *   Utilizzato per comunicazioni critiche (conferme, inviti, alert).

2.  **In-App Notifications (DB)**:
    *   Tabella `communicationLog`.
    *   Utilizzato per mostrare notifiche nella dashboard utente/recruiter.
    *   Campi chiave: `type` ("notification"), `subject`, `content`, `metadata`.

3.  **Event Workflows (Internal)**:
    *   Gestito via `lib/events.ts` (`triggerWorkflow`).
    *   Disaccoppia l'azione utente dalla logica di business asincrona.
    *   Attualmente utilizzato principalmente come hook per future integrazioni n8n o background jobs.

4.  **Webhooks (n8n)**:
    *   Chiamate HTTP dirette verso endpoint configurati (es. parsing CV).
    *   Utilizzato per task pesanti o AI-driven gestiti esternamente.

---

## 2. Mappatura Trigger Points

Di seguito sono elencati tutti gli eventi che generano notifiche o automazioni, raggruppati per area funzionale.

### A. Candidature (Applications)

File sorgente: `lib/server/application-actions.ts`

| Azione | Evento / Trigger | Destinatario | Canale | Template / Dettagli |
| :--- | :--- | :--- | :--- | :--- |
| **Nuova Candidatura** (`submitApplicationAction`) | `application.created` | Team Recruiting | **Log** | "New Application Received" |
| | | Team Recruiting | **Email** | `NewApplicationAlertEmail` |
| | | Candidato | **Email** | `ApplicationReceivedEmail` |
| | `application.created` | Sistema | **Workflow** | Payload con dati candidatura e CV |
| **Cambio Stato** (`updateApplicationStatusAction`) | `application.status_updated` | Candidato | **Log** | "Application Status Update" |
| | | Candidato | **Email** | `ApplicationStatusUpdateEmail` |
| | `application.status_updated` | Sistema | **Workflow** | Payload con nuovo e vecchio stato |

### B. Colloqui (Interviews)

File sorgente: `lib/server/interview-actions.ts`

| Azione | Evento / Trigger | Destinatario | Canale | Template / Dettagli |
| :--- | :--- | :--- | :--- | :--- |
| **Pianificazione** (`createInterviewAction`) | `interview.scheduled` | Candidato | **Log** | "Interview Scheduled" |
| | | Team Recruiting | **Log** | "Interview Scheduled" (eccetto organizzatore) |
| | | Candidato | **Email** | `InterviewScheduledEmail` |
| | `interview.scheduled` | Sistema | **Workflow** | Payload con dettagli meeting |
| **Aggiornamento** (`updateInterviewAction`) | `interview.updated` | Candidato | **Log** | "Interview Updated/Rescheduled" |
| | | Team Recruiting | **Log** | "Interview Update" |
| | | Candidato | **Email** | `InterviewUpdatedEmail` (se reschedule/update) |
| | | Candidato | **Email** | `InterviewCancelledEmail` (se status=cancelled) |
| | `interview.updated` | Sistema | **Workflow** | Payload con modifiche |
| **Cancellazione** (`deleteInterviewAction`) | `interview.cancelled` | Candidato | **Log** | "Interview Cancelled" |
| | | Team Recruiting | **Log** | "Interview Cancelled" |
| | | Candidato | **Email** | `InterviewCancelledEmail` |
| | `interview.cancelled` | Sistema | **Workflow** | Payload intervista cancellata |

### C. AI & Matching

File sorgente: `lib/server/ai-actions.ts`

| Azione | Evento / Trigger | Destinatario | Canale | Template / Dettagli |
| :--- | :--- | :--- | :--- | :--- |
| **Analisi Match** (`generateMatchAnalysisAction`) | `ai.match_analysis` | Team Recruiting | **Log** | "High Match" (Solo se score ≥ 75%) |
| | | Team Recruiting | **Email** | `HighMatchAlertEmail` (Solo se score ≥ 75%) |
| | `application.analysis_completed`| Sistema | **Workflow** | Payload con analisi AI completa |
| **Parsing CV** (`triggerCandidateParsingAction`) | Webhook Call | n8n / External | **Webhook** | `N8N_PARSING_WEBHOOK_URL` |

### D. Onboarding

File sorgente: `lib/server/onboarding-actions.ts`

| Azione | Evento / Trigger | Destinatario | Canale | Template / Dettagli |
| :--- | :--- | :--- | :--- | :--- |
| **Complete Candidate** (`completeCandidateOnboardingAction`) | Webhook Call | n8n / External | **Webhook** | `N8N_PARSING_WEBHOOK_URL` (se CV presente) |

### E. Candidati (Candidate Engagement)

File sorgente: `lib/server/candidate-actions.tsx`

| Azione | Evento / Trigger | Destinatario | Canale | Template / Dettagli |
| :--- | :--- | :--- | :--- | :--- |
| **Invito a Candidarsi** (`sendInterestAction`) | `candidate.invited` | Candidato | **Log** | "Invitation to Apply" |
| | | Candidato | **Email** | `InvitationToApplyEmail` (Inline/Template) |

### F. Amministrazione (Admin Actions)

File sorgente: `lib/server/admin-actions.ts`

| Azione | Evento / Trigger | Destinatario | Canale | Template / Dettagli |
| :--- | :--- | :--- | :--- | :--- |
| **Ban Utente** (`banUserAction`) | `admin.user.banned` | Utente | **Email** | `AccountStatusEmail` (Type: Banned) |
| | `admin.user.banned` | Sistema | **Workflow** | Payload con motivo ban |
| **Sblocco Utente** (`unbanUserAction`) | `admin.user.unbanned` | Utente | **Email** | `AccountStatusEmail` (Type: Unbanned) |
| | `admin.user.unbanned` | Sistema | **Workflow** | Payload sblocco |

### G. Notifiche Admin (Inbound)

Queste notifiche sono destinate agli amministratori del sistema (visualizzabili in `/admin/notifications`).

| Trigger | Evento | Destinatario | Priorità | Implementazione |
| :--- | :--- | :--- | :--- | :--- |
| **Nuova Organizzazione** | `org.created` | Admin | Bassa | ✅ `lib/server/organization-actions.ts` |
| **System Alert (Polar)** | `system.alert` | Admin | Alta | ✅ `lib/auth.tsx` (Webhook Error Handling) |
| **Segnalazione Utente** | `user.reported` | Admin | Alta | ⏳ Previsto (Feature non ancora esistente) |

---

## 3. Architettura Centralizzata (NotificationService)

**Aggiornamento (19/12/2024)**: È stato introdotto il `NotificationService` (`lib/services/notification-service.ts`) per centralizzare la logica di notifica.
Tutte le Server Actions dovrebbero ora delegare l'invio di email e log DB a questo servizio, garantendo consistenza e manutenibilità.

### Metodi disponibili:
*   `handleApplicationCreated(data)`
*   `handleApplicationStatusUpdated(data)`
*   `handleInterviewScheduled(data)`
*   `handleInterviewUpdated(data)`
*   `handleInterviewCancelled(data)`
*   `handleHighMatchAlert(data)`
*   `handleCandidateInterest(data)`
*   `handleUserBanned(data)`
*   `handleUserUnbanned(data)`

---

## 4. Note per Sviluppo Futuro

1.  **Centralizzazione**: ✅ **Implementato**. La logica è stata spostata in `NotificationService`.
2.  **Preferenze Utente**: ✅ **Implementato**. `NotificationService` verifica le impostazioni in `user_settings` (email/in-app) prima dell'invio (eccetto notifiche critiche come Ban).
3.  **Idempotenza**: ✅ **Implementato**. Aggiunto header `Idempotency-Key` e logica di retry per i webhook n8n in `lib/events.ts`.
4.  **Admin Notifications**: ✅ **Implementato**. Aggiunto supporto per notifiche in-app amministrative e pagina dedicata (`/admin/notifications`).
5.  **Error Handling**: Attualmente gli errori di invio email vengono loggati ma non bloccano il flusso principale (`Promise.allSettled`). Mantenere questo approccio per non impattare l'esperienza utente in caso di problemi SMTP/API.
