# Documentazione Webhook Polar (Pagamenti)

In HireFlow, la gestione dei pagamenti e degli abbonamenti è affidata a **Polar** (integrato tramite **Better Auth**). Non esiste una cartella dedicata `app/api/webhooks/stripe` perché la logica dei webhook è gestita direttamente dal plugin Polar di Better Auth all'interno della configurazione di autenticazione.

## Architettura

*   **Provider**: Polar.sh (che usa Stripe sottobanco)
*   **Integrazione**: `@polar-sh/better-auth` plugin
*   **File di configurazione**: `lib/auth.tsx`
*   **Endpoint Webhook**: Gestito automaticamente da Better Auth (tipicamente esposto sotto le rotte API di auth).

## Eventi Gestiti

La logica di risposta agli eventi Polar è definita in `lib/auth.tsx` all'interno della configurazione `betterAuth`.

### 1. onOrderPaid
Attivato quando un pagamento singolo viene completato con successo.
*   **Stato attuale**: Logica placeholder (predisposta per implementazioni future).

### 2. onSubscriptionActive
Attivato quando un abbonamento viene attivato o rinnovato.
*   **Azione**: Aggiorna lo stato dell'utente nel database locale (`user` table).
*   **Campi aggiornati**:
    *   `isPremium`: `true`
    *   `subscriptionStatus`: `"active"`
    *   `subscriptionId`: ID della sottoscrizione Polar
    *   `subscriptionPeriodEnd`: Data di fine periodo

### 3. onSubscriptionRevoked
Attivato quando un abbonamento viene cancellato o scade.
*   **Azione**: Revoca lo stato premium dell'utente nel database.
*   **Campi aggiornati**:
    *   `isPremium`: `false`
    *   `subscriptionStatus`: `"revoked"`
    *   `subscriptionId`: `null`
    *   `subscriptionPeriodEnd`: `null`

## Configurazione

Per far funzionare correttamente i webhook, sono necessarie le seguenti variabili d'ambiente nel file `.env`:

```env
# Polar Configuration
POLAR_ACCESS_TOKEN=polar_at_...
POLAR_WEBHOOK_SECRET=...     # Segreto per validare la firma dei webhook
POLAR_PRODUCT_ID=...         # ID del prodotto Pro su Polar
```

## Come testare

Poiché i webhook sono gestiti da Better Auth:
1.  Configura il webhook nella dashboard di Polar puntando all'URL della tua API di auth (es. `https://tuo-dominio.com/api/auth/webhook/polar` - *nota: verificare il path esatto nella documentazione di Better Auth*).
2.  Usa la CLI di Polar o la sandbox per simulare eventi di sottoscrizione.
3.  Verifica che il record utente nel database venga aggiornato correttamente.
