# Policy di Ruoli e Permessi - HireFlow

Questo documento descrive il sistema di controllo degli accessi basato sui ruoli (RBAC) implementato in HireFlow.
Il sistema garantisce che ogni utente abbia accesso solo alle risorse e alle funzionalità pertinenti al proprio ruolo all'interno di un'organizzazione.

## Panoramica dei Ruoli

In HireFlow esistono due livelli di ruoli:
1. **Ruoli di Sistema** (Globali)
2. **Ruoli Organizzativi** (Specifici per ogni azienda/organizzazione)

### 1. Ruoli di Sistema

| Ruolo | Descrizione | Privilegi |
| :--- | :--- | :--- |
| **Admin (Superuser)** | Amministratore della piattaforma HireFlow. | **Accesso Totale**. Può accedere a qualsiasi organizzazione, gestire utenti, visualizzare tutti i dati e bypassare i controlli di permesso standard per scopi di manutenzione e supporto. |
| **User** | Utente standard registrato. | Può creare nuove organizzazioni, gestire il proprio profilo e accettare inviti. |

### 2. Ruoli Organizzativi

Questi ruoli si applicano all'interno di una specifica organizzazione (tenant). Un utente può avere ruoli diversi in organizzazioni diverse.

| Ruolo | Descrizione | Focus |
| :--- | :--- | :--- |
| **Owner** | Proprietario dell'organizzazione. | Controllo totale sull'organizzazione, inclusa la gestione dei membri, billing e cancellazione dell'account aziendale. |
| **Admin** | Amministratore dell'organizzazione. | Gestione operativa completa (membri, recruiting), ma non può cancellare l'organizzazione. |
| **HR / Recruiter** | Responsabile del processo di selezione. | Gestione completa del ciclo di recruiting (Annunci, Candidature, Colloqui). Non può gestire i membri del team o le impostazioni critiche dell'azienda. |
| **Member** | Membro del team. | Accesso in sola lettura alle informazioni condivise. Può visualizzare annunci e membri, ma non può effettuare modifiche. |

---

## Matrice dei Permessi (Dettaglio Tecnico)

Di seguito è riportata la matrice dettagliata delle autorizzazioni per risorsa (Resource) e azione (Action).

### Legenda
- ✅ : Accesso consentito
- ❌ : Accesso negato

### Risorse Organizzative

| Risorsa | Azione | Owner | Admin | HR | Member |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Organization** | Read (Visualizzare dettagli) | ✅ | ✅ | ✅ | ✅ |
| | Update (Modificare impostazioni) | ✅ | ✅ | ✅ | ❌ |
| | Delete (Eliminare organizzazione) | ✅ | ❌ | ❌ | ❌ |
| | Leave (Lasciare organizzazione) | ✅ | ✅ | ✅ | ✅ |
| **Members** | Read (Vedere lista membri) | ✅ | ✅ | ❌* | ✅ |
| | Create (Invitare membri) | ✅ | ✅ | ❌ | ❌ |
| | Update (Cambiare ruoli) | ✅ | ✅ | ❌ | ❌ |
| | Delete (Rimuovere membri) | ✅ | ✅ | ❌ | ❌ |
| **Teams** | Read | ✅ | ✅ | ❌* | ✅ |
| | Create/Update/Delete | ✅ | ✅ | ❌ | ❌ |

*\*Nota: Il ruolo HR è focalizzato sul recruiting, l'accesso alla lista membri è limitato se non esplicitamente necessario (configurazione attuale).*

### Risorse Recruiting (ATS)

| Risorsa | Azione | Owner | Admin | HR | Member |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Job Posting** | Read (Vedere annunci) | ✅ | ✅ | ✅ | ✅ |
| | Create (Creare annunci) | ✅ | ✅ | ✅ | ❌ |
| | Update (Modificare annunci) | ✅ | ✅ | ✅ | ❌ |
| | Delete (Eliminare annunci) | ✅ | ✅ | ✅ | ❌ |
| **Application** | Read (Vedere candidature) | ✅ | ✅ | ✅ | ❌ |
| | Status (Cambiare stato pipeline) | ✅ | ✅ | ✅ | ❌ |
| | Update (Modificare dati) | ✅ | ✅ | ✅ | ❌ |
| | Delete (Eliminare candidatura) | ✅ | ✅ | ✅ | ❌ |
| **Interview** | Read (Vedere colloqui) | ✅ | ✅ | ✅ | ❌ |
| | Create (Fissare colloquio) | ✅ | ✅ | ✅ | ❌ |
| | Update (Spostare/Modificare) | ✅ | ✅ | ✅ | ❌ |
| | Delete (Cancellare colloquio) | ✅ | ✅ | ✅ | ❌ |

---

## Implementazione Tecnica

### Backend (Server Actions)
La sicurezza è garantita centralmente tramite la funzione `checkOrgPermission` (`lib/server/permissions-check.ts`).
Ogni Server Action critica esegue questo controllo prima di procedere.

Esempio di utilizzo:
```typescript
await checkOrgPermission(organizationId, { jobPosting: ["create"] });
```
Se l'utente non possiede il permesso richiesto, viene lanciata un'eccezione `APIError: FORBIDDEN`.

### Frontend (UI)
L'interfaccia utente si adatta dinamicamente in base al ruolo dell'utente (`currentUserRole`).
I componenti sensibili (pulsanti di modifica, form, menu di eliminazione) vengono renderizzati condizionalmente.

Esempio:
```typescript
const canManageJobs = ["owner", "admin", "hr"].includes(currentUserRole);

{canManageJobs && (
  <Button>Create Job</Button>
)}
```

## Note Importanti
- **Super Admin Bypass**: Gli utenti con ruolo globale `admin` nel database bypassano tutti i controlli organizzativi per garantire supporto e manutenzione.
- **Sicurezza in Profondità**: La sicurezza non si basa solo sull'UI nascosta, ma è sempre validata lato server (API/Action) per prevenire accessi non autorizzati diretti.
