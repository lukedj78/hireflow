import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/lib/db/schema";
import {
  user,
  account,
  organization,
  organizationMember,
  organizationInvitation,
  team,
  teamMember,
  jobPosting,
  candidate,
  candidateFile,
  application,
  interview,
  communicationLog,
  userSettings,
} from "@/lib/db/schema";
import { nanoid } from "nanoid";
import * as dotenv from "dotenv";
import { hashPassword } from "better-auth/crypto";

dotenv.config();

async function seed() {
  console.log("🌱 Starting seed...");

  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    throw new Error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
  }

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const db = drizzle(client, { schema });

  try {
    // ── Cleanup ──
    console.log("🧹 Cleaning up...");
    await db.delete(communicationLog);
    await db.delete(interview);
    await db.delete(application);
    await db.delete(candidateFile);
    await db.delete(jobPosting);
    await db.delete(teamMember);
    await db.delete(team);
    await db.delete(organizationInvitation);
    await db.delete(organizationMember);
    await db.delete(candidate);
    await db.delete(userSettings);
    await db.delete(organization);
    await db.delete(account);
    await db.delete(user);

    const DEFAULT_PASSWORD = "Dg@123456";
    const now = new Date();
    const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
    const hoursFromNow = (n: number) => new Date(now.getTime() + n * 60 * 60 * 1000);

    // ══════════════════════════════════════════════════
    // 1. USERS (20)
    // ══════════════════════════════════════════════════
    console.log("👤 Creating users...");

    // IDs stabili per referenze
    const uid = {
      luca: nanoid(), luigi: nanoid(),
      alice: nanoid(), bob: nanoid(),
      frank: nanoid(), grace: nanoid(), heidi: nanoid(),
      ivan: nanoid(), judy: nanoid(), hannah: nanoid(),
      charlie: nanoid(), david: nanoid(), eve: nanoid(),
      kevin: nanoid(), laura: nanoid(), mike: nanoid(), nina: nanoid(),
      newUser: nanoid(), unverified: nanoid(), banned: nanoid(),
    };

    const users = [
      // ── Speciali ──
      { id: uid.luca, name: "Luca Digerlando", email: "lucadigerlando@gmail.com", role: "admin" as const, emailVerified: true, onboardingCompleted: true, onboardingType: "business" as const, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Luca" },
      { id: uid.luigi, name: "Luigi Test", email: "luigi@test.it", role: "candidate" as const, emailVerified: true, onboardingCompleted: true, onboardingType: "candidate" as const, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Luigi" },

      // ── Acme Corp ──
      { id: uid.alice, name: "Alice Admin", email: "alice@example.com", role: "business" as const, emailVerified: true, onboardingCompleted: true, onboardingType: "business" as const, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice" },
      { id: uid.bob, name: "Bob Member", email: "bob@example.com", role: "business" as const, emailVerified: true, onboardingCompleted: true, onboardingType: "business" as const, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob" },

      // ── Globex Corp ──
      { id: uid.frank, name: "Frank Globex", email: "frank@globex.com", role: "business" as const, emailVerified: true, onboardingCompleted: true, onboardingType: "business" as const, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Frank" },
      { id: uid.grace, name: "Grace Admin", email: "grace@globex.com", role: "business" as const, emailVerified: true, onboardingCompleted: true, onboardingType: "business" as const, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Grace" },
      { id: uid.heidi, name: "Heidi Member", email: "heidi@globex.com", role: "business" as const, emailVerified: true, onboardingCompleted: true, onboardingType: "business" as const, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Heidi" },

      // ── Soylent Corp ──
      { id: uid.ivan, name: "Ivan Soylent", email: "ivan@soylent.com", role: "business" as const, emailVerified: true, onboardingCompleted: true, onboardingType: "business" as const, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ivan" },
      { id: uid.judy, name: "Judy Member", email: "judy@soylent.com", role: "business" as const, emailVerified: true, onboardingCompleted: true, onboardingType: "business" as const, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Judy" },

      // ── Acme HR ──
      { id: uid.hannah, name: "Hannah HR", email: "hr@acme.com", role: "business" as const, emailVerified: true, onboardingCompleted: true, onboardingType: "business" as const, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Hannah" },

      // ── Candidati ──
      { id: uid.charlie, name: "Charlie Candidate", email: "charlie@example.com", role: "candidate" as const, emailVerified: true, onboardingCompleted: true, onboardingType: "candidate" as const, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie" },
      { id: uid.david, name: "David Candidate", email: "david@example.com", role: "candidate" as const, emailVerified: true, onboardingCompleted: true, onboardingType: "candidate" as const, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=David" },
      { id: uid.eve, name: "Eve Candidate", email: "eve@example.com", role: "candidate" as const, emailVerified: true, onboardingCompleted: true, onboardingType: "candidate" as const, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Eve" },
      { id: uid.kevin, name: "Kevin Candidate", email: "kevin@example.com", role: "candidate" as const, emailVerified: true, onboardingCompleted: true, onboardingType: "candidate" as const, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kevin" },
      { id: uid.laura, name: "Laura Candidate", email: "laura@example.com", role: "candidate" as const, emailVerified: true, onboardingCompleted: true, onboardingType: "candidate" as const, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura" },
      { id: uid.mike, name: "Mike Candidate", email: "mike@example.com", role: "candidate" as const, emailVerified: true, onboardingCompleted: true, onboardingType: "candidate" as const, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike" },
      { id: uid.nina, name: "Nina Candidate", email: "nina@example.com", role: "candidate" as const, emailVerified: true, onboardingCompleted: true, onboardingType: "candidate" as const, image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nina" },

      // ── Edge cases ──
      { id: uid.newUser, name: "New User", email: "newuser@test.com", role: "user" as const, emailVerified: true, onboardingCompleted: false, onboardingType: null, onboardingStep: 0, image: null },
      { id: uid.unverified, name: "Unverified User", email: "unverified@test.com", role: "user" as const, emailVerified: false, onboardingCompleted: false, onboardingType: null, image: null },
      { id: uid.banned, name: "Banned User", email: "banned@test.com", role: "user" as const, emailVerified: true, onboardingCompleted: true, onboardingType: "business" as const, banned: true, banReason: "Spam account", image: null },
    ];

    for (const u of users) {
      await db.insert(user).values(u).onConflictDoNothing();
      await db.insert(account).values({
        id: nanoid(), userId: u.id, accountId: u.email, providerId: "credential",
        password: await hashPassword(DEFAULT_PASSWORD),
        createdAt: now, updatedAt: now,
      });
    }

    // ══════════════════════════════════════════════════
    // 2. ORGANIZATIONS (3)
    // ══════════════════════════════════════════════════
    console.log("🏢 Creating organizations...");

    const oid = { acme: nanoid(), globex: nanoid(), soylent: nanoid() };

    await db.insert(organization).values([
      { id: oid.acme, name: "Acme Corp", slug: "acme-corp", logo: "https://api.dicebear.com/7.x/initials/svg?seed=AC" },
      { id: oid.globex, name: "Globex Corporation", slug: "globex-corp", logo: "https://api.dicebear.com/7.x/initials/svg?seed=GC" },
      { id: oid.soylent, name: "Soylent Corp", slug: "soylent-corp", logo: "https://api.dicebear.com/7.x/initials/svg?seed=SC" },
    ]);

    // ══════════════════════════════════════════════════
    // 3. ORG MEMBERS (10) — include HR role
    // ══════════════════════════════════════════════════
    console.log("👥 Adding org members...");

    await db.insert(organizationMember).values([
      { id: nanoid(), organizationId: oid.acme, userId: uid.luca, role: "owner" },
      { id: nanoid(), organizationId: oid.acme, userId: uid.alice, role: "owner" },
      { id: nanoid(), organizationId: oid.acme, userId: uid.bob, role: "member" },
      { id: nanoid(), organizationId: oid.acme, userId: uid.hannah, role: "member" }, // HR user
      { id: nanoid(), organizationId: oid.globex, userId: uid.frank, role: "owner" },
      { id: nanoid(), organizationId: oid.globex, userId: uid.grace, role: "admin" },
      { id: nanoid(), organizationId: oid.globex, userId: uid.heidi, role: "member" },
      { id: nanoid(), organizationId: oid.soylent, userId: uid.ivan, role: "owner" },
      { id: nanoid(), organizationId: oid.soylent, userId: uid.judy, role: "member" },
    ]);

    // ══════════════════════════════════════════════════
    // 4. INVITATIONS (2 pending)
    // ══════════════════════════════════════════════════
    console.log("✉️  Creating invitations...");

    await db.insert(organizationInvitation).values([
      { id: nanoid(), email: "newrecruiter@acme.com", role: "member", token: nanoid(), expiresAt: hoursFromNow(72), organizationId: oid.acme, inviterId: uid.alice },
      { id: nanoid(), email: "intern@globex.com", role: "member", token: nanoid(), expiresAt: hoursFromNow(48), organizationId: oid.globex, inviterId: uid.frank },
    ]);

    // ══════════════════════════════════════════════════
    // 5. TEAMS (7)
    // ══════════════════════════════════════════════════
    console.log("🏷️  Creating teams...");

    const tid = {
      acmeEng: nanoid(), acmeDesign: nanoid(),
      globexCypress: nanoid(), globexMktg: nanoid(), globexHR: nanoid(),
      soylentRD: nanoid(), soylentDist: nanoid(),
    };

    await db.insert(team).values([
      { id: tid.acmeEng, name: "Engineering", organizationId: oid.acme },
      { id: tid.acmeDesign, name: "Design", organizationId: oid.acme },
      { id: tid.globexCypress, name: "Cypress Creek Division", organizationId: oid.globex },
      { id: tid.globexMktg, name: "Marketing", organizationId: oid.globex },
      { id: tid.globexHR, name: "Human Resources", organizationId: oid.globex },
      { id: tid.soylentRD, name: "R&D", organizationId: oid.soylent },
      { id: tid.soylentDist, name: "Distribution", organizationId: oid.soylent },
    ]);

    await db.insert(teamMember).values([
      { id: nanoid(), teamId: tid.acmeEng, userId: uid.alice, role: "lead" },
      { id: nanoid(), teamId: tid.acmeDesign, userId: uid.bob, role: "member" },
      { id: nanoid(), teamId: tid.acmeEng, userId: uid.hannah, role: "member" },
      { id: nanoid(), teamId: tid.globexCypress, userId: uid.frank, role: "lead" },
      { id: nanoid(), teamId: tid.globexMktg, userId: uid.grace, role: "lead" },
      { id: nanoid(), teamId: tid.globexHR, userId: uid.heidi, role: "member" },
      { id: nanoid(), teamId: tid.soylentRD, userId: uid.ivan, role: "lead" },
      { id: nanoid(), teamId: tid.soylentDist, userId: uid.judy, role: "member" },
    ]);

    // ══════════════════════════════════════════════════
    // 6. JOB POSTINGS (14)
    // ══════════════════════════════════════════════════
    console.log("💼 Creating jobs...");

    const jid = {
      acmeFrontend: nanoid(), acmeDesigner: nanoid(), acmeBackend: nanoid(), acmeEngMgr: nanoid(), acmeQA: nanoid(),
      globexSafety: nanoid(), globexExec: nanoid(), globexMktg: nanoid(), globexPower: nanoid(), globexSecurity: nanoid(),
      soylentFood: nanoid(), soylentSupply: nanoid(), soylentTester: nanoid(), soylentLab: nanoid(),
    };

    const jobs = [
      { id: jid.acmeFrontend, title: "Senior Frontend Developer", slug: "senior-frontend-developer", organizationId: oid.acme, description: "We are looking for a Senior Frontend Developer with 5+ years of experience in React, TypeScript, and modern web technologies. You'll lead our product frontend, mentor juniors, and work closely with design.", location: "Remote", type: "remote" as const, salaryRange: "$120k - $150k", status: "published" as const },
      { id: jid.acmeDesigner, title: "Product Designer", slug: "product-designer", organizationId: oid.acme, description: "We need a Product Designer to own the end-to-end design process. You'll conduct user research, create wireframes and prototypes, and collaborate with engineering.", location: "New York, NY", type: "onsite" as const, salaryRange: "$100k - $130k", status: "published" as const },
      { id: jid.acmeBackend, title: "Backend Engineer", slug: "backend-engineer", organizationId: oid.acme, description: "Draft: Backend engineer for API development with Node.js and PostgreSQL.", location: "Remote", type: "remote" as const, salaryRange: "$130k - $160k", status: "draft" as const },
      { id: jid.acmeEngMgr, title: "Engineering Manager", slug: "engineering-manager", organizationId: oid.acme, description: "Leading the engineering team. Requires 3+ years management experience, strong technical background, and excellent communication skills.", location: "San Francisco, CA", type: "hybrid" as const, salaryRange: "$180k - $220k", status: "published" as const },
      { id: jid.acmeQA, title: "QA Engineer", slug: "qa-engineer", organizationId: oid.acme, description: "Ensuring quality across our products through manual and automated testing. Experience with Playwright or Cypress required.", location: "Remote", type: "remote" as const, salaryRange: "$90k - $110k", status: "published" as const },
      { id: jid.globexSafety, title: "Nuclear Safety Inspector", slug: "nuclear-safety-inspector", organizationId: oid.globex, description: "Monitoring safety protocols at the plant. Must have nuclear safety certification and 5+ years in the field.", location: "Springfield", type: "onsite" as const, salaryRange: "$60k - $90k", status: "published" as const },
      { id: jid.globexExec, title: "Executive Assistant", slug: "executive-assistant", organizationId: oid.globex, description: "Assisting the CEO with daily tasks, scheduling, and correspondence.", location: "Springfield", type: "onsite" as const, salaryRange: "$50k - $70k", status: "closed" as const },
      { id: jid.globexMktg, title: "Marketing Manager", slug: "marketing-manager", organizationId: oid.globex, description: "Leading marketing campaigns across digital channels. SEO, content strategy, and analytics experience required.", location: "Remote", type: "remote" as const, salaryRange: "$90k - $120k", status: "published" as const },
      { id: jid.globexPower, title: "Power Plant Technician", slug: "power-plant-technician", organizationId: oid.globex, description: "Maintenance of power plant equipment and systems.", location: "Springfield", type: "onsite" as const, salaryRange: "$55k - $75k", status: "published" as const },
      { id: jid.globexSecurity, title: "Security Guard", slug: "security-guard", organizationId: oid.globex, description: "Ensuring site security and monitoring access points.", location: "Springfield", type: "onsite" as const, salaryRange: "$40k - $50k", status: "published" as const },
      { id: jid.soylentFood, title: "Food Scientist", slug: "food-scientist", organizationId: oid.soylent, description: "Developing new nutritional products. PhD in food science or biochemistry preferred.", location: "San Francisco, CA", type: "hybrid" as const, salaryRange: "$110k - $140k", status: "published" as const },
      { id: jid.soylentSupply, title: "Supply Chain Manager", slug: "supply-chain-manager", organizationId: oid.soylent, description: "Managing global distribution and logistics operations.", location: "Remote", type: "remote" as const, salaryRange: "$100k - $130k", status: "published" as const },
      { id: jid.soylentTester, title: "Taste Tester", slug: "taste-tester", organizationId: oid.soylent, description: "Testing new flavor profiles and providing detailed sensory feedback.", location: "San Francisco, CA", type: "onsite" as const, salaryRange: "$45k - $60k", status: "published" as const },
      { id: jid.soylentLab, title: "Lab Assistant", slug: "lab-assistant", organizationId: oid.soylent, description: "Assisting in the research lab with experiments and data collection.", location: "San Francisco, CA", type: "onsite" as const, salaryRange: "$50k - $65k", status: "published" as const },
    ];

    for (const job of jobs) {
      await db.insert(jobPosting).values(job);
    }

    // ══════════════════════════════════════════════════
    // 7. CANDIDATES (8 profiles)
    // ══════════════════════════════════════════════════
    console.log("📋 Creating candidate profiles...");

    const cid = {
      charlie: nanoid(), david: nanoid(), eve: nanoid(), kevin: nanoid(),
      laura: nanoid(), mike: nanoid(), nina: nanoid(), luigi: nanoid(),
    };

    const candidates = [
      { id: cid.charlie, userId: uid.charlie, name: "Charlie Candidate", email: "charlie@example.com", phone: "+1234567890", skills: JSON.stringify(["React", "TypeScript", "Next.js", "TailwindCSS", "GraphQL"]), experience: JSON.stringify([{ company: "Tech Corp", role: "Frontend Developer", startDate: "2020-03", endDate: "2023-06", description: "Built React SPAs and migrated legacy jQuery codebase" }, { company: "StartupXYZ", role: "Junior Developer", startDate: "2018-09", endDate: "2020-02", description: "Full-stack web development" }]), education: JSON.stringify([{ institution: "MIT", degree: "BS Computer Science", startDate: "2014", endDate: "2018" }]), summary: "Passionate frontend developer with 5 years of React experience. Strong in TypeScript and modern CSS.", yearsOfExperience: 5, seniority: "Senior" },
      { id: cid.david, userId: uid.david, name: "David Candidate", email: "david@example.com", phone: "+0987654321", skills: JSON.stringify(["Figma", "UI/UX", "User Research", "Prototyping", "Design Systems"]), experience: JSON.stringify([{ company: "Design Studio", role: "Senior Designer", startDate: "2021-01", endDate: "2024-01", description: "Led product design for B2B SaaS" }]), education: JSON.stringify([{ institution: "RISD", degree: "BA Industrial Design", startDate: "2017", endDate: "2021" }]), summary: "Creative product designer with strong user research skills.", yearsOfExperience: 3, seniority: "Mid" },
      { id: cid.eve, userId: uid.eve, name: "Eve Candidate", email: "eve@example.com", phone: "+1122334455", skills: JSON.stringify(["Node.js", "Python", "AWS", "PostgreSQL", "Docker"]), experience: JSON.stringify([{ company: "Cloud Inc", role: "Backend Engineer", startDate: "2019-06", endDate: "2024-01", description: "Microservices architecture and API design" }]), education: JSON.stringify([{ institution: "Stanford", degree: "MS Computer Science", startDate: "2017", endDate: "2019" }]), summary: "Backend engineer specialized in distributed systems and cloud infrastructure.", yearsOfExperience: 5, seniority: "Senior" },
      { id: cid.kevin, userId: uid.kevin, name: "Kevin Candidate", email: "kevin@example.com", phone: "+5544332211", skills: JSON.stringify(["Nuclear Physics", "Safety Protocols", "OSHA Compliance", "Risk Assessment"]), experience: JSON.stringify([{ company: "Springfield Power Plant", role: "Safety Inspector", startDate: "2015-01", endDate: "2020-12", description: "Led safety audits and compliance reviews" }, { company: "NRC Consulting", role: "Junior Inspector", startDate: "2012-06", endDate: "2014-12", description: "Federal safety inspections" }]), education: JSON.stringify([{ institution: "State University", degree: "BS Nuclear Engineering", startDate: "2008", endDate: "2012" }]), summary: "Experienced safety inspector with nuclear certification. 8+ years in the field.", yearsOfExperience: 8, seniority: "Senior" },
      { id: cid.laura, userId: uid.laura, name: "Laura Candidate", email: "laura@example.com", phone: "+6677889900", skills: JSON.stringify(["Marketing Strategy", "SEO", "Content Marketing", "Google Analytics", "HubSpot"]), experience: JSON.stringify([{ company: "Digital Agency", role: "Marketing Lead", startDate: "2019-03", endDate: "2024-01", description: "Managed campaigns with $500K+ budget" }]), summary: "Marketing professional with 5 years experience leading digital campaigns.", yearsOfExperience: 5, seniority: "Mid" },
      { id: cid.mike, userId: uid.mike, name: "Mike Candidate", email: "mike@example.com", phone: "+9988776655", skills: JSON.stringify(["Chemistry", "Biology", "Nutrition Science", "Lab Equipment", "HACCP"]), experience: JSON.stringify([{ company: "BioLabs", role: "Research Scientist", startDate: "2018-01", endDate: "2022-12", description: "Developed plant-based protein formulations" }]), education: JSON.stringify([{ institution: "UC Berkeley", degree: "PhD Biochemistry", startDate: "2014", endDate: "2018" }]), summary: "Food scientist focused on sustainable nutrition. Published 12 research papers.", yearsOfExperience: 6, seniority: "Senior" },
      { id: cid.nina, userId: uid.nina, name: "Nina Candidate", email: "nina@example.com", phone: "+1112223333", skills: JSON.stringify(["Logistics", "Supply Chain", "SAP", "Lean Six Sigma", "Procurement"]), experience: JSON.stringify([{ company: "Global Logistics Inc", role: "Supply Chain Manager", startDate: "2017-06", endDate: "2024-01", description: "Managed $10M annual procurement budget" }]), summary: "Supply chain expert with Lean Six Sigma certification.", yearsOfExperience: 7, seniority: "Senior" },
      { id: cid.luigi, userId: uid.luigi, name: "Luigi Test", email: "luigi@test.it", phone: "+390000000000", skills: JSON.stringify(["Testing", "QA", "Automation"]), summary: "Test candidate for E2E testing.", yearsOfExperience: 1, seniority: "Junior" },
    ];

    for (const c of candidates) {
      await db.insert(candidate).values(c).onConflictDoNothing();
    }

    // ══════════════════════════════════════════════════
    // 8. APPLICATIONS (15)
    // ══════════════════════════════════════════════════
    console.log("📨 Creating applications...");

    const aid = {
      charlieFrontend: nanoid(), eveFrontend: nanoid(), davidDesigner: nanoid(),
      charlieEngMgr: nanoid(), kevinQA: nanoid(),
      kevinSafety: nanoid(), lauraMktg: nanoid(), charlieMktg: nanoid(),
      kevinPower: nanoid(), kevinSecurity: nanoid(),
      mikeFood: nanoid(), ninaSupply: nanoid(), kevinSupply: nanoid(),
      kevinTester: nanoid(), mikeLab: nanoid(),
    };

    const apps = [
      // Acme
      { id: aid.charlieFrontend, jobPostingId: jid.acmeFrontend, candidateId: cid.charlie, status: "screening" as const, aiScore: 85, aiAnalysis: JSON.stringify({ pros: ["Strong React/TS skills", "5 years experience"], cons: ["No lead experience"], skills_matched: ["React", "TypeScript", "Next.js"] }) },
      { id: aid.eveFrontend, jobPostingId: jid.acmeFrontend, candidateId: cid.eve, status: "applied" as const, aiScore: 60 },
      { id: aid.davidDesigner, jobPostingId: jid.acmeDesigner, candidateId: cid.david, status: "interview" as const, aiScore: 90, aiFeedback: "Excellent portfolio with strong B2B SaaS design experience" },
      { id: aid.charlieEngMgr, jobPostingId: jid.acmeEngMgr, candidateId: cid.charlie, status: "rejected" as const, aiScore: 45, aiFeedback: "Not enough management experience for this senior role" },
      { id: aid.kevinQA, jobPostingId: jid.acmeQA, candidateId: cid.kevin, status: "applied" as const, aiScore: 55 },
      // Globex
      { id: aid.kevinSafety, jobPostingId: jid.globexSafety, candidateId: cid.kevin, status: "hired" as const, aiScore: 95, aiFeedback: "Perfect match: nuclear certification + 8 years experience" },
      { id: aid.lauraMktg, jobPostingId: jid.globexMktg, candidateId: cid.laura, status: "offer" as const, aiScore: 88, aiAnalysis: JSON.stringify({ pros: ["Strong SEO", "$500K campaign experience"], cons: ["Remote only preference"], skills_matched: ["SEO", "Content Marketing", "Google Analytics"] }) },
      { id: aid.charlieMktg, jobPostingId: jid.globexMktg, candidateId: cid.charlie, status: "rejected" as const, aiScore: 40, aiFeedback: "No marketing experience — frontend developer background" },
      { id: aid.kevinPower, jobPostingId: jid.globexPower, candidateId: cid.kevin, status: "screening" as const, aiScore: 75 },
      { id: aid.kevinSecurity, jobPostingId: jid.globexSecurity, candidateId: cid.kevin, status: "applied" as const, aiScore: 60 },
      // Soylent
      { id: aid.mikeFood, jobPostingId: jid.soylentFood, candidateId: cid.mike, status: "screening" as const, aiScore: 82 },
      { id: aid.ninaSupply, jobPostingId: jid.soylentSupply, candidateId: cid.nina, status: "interview" as const, aiScore: 91, aiFeedback: "Excellent logistics background with Lean Six Sigma" },
      { id: aid.kevinSupply, jobPostingId: jid.soylentSupply, candidateId: cid.kevin, status: "applied" as const, aiScore: 30 },
      { id: aid.kevinTester, jobPostingId: jid.soylentTester, candidateId: cid.kevin, status: "offer" as const, aiScore: 88, aiFeedback: "Great enthusiasm for food quality" },
      { id: aid.mikeLab, jobPostingId: jid.soylentLab, candidateId: cid.mike, status: "interview" as const, aiScore: 85 },
    ];

    await db.insert(application).values(apps);

    // ══════════════════════════════════════════════════
    // 9. INTERVIEWS (5)
    // ══════════════════════════════════════════════════
    console.log("🎥 Creating interviews...");

    const iid = {
      davidDesigner: nanoid(), ninaSupply: nanoid(), mikeLab: nanoid(),
      kevinSafety: nanoid(), lauraMktg: nanoid(),
    };

    await db.insert(interview).values([
      // David — interview for Product Designer at Acme (upcoming)
      {
        id: iid.davidDesigner, applicationId: aid.davidDesigner, organizerId: uid.alice, candidateId: cid.david, jobId: jid.acmeDesigner,
        startTime: hoursFromNow(26), endTime: hoursFromNow(27),
        status: "scheduled", location: "Video Call", meetingProvider: "mock", meetingLink: `/room/${iid.davidDesigner}`,
      },
      // Nina — interview for Supply Chain at Soylent (upcoming)
      {
        id: iid.ninaSupply, applicationId: aid.ninaSupply, organizerId: uid.ivan, candidateId: cid.nina, jobId: jid.soylentSupply,
        startTime: hoursFromNow(50), endTime: hoursFromNow(51),
        status: "scheduled", location: "Video Call", meetingProvider: "mock", meetingLink: `/room/${iid.ninaSupply}`,
      },
      // Mike — interview for Lab Assistant at Soylent (upcoming)
      {
        id: iid.mikeLab, applicationId: aid.mikeLab, organizerId: uid.ivan, candidateId: cid.mike, jobId: jid.soylentLab,
        startTime: hoursFromNow(74), endTime: hoursFromNow(75),
        status: "scheduled", location: "Video Call", meetingProvider: "mock", meetingLink: `/room/${iid.mikeLab}`,
      },
      // Kevin — completed interview for Safety Inspector at Globex (with notes + report)
      {
        id: iid.kevinSafety, applicationId: aid.kevinSafety, organizerId: uid.frank, candidateId: cid.kevin, jobId: jid.globexSafety,
        startTime: daysAgo(10), endTime: daysAgo(10),
        status: "completed", location: "Springfield Office", meetingProvider: "mock",
        notes: "Kevin demonstrated excellent knowledge of nuclear safety protocols. He answered all technical questions correctly and showed strong situational awareness. Concern: tends to be very detail-oriented which could slow down routine inspections.",
        feedbackReport: "## Interview Report\n\n**Date:** " + daysAgo(10).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + "\n**Interviewer:** Frank Globex\n\n### Summary\nKevin is a highly qualified candidate for the Nuclear Safety Inspector role. He demonstrated deep expertise in safety protocols and compliance frameworks.\n\n### Strengths\n- Nuclear safety certification (current)\n- 8 years of hands-on inspection experience\n- Excellent knowledge of OSHA and NRC regulations\n\n### Areas for Development\n- Could improve efficiency in routine inspection workflows\n\n### Recommendation\n**Strong Hire** — Kevin is the ideal candidate for this position.",
      },
      // Laura — cancelled interview for Marketing at Globex
      {
        id: iid.lauraMktg, applicationId: aid.lauraMktg, organizerId: uid.grace, candidateId: cid.laura, jobId: jid.globexMktg,
        startTime: daysAgo(5), endTime: daysAgo(5),
        status: "cancelled", location: "Video Call", meetingProvider: "mock",
      },
    ]);

    // ══════════════════════════════════════════════════
    // 10. NOTIFICATIONS / COMMUNICATION LOG (12)
    // ══════════════════════════════════════════════════
    console.log("🔔 Creating notifications...");

    await db.insert(communicationLog).values([
      // Alice (Acme) notifications
      { id: nanoid(), type: "notification", userId: uid.alice, candidateId: cid.charlie, jobPostingId: jid.acmeFrontend, subject: "New application received", content: "Charlie Candidate applied for Senior Frontend Developer", createdAt: daysAgo(7) },
      { id: nanoid(), type: "notification", userId: uid.alice, candidateId: cid.eve, jobPostingId: jid.acmeFrontend, subject: "New application received", content: "Eve Candidate applied for Senior Frontend Developer", createdAt: daysAgo(5) },
      { id: nanoid(), type: "notification", userId: uid.alice, candidateId: cid.david, jobPostingId: jid.acmeDesigner, subject: "New application received", content: "David Candidate applied for Product Designer", createdAt: daysAgo(4), readAt: daysAgo(4) },
      { id: nanoid(), type: "email", userId: uid.alice, candidateId: cid.david, jobPostingId: jid.acmeDesigner, subject: "Interview scheduled", content: "Interview with David Candidate scheduled for tomorrow", metadata: JSON.stringify({ jobTitle: "Product Designer", organizationName: "Acme Corp" }), createdAt: daysAgo(2), readAt: daysAgo(2) },
      { id: nanoid(), type: "interest", userId: uid.alice, candidateId: cid.charlie, jobPostingId: jid.acmeFrontend, subject: "High match alert", content: "Charlie Candidate scored 85% match for Senior Frontend Developer", metadata: JSON.stringify({ jobTitle: "Senior Frontend Developer", organizationName: "Acme Corp", score: 85 }), createdAt: daysAgo(6) },

      // Charlie (candidate) notifications
      { id: nanoid(), type: "notification", userId: uid.charlie, jobPostingId: jid.acmeFrontend, subject: "Application received", content: "Your application for Senior Frontend Developer at Acme Corp has been received", createdAt: daysAgo(7), readAt: daysAgo(7) },
      { id: nanoid(), type: "notification", userId: uid.charlie, jobPostingId: jid.acmeFrontend, subject: "Application status updated", content: "Your application is now in screening", createdAt: daysAgo(3) },
      { id: nanoid(), type: "notification", userId: uid.charlie, jobPostingId: jid.acmeEngMgr, subject: "Application not selected", content: "Unfortunately, your application for Engineering Manager was not selected", createdAt: daysAgo(1), readAt: daysAgo(1) },

      // Frank (Globex) notifications
      { id: nanoid(), type: "interest", userId: uid.frank, candidateId: cid.kevin, jobPostingId: jid.globexSafety, subject: "Perfect match found!", content: "Kevin Candidate scored 95% match for Nuclear Safety Inspector", metadata: JSON.stringify({ jobTitle: "Nuclear Safety Inspector", organizationName: "Globex Corporation", score: 95 }), createdAt: daysAgo(15), readAt: daysAgo(15) },

      // Kevin (candidate) notifications
      { id: nanoid(), type: "notification", userId: uid.kevin, jobPostingId: jid.globexSafety, subject: "Congratulations!", content: "You've been hired as Nuclear Safety Inspector at Globex Corporation", createdAt: daysAgo(8), readAt: daysAgo(8) },
      { id: nanoid(), type: "notification", userId: uid.kevin, jobPostingId: jid.soylentTester, subject: "Job offer received", content: "You've received an offer for Taste Tester at Soylent Corp", createdAt: daysAgo(2) },

      // Ivan (Soylent) notification
      { id: nanoid(), type: "notification", userId: uid.ivan, candidateId: cid.nina, jobPostingId: jid.soylentSupply, subject: "Interview reminder", content: "Interview with Nina Candidate for Supply Chain Manager is in 2 days", createdAt: daysAgo(0) },
    ]);

    // ══════════════════════════════════════════════════
    // 11. USER SETTINGS (4)
    // ══════════════════════════════════════════════════
    console.log("⚙️  Creating user settings...");

    await db.insert(userSettings).values([
      { userId: uid.alice, emailNotifications: true, inAppNotifications: true },
      { userId: uid.charlie, emailNotifications: true, inAppNotifications: true },
      { userId: uid.bob, emailNotifications: false, inAppNotifications: true },
      { userId: uid.kevin, emailNotifications: true, inAppNotifications: false },
    ]);

    // ══════════════════════════════════════════════════
    // DONE
    // ══════════════════════════════════════════════════
    console.log("✅ Seed completed!");
    console.log(`
    ═══════════════════════════════════════════════════
    🔑 PASSWORD FOR ALL USERS: ${DEFAULT_PASSWORD}
    ═══════════════════════════════════════════════════

    ADMIN:
      lucadigerlando@gmail.com (admin, Acme owner)

    ACME CORP:
      alice@example.com    (owner)
      bob@example.com      (member)
      hr@acme.com          (member — HR user)

    GLOBEX CORP:
      frank@globex.com     (owner)
      grace@globex.com     (admin)
      heidi@globex.com     (member)

    SOYLENT CORP:
      ivan@soylent.com     (owner)
      judy@soylent.com     (member)

    CANDIDATES:
      luigi@test.it        (test candidate)
      charlie@example.com  (frontend — 3 applications)
      david@example.com    (design — 1 app, interview scheduled)
      eve@example.com      (backend — 1 app)
      kevin@example.com    (safety — 5 apps, 1 hired!)
      laura@example.com    (marketing — 1 app, offer)
      mike@example.com     (science — 2 apps, 2 interviews)
      nina@example.com     (supply chain — 1 app, interview)

    EDGE CASES:
      newuser@test.com     (not onboarded — tests onboarding flow)
      unverified@test.com  (email not verified — tests verification)
      banned@test.com      (banned account — tests access block)

    SEED DATA:
      20 users, 3 orgs, 10 org members, 2 pending invitations
      7 teams, 8 team members, 14 jobs (1 draft, 1 closed)
      8 candidate profiles, 15 applications
      5 interviews (3 upcoming, 1 completed with report, 1 cancelled)
      12 notifications (mix of read/unread)
      4 user settings
    `);

  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
