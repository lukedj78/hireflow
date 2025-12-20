"use server";

import {
  generateText,
  ModelMessage,
  tool,
  TextPart,
  ToolCallPart,
  ToolResultPart,
} from "ai";
import { mistral } from "@ai-sdk/mistral";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { jobPosting } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { JobDraft, FinalJobSchema } from "@/lib/job-schemas";
import { generateEmbedding } from "@/lib/server/ai-actions";

/* -------------------------------------------------
 * 1. Schemi
 * ------------------------------------------------- */

// Schemas imported from @/lib/job-schemas

/* -------------------------------------------------
 * 2. System Prompt
 * ------------------------------------------------- */

const SYSTEM_PROMPT = `
Sei un Recruiter AI per HireFlow.

Raccogli i dati UNO ALLA VOLTA:
1. Titolo
2. Descrizione
3. Location
4. Modalità (remote, onsite, hybrid)
5. Range salariale

Regole:
- Non chiedere dati già presenti
- Usa updateDraft quando un dato è confermato
- Usa finalizePosting SOLO su conferma finale
- Se proponi scelte multiple, aggiungi:
  ||OPTIONS: remote, onsite, hybrid||
`;

/* -------------------------------------------------
 * 3. Tool Schemas
 * ------------------------------------------------- */

const updateDraftSchema = z.object({
  field: z.enum(["title", "description", "location", "type", "salaryRange"]),
  value: z.string(),
});

type UpdateDraftInput = z.infer<typeof updateDraftSchema>;

const finalizePostingSchema = z.object({
  finalData: FinalJobSchema,
});

type FinalizePostingInput = z.infer<typeof finalizePostingSchema>;

/* -------------------------------------------------
 * 4. Server Action
 * ------------------------------------------------- */

export async function submitJobCreationMessage(
  input: string,
  history: { role: "user" | "assistant"; content: string }[],
  currentDraft: JobDraft,
  organizationId: string
) {
  try {
    /* ---------- Auth ---------- */
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) throw new Error("Unauthorized");

    /* ---------- Draft ---------- */
    const updatedDraft: JobDraft = { ...currentDraft };

    /* ---------- Messages ---------- */
    const messages: ModelMessage[] = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "system",
        content: `Current draft state:\n${JSON.stringify(updatedDraft, null, 2)}`,
      },
      ...history.map<ModelMessage>((m) => ({
        role: m.role,
        content: m.content,
      })),
      {
        role: "user",
        content: input,
      },
    ];

    /* -------------------------------------------------
     * 5. Tool Executors
     * ------------------------------------------------- */

    const updateDraftExecutor = async (
      input: UpdateDraftInput
    ): Promise<string> => {
      const { field, value } = input;

      if (field === "type") {
        updatedDraft.type = value.toLowerCase() as "remote" | "onsite" | "hybrid";
      } else {
        updatedDraft[field] = value;
      }

      return `Draft updated: ${field}`;
    };

    const finalizePostingExecutor = async (
      input: FinalizePostingInput
    ): Promise<string> => {
      const { finalData } = input;

      const jobId = nanoid();
      const slug = `${finalData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}-${nanoid(6)}`;

      // Generate embedding for the job posting
      const textToEmbed = `Title: ${finalData.title}\nDescription: ${finalData.description}\nLocation: ${finalData.location || "Not specified"}\nType: ${finalData.type}`;
      
      const embedding = await generateEmbedding(textToEmbed);

      await db.insert(jobPosting).values({
        id: jobId,
        organizationId,
        title: finalData.title,
        slug,
        description: finalData.description,
        location: finalData.location ?? null,
        type: finalData.type,
        salaryRange: finalData.salaryRange ?? null,
        status: "draft",
        embedding,
      });

      return "Job posting saved successfully.";
    };

    /* -------------------------------------------------
     * 6. Tool Definitions (AI)
     * ------------------------------------------------- */

    const tools = {
      updateDraft: tool({
        description: "Update a single field of the job draft.",
        inputSchema: updateDraftSchema,
      }),
      finalizePosting: tool({
        description: "Finalize and persist the job posting.",
        inputSchema: finalizePostingSchema,
      }),
    };

    /* -------------------------------------------------
     * 7. Agent Loop
     * ------------------------------------------------- */

    let lastMessage = "";
    let isFinalized = false;
    const MAX_STEPS = 6;

    for (let step = 0; step < MAX_STEPS; step++) {
      const result = await generateText({
        model: mistral("mistral-large-latest"),
        messages,
        tools,
      });

      lastMessage = result.text ?? "";

      if (!result.toolCalls || result.toolCalls.length === 0) break;

      /* ---------- Assistant message ---------- */
      const assistantParts: (TextPart | ToolCallPart)[] = [];

      if (result.text) {
        assistantParts.push({
          type: "text",
          text: result.text,
        });
      }

      for (const toolCall of result.toolCalls) {
        assistantParts.push({
          type: "tool-call",
          toolCallId: toolCall.toolCallId,
          toolName: toolCall.toolName,
          input: toolCall.input,
        });
      }

      messages.push({
        role: "assistant",
        content: assistantParts,
      });

      /* ---------- Tool execution ---------- */
      const toolResults: ToolResultPart[] = [];

      for (const toolCall of result.toolCalls) {
        if (toolCall.toolName === "updateDraft") {
          const output = await updateDraftExecutor(
            updateDraftSchema.parse(toolCall.input)
          );

          toolResults.push({
            type: "tool-result",
            toolCallId: toolCall.toolCallId,
            toolName: "updateDraft",
            output: {
              type: "text",
              value: typeof output === "string" ? output : JSON.stringify(output),
            },
          });
        }

        if (toolCall.toolName === "finalizePosting") {
          const output = await finalizePostingExecutor(
            finalizePostingSchema.parse(toolCall.input)
          );

          toolResults.push({
            type: "tool-result",
            toolCallId: toolCall.toolCallId,
            toolName: "finalizePosting",
            output: {
              type: "text",
              value: typeof output === "string" ? output : JSON.stringify(output),
            },
          });

          isFinalized = true;
        }
      }

      messages.push({
        role: "tool",
        content: toolResults,
      });

      if (isFinalized) break;
    }

    /* -------------------------------------------------
     * 8. Return
     * ------------------------------------------------- */

    return {
      message: lastMessage,
      draft: updatedDraft,
      isFinalized,
    };
  } catch (error) {
    console.error("Error in submitJobCreationMessage:", error);
    throw error;
  }
}
