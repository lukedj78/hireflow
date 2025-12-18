import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { candidate, jobPosting } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-n8n-secret");
    if (secret !== process.env.N8N_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, id, data } = body;

    if (!id || !data) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (type === "candidate") {
      // data should contain skills, experience, education, summary
      await db.update(candidate)
        .set({
          skills: data.skills ? JSON.stringify(data.skills) : null,
          experience: data.experience ? JSON.stringify(data.experience) : null,
          education: data.education ? JSON.stringify(data.education) : null,
          summary: data.summary || null,
          updatedAt: new Date(),
        })
        .where(eq(candidate.id, id));
    } else if (type === "job") {
      // data should contain parsedRequirements
      await db.update(jobPosting)
        .set({
          parsedRequirements: data.parsedRequirements ? JSON.stringify(data.parsedRequirements) : null,
          updatedAt: new Date(),
        })
        .where(eq(jobPosting.id, id));
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
