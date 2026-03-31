# AI Models — Decisioni e costi

> Ultimo aggiornamento: 31/03/2026

## Modelli in uso

| Task | Modello | Provider | File | Motivo |
|------|---------|----------|------|--------|
| OCR CV | `mistral-ocr-latest` | Mistral API diretta | `ai-actions.ts` | Unica opzione OCR a questo prezzo (~$0.01/pag) |
| Parsing CV | `mistral-small-latest` | Vercel AI SDK | `ai-actions.ts` | Estrazione strutturata semplice, small basta |
| Parsing job description | `mistral-small-latest` | Vercel AI SDK | `ai-actions.ts` | Estrazione campi da testo, bassa complessita' |
| Match analysis | `gpt-4o-mini` | Vercel AI SDK | `ai-actions.ts` | Score + pro/contro, non serve reasoning forte |
| Report colloquio | `mistral-small-latest` | Vercel AI SDK | `ai-actions.ts` | Riassunto note in report markdown |
| Embeddings | `text-embedding-3-small` | Vercel AI SDK (OpenAI) | `ai-actions.ts` | Miglior rapporto qualita'/prezzo per embeddings |
| Agente job creation | `mistral-large-latest` | Vercel AI SDK | `ai-job-agent.tsx` | Tool calling richiede reasoning forte |

## Costi stimati (100 candidature/giorno)

| Task | Volume/giorno | Costo/call | Costo/giorno |
|------|---------------|------------|--------------|
| OCR CV | ~100 | ~$0.01 | ~$1.00 |
| Parsing CV | ~100 | ~$0.0003 | ~$0.03 |
| Match analysis | ~100 | ~$0.001 | ~$0.10 |
| Report colloqui | ~10 | ~$0.0003 | ~$0.003 |
| Agente job | ~5 | ~$0.01 | ~$0.05 |
| Embeddings | ~200 | ~$0.00002 | ~$0.004 |
| **Totale** | | | **~$1.19/giorno (~$36/mese)** |

## Perche' non un modello unico per tutto

- **Mistral Small** basta per estrazione strutturata (parsing) e riassunti (report) — usare Large sarebbe 20x piu' caro senza beneficio
- **GPT-4o-mini** basta per scoring/analisi strutturata — GPT-4o sarebbe 15x piu' caro per qualita' marginalmente superiore
- **Mistral Large** serve solo per l'agente conversazionale con tool calling — i modelli small non gestiscono bene loop multi-step con tool
- **Embeddings OpenAI** sono 5x piu' economici di Mistral Embed e la qualita' e' equivalente

## Quando rivalutare

- Se la **qualita' del parsing CV** peggiora su CV complessi → provare `mistral-medium-latest`
- Se il **match score** non correla con le assunzioni effettive → provare `gpt-4o` o `claude-3.5-sonnet`
- Se Mistral rilascia **modelli piu' capaci a prezzo small** → consolidare su Mistral
- Se il volume supera **1000 candidature/giorno** → valutare self-hosted (Ollama/vLLM) per parsing ed embeddings

## Storico cambiamenti

| Data | Cambio | Motivo |
|------|--------|--------|
| 31/03/2026 | `mistral-large` → `mistral-small` per parsing CV, report, job description | Risparmio ~20x, qualita' equivalente |
| 31/03/2026 | `gpt-4o` → `gpt-4o-mini` per match analysis | Risparmio ~15x, qualita' sufficiente |
