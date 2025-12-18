import { db } from "@/lib/db";
import { candidate } from "@/lib/db/schema";
import { generateEmbedding } from "@/lib/server/ai-actions";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { candidateId, skills, experience, summary, education } = body;

        if (!candidateId) {
            return NextResponse.json({ error: "Missing candidateId" }, { status: 400 });
        }

        // 1. Generate Embedding
        // We combine fields for a rich semantic representation
        // Handle both string or parsed JSON input
        const skillsStr = Array.isArray(skills) ? skills.join(", ") : (skills || "");
        const experienceStr = typeof experience === 'string' ? experience : JSON.stringify(experience);
        const summaryStr = summary || "";

        const textToEmbed = `
            Summary: ${summaryStr}
            Skills: ${skillsStr}
            Experience: ${experienceStr}
        `.trim();

        console.log(`Generating embedding for candidate ${candidateId}...`);
        const embedding = await generateEmbedding(textToEmbed);

        // 2. Save to DB
        // Ensure we store JSON strings as per schema
        await db.update(candidate)
            .set({
                skills: typeof skills === 'string' ? skills : JSON.stringify(skills),
                experience: typeof experience === 'string' ? experience : JSON.stringify(experience),
                education: typeof education === 'string' ? education : JSON.stringify(education),
                summary: summary,
                embedding: embedding,
                updatedAt: new Date()
            })
            .where(eq(candidate.id, candidateId));

        console.log(`Successfully updated candidate ${candidateId} with parsed data and embedding.`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in n8n webhook:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
