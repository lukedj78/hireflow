# Documentazione Webhook N8N

Questo documento descrive gli endpoint webhook utilizzati per l'integrazione con n8n in HireFlow.

Questi webhook permettono a n8n di aggiornare i dati nel database di HireFlow dopo aver eseguito elaborazioni asincrone (es. parsing CV con AI, arricchimento dati).

## Autenticazione

Tutti gli endpoint richiedono un'intestazione di sicurezza per verificare che la richiesta provenga da una fonte autorizzata (il workflow n8n).

*   **Header**: `x-n8n-secret`
*   **Valore**: Deve corrispondere alla variabile d'ambiente `N8N_WEBHOOK_SECRET` configurata nel progetto Next.js.

## Endpoints

### 1. Webhook Generico Aggiornamento Dati

Questo endpoint è utilizzato per aggiornamenti generici di candidati o job posting.

*   **URL**: `/api/webhooks/n8n`
*   **Metodo**: `POST`

#### Body Schema (JSON)

```json
{
  "type": "candidate" | "job",
  "id": "string", // ID del candidato o del job
  "data": {
    // Campi specifici in base al tipo
  }
}
```

#### Dettagli per `type: "candidate"`

Aggiorna i dati del profilo del candidato.

**Payload `data`:**
*   `skills`: Array di stringhe (o stringa)
*   `experience`: Oggetto/Array o stringa JSON
*   `education`: Oggetto/Array o stringa JSON
*   `summary`: Stringa

#### Dettagli per `type: "job"`

Aggiorna i requisiti analizzati di un annuncio di lavoro.

**Payload `data`:**
*   `parsedRequirements`: Oggetto/Array o stringa JSON

---

### 2. Webhook Parsing Candidato (con Embedding)

Questo endpoint è specifico per il completamento del flusso di parsing del CV di un candidato. Oltre a salvare i dati strutturati, **genera automaticamente un embedding vettoriale** per la ricerca semantica.

*   **URL**: `/api/webhooks/n8n/candidate-parsed`
*   **Metodo**: `POST`

#### Body Schema (JSON)

```json
{
  "candidateId": "string", // ID del candidato (obbligatorio)
  "skills": ["Skill 1", "Skill 2"] | "Skill 1, Skill 2",
  "experience": [...] | "...",
  "education": [...] | "...",
  "summary": "Riassunto del profilo..."
}
```

#### Funzionamento

1.  **Validazione**: Verifica la presenza di `candidateId` e del secret header.
2.  **Generazione Embedding**: Concatena `summary`, `skills` e `experience` per creare un testo rappresentativo e genera un vettore (embedding) utilizzando l'AI Gateway.
3.  **Salvataggio**: Aggiorna la tabella `candidate` con:
    *   Dati strutturati (`skills`, `experience`, `education`, `summary`)
    *   `embedding` vettoriale
    *   Timestamp `updatedAt`

## Configurazione n8n

Nei nodi HTTP Request di n8n, assicurati di configurare:

1.  **Method**: POST
2.  **URL**: `https://tuo-dominio.com/api/webhooks/n8n` o `/api/webhooks/n8n/candidate-parsed`
3.  **Authentication**: Header Auth
4.  **Header Name**: `x-n8n-secret`
5.  **Header Value**: Il valore del tuo secret (es. `my-super-secret-key`)
