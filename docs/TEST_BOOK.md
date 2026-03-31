# Test Book — HireFlow

> Schema utenti, flussi da testare, e scenari di test manuali/E2E.
> Password di default per tutti gli utenti seed: `Dg@123456`

## Schema utenti seed

### Mappa visuale

```
                            ┌──────────────────┐
                            │   ADMIN SISTEMA   │
                            │ Luca Digerlando   │
                            │ lucadigerlando@   │
                            │ gmail.com         │
                            │ role: admin       │
                            └────────┬─────────┘
                                     │ owner
                    ┌────────────────┼────────────────┐
                    ▼                ▼                 ▼
            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
            │  ACME CORP   │ │ GLOBEX CORP  │ │ SOYLENT CORP │
            └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
                   │                │                 │
    ┌──────────────┤         ┌──────┼──────┐    ┌─────┤
    ▼              ▼         ▼      ▼      ▼    ▼     ▼
  Alice          Bob      Frank  Grace  Heidi  Ivan  Judy
  owner        member     owner  admin  member owner member
  alice@       bob@       frank@ grace@ heidi@ ivan@ judy@
  example.com  example.com globex globex globex soylent soylent

                        CANDIDATI
    ┌────────┬────────┬────────┬────────┬────────┬────────┬────────┐
  Luigi    Charlie  David    Eve    Kevin   Laura   Mike    Nina
  test     frontend design  backend safety  mktg   science supply
  luigi@   charlie@ david@  eve@   kevin@  laura@  mike@   nina@
  test.it  example  example example example example example example
```

### Tabella credenziali

| Utente | Email | Ruolo sistema | Org | Ruolo org | Specialita' |
|--------|-------|---------------|-----|-----------|-------------|
| Luca Digerlando | lucadigerlando@gmail.com | admin | Acme | owner | Admin sistema + business |
| Luigi Test | luigi@test.it | candidate | — | — | Candidato test |
| Alice Admin | alice@example.com | user | Acme | owner | Business owner |
| Bob Member | bob@example.com | user | Acme | member | Business membro base |
| Frank Globex | frank@globex.com | user | Globex | owner | Business owner |
| Grace Admin | grace@globex.com | user | Globex | admin | Business admin (non owner) |
| Heidi Member | heidi@globex.com | user | Globex | member | Business membro base |
| Ivan Soylent | ivan@soylent.com | user | Soylent | owner | Business owner |
| Judy Member | judy@soylent.com | user | Soylent | member | Business membro base |
| Charlie Candidate | charlie@example.com | candidate | — | — | React, TypeScript, Next.js |
| David Candidate | david@example.com | candidate | — | — | Figma, UI/UX |
| Eve Candidate | eve@example.com | candidate | — | — | Node.js, Python, AWS |
| Kevin Candidate | kevin@example.com | candidate | — | — | Safety, multi-candidatura (5 app!) |
| Laura Candidate | laura@example.com | candidate | — | — | Marketing, SEO |
| Mike Candidate | mike@example.com | candidate | — | — | Chemistry, Nutrition |
| Nina Candidate | nina@example.com | candidate | — | — | Logistics, Supply Chain |

### Candidature nel seed

| Candidato | Job | Org | Status | AI Score |
|-----------|-----|-----|--------|----------|
| Charlie | Sr Frontend Dev | Acme | screening | 85 |
| Eve | Sr Frontend Dev | Acme | applied | 60 |
| David | Product Designer | Acme | interview | 90 |
| Charlie | Eng Manager | Acme | rejected | 45 |
| Kevin | QA Engineer | Acme | applied | 55 |
| Kevin | Safety Inspector | Globex | **hired** | 95 |
| Laura | Marketing Mgr | Globex | **offer** | 88 |
| Charlie | Marketing Mgr | Globex | rejected | 40 |
| Kevin | Plant Technician | Globex | screening | 75 |
| Kevin | Security Guard | Globex | applied | 60 |
| Mike | Food Scientist | Soylent | screening | 82 |
| Nina | Supply Chain Mgr | Soylent | interview | 91 |
| Kevin | Supply Chain Mgr | Soylent | applied | 30 |
| Kevin | Taste Tester | Soylent | **offer** | 88 |
| Mike | Lab Assistant | Soylent | interview | 85 |

---

## Test Book — Flussi da testare

### F1. Autenticazione

| # | Scenario | Utente | Steps | Risultato atteso |
|---|----------|--------|-------|-----------------|
| F1.1 | Login valido (admin) | Luca | Sign in → email + pw | Redirect a dashboard Acme |
| F1.2 | Login valido (candidato) | Luigi | Sign in → email + pw | Redirect a dashboard candidato |
| F1.3 | Login password errata | Qualsiasi | Sign in → pw sbagliata | Errore "Invalid credentials" |
| F1.4 | Registrazione nuovo utente | Nuovo | Sign up → nome + email + pw | Account creato, redirect onboarding |
| F1.5 | Logout | Qualsiasi | Click logout dal menu | Redirect a sign-in |

### F2. Onboarding

| # | Scenario | Utente | Steps | Risultato atteso |
|---|----------|--------|-------|-----------------|
| F2.1 | Scelta ruolo candidato | Nuovo | Onboarding → click "I'm a Candidate" | Redirect a form candidato |
| F2.2 | Scelta ruolo business | Nuovo | Onboarding → click "I'm a Business" | Redirect a form organizzazione |
| F2.3 | Completamento onboarding candidato | Nuovo | Compila profilo → skills → review | Profilo creato, redirect dashboard |
| F2.4 | Completamento onboarding business | Nuovo | Compila org name → dettagli | Org creata, redirect dashboard org |

### F3. Dashboard HR (Business)

| # | Scenario | Utente | Steps | Risultato atteso |
|---|----------|--------|-------|-----------------|
| F3.1 | Visualizzazione metriche | Alice (Acme) | Login → dashboard | 5 jobs, candidature, chart pipeline |
| F3.2 | Metriche altra org | Frank (Globex) | Login → dashboard | Stats Globex (5 jobs, candidature Globex) |
| F3.3 | Org switcher | Luca | Dashboard → cambia org | Switch tra Acme e altre org |
| F3.4 | Loading skeleton | Qualsiasi | Refresh dashboard | Skeleton cards visibili durante caricamento |

### F4. Gestione Job

| # | Scenario | Utente | Steps | Risultato atteso |
|---|----------|--------|-------|-----------------|
| F4.1 | Lista job | Alice (Acme) | Dashboard → Jobs | 5 job visibili con status badge |
| F4.2 | Filtro per status | Alice | Jobs → filtro "draft" | Solo "Backend Engineer" visibile |
| F4.3 | Ricerca job | Alice | Jobs → search "frontend" | Solo "Sr Frontend Developer" |
| F4.4 | Crea job manuale | Alice | Jobs → New → compila form | Job creato come draft |
| F4.5 | Crea job con AI | Alice | Jobs → AI New → chat | Agente chiede dati uno alla volta, preview si aggiorna |
| F4.6 | Pubblica job draft | Alice | Job detail → cambia status | Status "published" |
| F4.7 | Chiudi job | Alice | Job detail → cambia status | Status "closed" |
| F4.8 | Membro non puo' creare | Bob (Acme, member) | Jobs → New | Azione bloccata (RBAC) |

### F5. Pipeline candidature

| # | Scenario | Utente | Steps | Risultato atteso |
|---|----------|--------|-------|-----------------|
| F5.1 | Vista pipeline | Alice | Job "Sr Frontend Dev" → Pipeline | Charlie (screening) + Eve (applied) |
| F5.2 | Dettaglio candidatura | Alice | Pipeline → click Charlie | Score 85, analisi AI, pro/contro |
| F5.3 | Genera match analysis | Alice | Candidatura → "Generate Analysis" | Score + strengths/weaknesses generati |
| F5.4 | Cambia status | Alice | Candidatura → screening → interview | Status aggiornato, notifica inviata |
| F5.5 | Rifiuta candidato | Alice | Candidatura → reject | Status "rejected", email al candidato |
| F5.6 | Candidature cross-org | Kevin | Login come Kevin | Vede le sue 5 candidature in 3 org diverse |

### F6. Dashboard Candidato

| # | Scenario | Utente | Steps | Risultato atteso |
|---|----------|--------|-------|-----------------|
| F6.1 | Dashboard vuota | Luigi | Login | Saluto personalizzato, 3 step "Get Started", empty state jobs |
| F6.2 | Ricerca lavori | Charlie | Dashboard → Jobs | Lista job pubblicati con search |
| F6.3 | Dettaglio job | Charlie | Jobs → click job | Descrizione, location, salary, bottone Apply |
| F6.4 | Candidatura | Charlie | Job → Apply → compila | Candidatura creata, conferma |
| F6.5 | Doppia candidatura | Charlie | Applica a job gia' applicato | Bottone "Applied" disabilitato |
| F6.6 | Le mie candidature | Charlie | Dashboard → Applications | Lista candidature con status |
| F6.7 | Profilo | Luigi | Dashboard → Profile | Form modifica profilo + upload CV |

### F7. Colloqui (da testare quando seed avra' interviews)

| # | Scenario | Utente | Steps | Risultato atteso |
|---|----------|--------|-------|-----------------|
| F7.1 | Schedula colloquio | Alice | Candidatura David → Schedule Interview | Form con data/ora/durata/provider |
| F7.2 | Lista colloqui | Alice | Dashboard → Interviews | Lista con upcoming interviews |
| F7.3 | Entra in room | Alice | Interview → Join | Video room (mock provider) con 2 partecipanti |
| F7.4 | Note colloquio | Alice | Room → apri notes | Panel note visibile, salvataggio funziona |
| F7.5 | Report AI | Alice | Room → Generate Report | Report markdown generato dalle note |
| F7.6 | Fine colloquio | Alice | Room → End Call | Status "completed", redirect, report generato |

### F8. Notifiche

| # | Scenario | Utente | Steps | Risultato atteso |
|---|----------|--------|-------|-----------------|
| F8.1 | Bell vuota | Nuovo utente | Click bell | "No notifications" |
| F8.2 | Notifica candidatura | Alice | Dopo che Charlie applica | Bell mostra notifica con badge count |
| F8.3 | Mark as read | Alice | Bell → click check | Notifica marcata, count decresce |
| F8.4 | Mark all read | Alice | Bell → "Mark all read" | Tutte marcate, badge scompare |
| F8.5 | Pagina notifiche | Alice | Bell → "View all" | Lista completa con delete |

### F9. Gestione team e membri

| # | Scenario | Utente | Steps | Risultato atteso |
|---|----------|--------|-------|-----------------|
| F9.1 | Lista membri | Alice (Acme) | Dashboard → Members | Alice (owner) + Bob (member) + Luca (owner) |
| F9.2 | Cambia ruolo | Alice | Members → Bob → cambia ruolo | Ruolo aggiornato |
| F9.3 | Invita membro | Alice | Members → Invite | Form invito email |
| F9.4 | Membro non puo' cambiare ruoli | Bob | Members → Alice | Nessun controllo di modifica visibile |
| F9.5 | Lista team | Alice | Dashboard → Teams | Engineering + Design |

### F10. Admin

| # | Scenario | Utente | Steps | Risultato atteso |
|---|----------|--------|-------|-----------------|
| F10.1 | Accesso admin | Luca | /admin | Dashboard admin visibile |
| F10.2 | Lista utenti | Luca | Admin → Users | 16 utenti con ruoli |
| F10.3 | Dettaglio utente | Luca | Users → click Charlie | Profilo + account collegati |
| F10.4 | Ban utente | Luca | Users → Charlie → Ban | Account bannato |
| F10.5 | Lista organizzazioni | Luca | Admin → Organizations | 3 org con dettagli |
| F10.6 | Non-admin bloccato | Alice | /admin | Redirect o errore 403 |
| F10.7 | Preview email | Luca | Admin → Settings → Email Previews | Template email visibili |

### F11. Permessi RBAC

| # | Scenario | Utente | Steps | Risultato atteso |
|---|----------|--------|-------|-----------------|
| F11.1 | Owner puo' tutto | Alice (Acme) | CRUD jobs, members, settings | Tutto funziona |
| F11.2 | Admin puo' gestire | Grace (Globex) | CRUD jobs, view members | Funziona |
| F11.3 | Member solo lettura | Bob (Acme) | View jobs, view members | Solo lettura, no create/edit |
| F11.4 | Member non vede settings | Bob | /dashboard/[orgId]/settings | 403 o redirect |
| F11.5 | Candidato non vede org dashboard | Charlie | /dashboard/[orgId] | Redirect |
| F11.6 | Cross-org isolation | Frank (Globex) | Prova accedere a Acme | 403 |

### F12. Flusso end-to-end completo

| # | Scenario | Steps |
|---|----------|-------|
| F12.1 | **Hiring completo** | Alice crea job → pubblica → Charlie vede e applica → Alice vede candidatura → genera match AI → schedula colloquio → fa colloquio → genera report → offerta → hired |
| F12.2 | **Candidato completo** | Registrazione → onboarding candidato → completa profilo → upload CV → cerca job → applica → riceve notifica status → colloquio → offerta |
| F12.3 | **Setup organizzazione** | Registrazione → onboarding business → crea org → invita membri → crea team → crea primo job → pubblica |

---

## Lacune del seed da colmare

Per testare tutti i flussi sopra, il seed dovrebbe aggiungere:

```
PRIORITA' ALTA:
- [ ] Almeno 2-3 interview (collegati alle candidature in status "interview")
- [ ] Alcune notification/communicationLog (per testare bell e lista)
- [ ] Un utente con ruolo "hr" in qualche org
- [ ] Un utente NON email-verified (per testare flusso verifica)

PRIORITA' MEDIA:
- [ ] Un utente NON onboarded (per testare onboarding flow)
- [ ] Almeno 1 candidateFile (per testare download/OCR)
- [ ] Alcune userSettings (per testare preferenze notifiche)
- [ ] Un invito pendente (per testare accept/reject)

PRIORITA' BASSA:
- [ ] Un utente bannato (per testare il blocco accesso)
- [ ] Job posting con embedding (per testare vector search/suggestions)
```

## Utenti consigliati da aggiungere al seed

| Email | Ruolo | Org | Scopo |
|-------|-------|-----|-------|
| `hr@acme.com` | user | Acme (hr) | Testare permessi HR |
| `newuser@test.com` | user | — | Non onboarded, per testare flusso onboarding |
| `unverified@test.com` | user | — | Email non verificata |
| `banned@test.com` | user | — | Account bannato |
