import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/lib/db/schema";
import { 
  user, 
  account,
  organization, 
  organizationMember, 
  team, 
  teamMember, 
  jobPosting, 
  candidate, 
  application 
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
    // 0. Cleanup (Optional but recommended for idempotent seeding with random IDs)
    console.log("🧹 Cleaning up existing data...");
    await db.delete(application);
    await db.delete(jobPosting);
    await db.delete(teamMember);
    await db.delete(team);
    await db.delete(organizationMember);
    await db.delete(candidate);
    await db.delete(organization);
    await db.delete(account);
    await db.delete(user);
    console.log("Cleanup completed.");

    // 1. Create Users
    console.log("Creating users...");
    
    const users = [
      // Special Users (Requested by User)
      {
        id: nanoid(),
        name: "Luca Digerlando",
        email: "lucadigerlando@gmail.com",
        password: "Dg@123456",
        role: "admin" as const,
        emailVerified: true,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Luca",
        onboardingCompleted: true,
        onboardingType: "business" as const,
      },
      {
        id: nanoid(),
        name: "Luigi Test",
        email: "luigi@test.it",
        password: "Dg@123456",
        role: "candidate" as const,
        emailVerified: true,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Luigi",
        onboardingCompleted: true,
        onboardingType: "candidate" as const,
      },
      // Acme Corp Users
      {
        id: nanoid(),
        name: "Alice Admin",
        email: "alice@example.com",
        role: "user" as const,
        emailVerified: true,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
        onboardingCompleted: true,
        onboardingType: "business" as const,
      },
      {
        id: nanoid(),
        name: "Bob Member",
        email: "bob@example.com",
        role: "user" as const,
        emailVerified: true,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
        onboardingCompleted: true,
        onboardingType: "business" as const,
      },
      // Globex Corp Users
      {
        id: nanoid(),
        name: "Frank Globex",
        email: "frank@globex.com",
        role: "user" as const,
        emailVerified: true,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Frank",
        onboardingCompleted: true,
        onboardingType: "business" as const,
      },
      {
        id: nanoid(),
        name: "Grace Admin",
        email: "grace@globex.com",
        role: "user" as const,
        emailVerified: true,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Grace",
        onboardingCompleted: true,
        onboardingType: "business" as const,
      },
      {
        id: nanoid(),
        name: "Heidi Member",
        email: "heidi@globex.com",
        role: "user" as const,
        emailVerified: true,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Heidi",
        onboardingCompleted: true,
        onboardingType: "business" as const,
      },
      // Soylent Corp Users
      {
        id: nanoid(),
        name: "Ivan Soylent",
        email: "ivan@soylent.com",
        role: "user" as const,
        emailVerified: true,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ivan",
        onboardingCompleted: true,
        onboardingType: "business" as const,
      },
      {
        id: nanoid(),
        name: "Judy Member",
        email: "judy@soylent.com",
        role: "user" as const,
        emailVerified: true,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Judy",
        onboardingCompleted: true,
        onboardingType: "business" as const,
      },
      // Candidates
      {
        id: nanoid(),
        name: "Charlie Candidate",
        email: "charlie@example.com",
        role: "candidate" as const,
        emailVerified: true,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
        onboardingCompleted: true,
        onboardingType: "candidate" as const,
      },
      {
        id: nanoid(),
        name: "David Candidate",
        email: "david@example.com",
        role: "candidate" as const,
        emailVerified: true,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=David",
        onboardingCompleted: true,
        onboardingType: "candidate" as const,
      },
      {
        id: nanoid(),
        name: "Eve Candidate",
        email: "eve@example.com",
        role: "candidate" as const,
        emailVerified: true,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Eve",
        onboardingCompleted: true,
        onboardingType: "candidate" as const,
      },
      {
        id: nanoid(),
        name: "Kevin Candidate",
        email: "kevin@example.com",
        role: "candidate" as const,
        emailVerified: true,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kevin",
        onboardingCompleted: true,
        onboardingType: "candidate" as const,
      },
      {
        id: nanoid(),
        name: "Laura Candidate",
        email: "laura@example.com",
        role: "candidate" as const,
        emailVerified: true,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura",
        onboardingCompleted: true,
        onboardingType: "candidate" as const,
      },
      {
        id: nanoid(),
        name: "Mike Candidate",
        email: "mike@example.com",
        role: "candidate" as const,
        emailVerified: true,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
        onboardingCompleted: true,
        onboardingType: "candidate" as const,
      },
      {
        id: nanoid(),
        name: "Nina Candidate",
        email: "nina@example.com",
        role: "candidate" as const,
        emailVerified: true,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nina",
        onboardingCompleted: true,
        onboardingType: "candidate" as const,
      }
    ];

    const DEFAULT_PASSWORD = "Dg@123456";

    for (const u of users) {
      // password is not in schema but used for seed logic
      const { password, ...userData } = u;
      await db.insert(user).values(userData).onConflictDoNothing();
      
      const passwordToUse = password || DEFAULT_PASSWORD;
      const hashedPassword = await hashPassword(passwordToUse);
      
      await db.insert(account).values({
        id: nanoid(),
        userId: u.id,
        accountId: u.email,
        providerId: "credential",
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 2. Create Organizations
    console.log("Creating organizations...");
    
    // Acme Corp
    const acmeOrgId = nanoid();
    const acmeOrg = {
      id: acmeOrgId,
      name: "Acme Corp",
      slug: "acme-corp",
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=AC",
    };

    // Globex Corp
    const globexOrgId = nanoid();
    const globexOrg = {
      id: globexOrgId,
      name: "Globex Corporation",
      slug: "globex-corp",
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=GC",
    };

    // Soylent Corp
    const soylentOrgId = nanoid();
    const soylentOrg = {
      id: soylentOrgId,
      name: "Soylent Corp",
      slug: "soylent-corp",
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=SC",
    };

    await db.insert(organization).values([acmeOrg, globexOrg, soylentOrg]).onConflictDoNothing();

    // 3. Add Members to Organizations
    console.log("Adding members to organizations...");
    
    const orgMembers = [
      // Acme Corp Members
      { id: nanoid(), organizationId: acmeOrgId, userId: users[2].id, role: "owner" as const }, // Alice
      { id: nanoid(), organizationId: acmeOrgId, userId: users[3].id, role: "member" as const }, // Bob
      
      // Globex Corp Members
      { id: nanoid(), organizationId: globexOrgId, userId: users[4].id, role: "owner" as const }, // Frank
      { id: nanoid(), organizationId: globexOrgId, userId: users[5].id, role: "admin" as const }, // Grace
      { id: nanoid(), organizationId: globexOrgId, userId: users[6].id, role: "member" as const }, // Heidi
      
      // Soylent Corp Members
      { id: nanoid(), organizationId: soylentOrgId, userId: users[7].id, role: "owner" as const }, // Ivan
      { id: nanoid(), organizationId: soylentOrgId, userId: users[8].id, role: "member" as const }, // Judy
    ];

    await db.insert(organizationMember).values(orgMembers).onConflictDoNothing();

    // 4. Create Teams
    console.log("Creating teams...");
    
    // Acme Teams
    const acmeEngTeamId = nanoid();
    const acmeDesignTeamId = nanoid();
    
    // Globex Teams
    const globexCypressTeamId = nanoid();
    const globexMarketingTeamId = nanoid();
    const globexHRTeamId = nanoid();
    
    // Soylent Teams
    const soylentRDTeamId = nanoid();
    const soylentDistTeamId = nanoid();

    const teams = [
      // Acme
      { id: acmeEngTeamId, name: "Engineering", organizationId: acmeOrgId },
      { id: acmeDesignTeamId, name: "Design", organizationId: acmeOrgId },
      // Globex
      { id: globexCypressTeamId, name: "Cypress Creek Division", organizationId: globexOrgId },
      { id: globexMarketingTeamId, name: "Marketing", organizationId: globexOrgId },
      { id: globexHRTeamId, name: "Human Resources", organizationId: globexOrgId },
      // Soylent
      { id: soylentRDTeamId, name: "R&D", organizationId: soylentOrgId },
      { id: soylentDistTeamId, name: "Distribution", organizationId: soylentOrgId },
    ];

    await db.insert(team).values(teams).onConflictDoNothing();

    // 5. Add Team Members
    const teamMembers = [
      // Acme Team Members
      { id: nanoid(), teamId: acmeEngTeamId, userId: users[2].id, role: "lead" as const }, // Alice lead Eng
      { id: nanoid(), teamId: acmeDesignTeamId, userId: users[3].id, role: "member" as const }, // Bob member Design
      
      // Globex Team Members
      { id: nanoid(), teamId: globexCypressTeamId, userId: users[4].id, role: "lead" as const }, // Frank lead Cypress
      { id: nanoid(), teamId: globexMarketingTeamId, userId: users[5].id, role: "lead" as const }, // Grace lead Marketing
      { id: nanoid(), teamId: globexHRTeamId, userId: users[6].id, role: "member" as const }, // Heidi member HR
      
      // Soylent Team Members
      { id: nanoid(), teamId: soylentRDTeamId, userId: users[7].id, role: "lead" as const }, // Ivan lead R&D
      { id: nanoid(), teamId: soylentDistTeamId, userId: users[8].id, role: "member" as const }, // Judy member Dist
    ];

    await db.insert(teamMember).values(teamMembers).onConflictDoNothing();

    // 6. Create Job Postings
    console.log("Creating job postings...");
    
    const jobs = [
      // Acme Jobs
      {
        id: nanoid(),
        title: "Senior Frontend Developer",
        slug: "senior-frontend-developer",
        organizationId: acmeOrgId,
        description: "We are looking for a Senior Frontend Developer to join our team...",
        location: "Remote",
        type: "remote" as const,
        salaryRange: "$120k - $150k",
        status: "published" as const,
      },
      {
        id: nanoid(),
        title: "Product Designer",
        slug: "product-designer",
        organizationId: acmeOrgId,
        description: "We are looking for a Product Designer...",
        location: "New York, NY",
        type: "onsite" as const,
        salaryRange: "$100k - $130k",
        status: "published" as const,
      },
      {
        id: nanoid(),
        title: "Backend Engineer",
        slug: "backend-engineer",
        organizationId: acmeOrgId,
        description: "Draft job posting...",
        location: "Remote",
        type: "remote" as const,
        salaryRange: "$130k - $160k",
        status: "draft" as const,
      },
      {
        id: nanoid(),
        title: "Engineering Manager",
        slug: "engineering-manager",
        organizationId: acmeOrgId,
        description: "Leading the engineering team to new heights...",
        location: "San Francisco, CA",
        type: "hybrid" as const,
        salaryRange: "$180k - $220k",
        status: "published" as const,
      },
      {
        id: nanoid(),
        title: "QA Engineer",
        slug: "qa-engineer",
        organizationId: acmeOrgId,
        description: "Ensuring the quality of our products...",
        location: "Remote",
        type: "remote" as const,
        salaryRange: "$90k - $110k",
        status: "published" as const,
      },
      // Globex Jobs
      {
        id: nanoid(),
        title: "Nuclear Safety Inspector",
        slug: "nuclear-safety-inspector",
        organizationId: globexOrgId,
        description: "Monitoring safety protocols at the plant...",
        location: "Springfield",
        type: "onsite" as const,
        salaryRange: "$60k - $90k",
        status: "published" as const,
      },
      {
        id: nanoid(),
        title: "Executive Assistant",
        slug: "executive-assistant",
        organizationId: globexOrgId,
        description: "Assisting the CEO with daily tasks...",
        location: "Springfield",
        type: "onsite" as const,
        salaryRange: "$50k - $70k",
        status: "closed" as const,
      },
      {
        id: nanoid(),
        title: "Marketing Manager",
        slug: "marketing-manager",
        organizationId: globexOrgId,
        description: "Leading marketing campaigns...",
        location: "Remote",
        type: "remote" as const,
        salaryRange: "$90k - $120k",
        status: "published" as const,
      },
      {
        id: nanoid(),
        title: "Power Plant Technician",
        slug: "power-plant-technician",
        organizationId: globexOrgId,
        description: "Maintenance of power plant equipment...",
        location: "Springfield",
        type: "onsite" as const,
        salaryRange: "$55k - $75k",
        status: "published" as const,
      },
      {
        id: nanoid(),
        title: "Security Guard",
        slug: "security-guard",
        organizationId: globexOrgId,
        description: "Ensuring site security...",
        location: "Springfield",
        type: "onsite" as const,
        salaryRange: "$40k - $50k",
        status: "published" as const,
      },
      // Soylent Jobs
      {
        id: nanoid(),
        title: "Food Scientist",
        slug: "food-scientist",
        organizationId: soylentOrgId,
        description: "Developing new nutritional products...",
        location: "San Francisco, CA",
        type: "hybrid" as const,
        salaryRange: "$110k - $140k",
        status: "published" as const,
      },
      {
        id: nanoid(),
        title: "Supply Chain Manager",
        slug: "supply-chain-manager",
        organizationId: soylentOrgId,
        description: "Managing global distribution...",
        location: "Remote",
        type: "remote" as const,
        salaryRange: "$100k - $130k",
        status: "published" as const,
      },
      {
        id: nanoid(),
        title: "Taste Tester",
        slug: "taste-tester",
        organizationId: soylentOrgId,
        description: "Testing new flavor profiles...",
        location: "San Francisco, CA",
        type: "onsite" as const,
        salaryRange: "$45k - $60k",
        status: "published" as const,
      },
      {
        id: nanoid(),
        title: "Lab Assistant",
        slug: "lab-assistant",
        organizationId: soylentOrgId,
        description: "Assisting in the research lab...",
        location: "San Francisco, CA",
        type: "onsite" as const,
        salaryRange: "$50k - $65k",
        status: "published" as const,
      },
    ];

    for (const job of jobs) {
      await db.insert(jobPosting).values(job);
    }

    // 7. Create Candidates Profiles
    console.log("Creating candidate profiles...");
    
    // Helper to get user ID by index from the initial users array
    // users[2-8] are org members, users[9-15] are candidates
    const candidateUsers = users.slice(9);
    
    const candidatesData = [
      {
        id: nanoid(),
        userId: candidateUsers[0].id, // Charlie
        name: candidateUsers[0].name,
        email: candidateUsers[0].email,
        phone: "+1234567890",
        skills: JSON.stringify(["React", "TypeScript", "Next.js", "TailwindCSS"]),
        experience: JSON.stringify([{ company: "Tech Corp", role: "Frontend Dev", startDate: "2020", endDate: "2023", description: "Web dev" }]),
        education: JSON.stringify([{ school: "Uni Tech", degree: "BS CS", year: "2019" }]),
        summary: "Passionate frontend developer.",
      },
      {
        id: nanoid(),
        userId: candidateUsers[1].id, // David
        name: candidateUsers[1].name,
        email: candidateUsers[1].email,
        phone: "+0987654321",
        skills: JSON.stringify(["Figma", "UI/UX", "User Research"]),
        experience: JSON.stringify([{ company: "Design Studio", role: "Designer", startDate: "2021", endDate: "Present", description: "UI design" }]),
        education: JSON.stringify([{ school: "Design School", degree: "BA Design", year: "2021" }]),
        summary: "Creative designer.",
      },
      {
        id: nanoid(),
        userId: candidateUsers[2].id, // Eve
        name: candidateUsers[2].name,
        email: candidateUsers[2].email,
        phone: "+1122334455",
        skills: JSON.stringify(["Node.js", "Python", "AWS"]),
        summary: "Backend engineer.",
      },
      {
        id: nanoid(),
        userId: candidateUsers[3].id, // Kevin
        name: candidateUsers[3].name,
        email: candidateUsers[3].email,
        phone: "+5544332211",
        skills: JSON.stringify(["Nuclear Physics", "Safety Protocols", "Donut Eating"]),
        experience: JSON.stringify([{ company: "Power Plant", role: "Safety Inspector", startDate: "2015", endDate: "2020", description: "Safety checks" }]),
        summary: "Experienced safety inspector.",
      },
      {
        id: nanoid(),
        userId: candidateUsers[4].id, // Laura
        name: candidateUsers[4].name,
        email: candidateUsers[4].email,
        phone: "+6677889900",
        skills: JSON.stringify(["Marketing Strategy", "SEO", "Content Marketing"]),
        summary: "Marketing professional with 5 years experience.",
      },
      {
        id: nanoid(),
        userId: candidateUsers[5].id, // Mike
        name: candidateUsers[5].name,
        email: candidateUsers[5].email,
        phone: "+9988776655",
        skills: JSON.stringify(["Chemistry", "Biology", "Nutrition"]),
        experience: JSON.stringify([{ company: "BioLabs", role: "Researcher", startDate: "2018", endDate: "2022", description: "Lab research" }]),
        summary: "Food scientist focused on sustainability.",
      },
      {
        id: nanoid(),
        userId: candidateUsers[6].id, // Nina
        name: candidateUsers[6].name,
        email: candidateUsers[6].email,
        phone: "+1112223333",
        skills: JSON.stringify(["Logistics", "Supply Chain", "Management"]),
        summary: "Supply chain expert.",
      },
      // Luigi (Special)
      {
        id: nanoid(),
        userId: users[1].id, // Luigi
        name: users[1].name,
        email: users[1].email,
        phone: "+390000000000",
        skills: JSON.stringify(["Testing"]),
        summary: "Special test candidate.",
      }
    ];

    for (const c of candidatesData) {
      await db.insert(candidate).values(c).onConflictDoNothing();
    }

    // 8. Create Applications
    console.log("Creating applications...");
    
    // Map jobs to easy variables
    if (jobs.length < 14) throw new Error("Job creation failed: count mismatch");
    
    const jobAcmeFrontend = jobs[0]!;
    const jobAcmeDesigner = jobs[1]!;
    const jobAcmeBackend = jobs[2]!;
    const jobAcmeEngMgr = jobs[3]!;
    const jobAcmeQA = jobs[4]!;

    const jobGlobexSafety = jobs[5]!;
    const jobGlobexExec = jobs[6]!;
    const jobGlobexMarketing = jobs[7]!;
    const jobGlobexPower = jobs[8]!;
    const jobGlobexSecurity = jobs[9]!;

    const jobSoylentFood = jobs[10]!;
    const jobSoylentSupply = jobs[11]!;
    const jobSoylentTester = jobs[12]!;
    const jobSoylentLab = jobs[13]!;

    // Map candidates to easy variables
    const candCharlie = candidatesData[0];
    const candDavid = candidatesData[1];
    const candEve = candidatesData[2];
    const candKevin = candidatesData[3];
    const candLaura = candidatesData[4];
    const candMike = candidatesData[5];
    const candNina = candidatesData[6];
    const candLuigi = candidatesData[7];

    const apps = [
      // Acme Applications
      {
        id: nanoid(),
        jobPostingId: jobAcmeFrontend.id,
        candidateId: candCharlie.id,
        status: "screening" as const,
        aiScore: 85,
        aiAnalysis: JSON.stringify({ pros: ["React expert"], cons: ["No lead exp"], skills_matched: ["React"] })
      },
      {
        id: nanoid(),
        jobPostingId: jobAcmeFrontend.id,
        candidateId: candEve.id,
        status: "applied" as const,
        aiScore: 60,
      },
      {
        id: nanoid(),
        jobPostingId: jobAcmeDesigner.id,
        candidateId: candDavid.id,
        status: "interview" as const,
        aiScore: 90,
        aiFeedback: "Great portfolio",
      },
      {
        id: nanoid(),
        jobPostingId: jobAcmeEngMgr.id,
        candidateId: candCharlie.id,
        status: "rejected" as const,
        aiScore: 45,
        aiFeedback: "Not enough management experience",
      },
      {
        id: nanoid(),
        jobPostingId: jobAcmeQA.id,
        candidateId: candKevin.id,
        status: "applied" as const,
        aiScore: 55,
      },
      
      // Globex Applications
      {
        id: nanoid(),
        jobPostingId: jobGlobexSafety.id,
        candidateId: candKevin.id,
        status: "hired" as const,
        aiScore: 95,
        aiFeedback: "Perfect match for safety role.",
      },
      {
        id: nanoid(),
        jobPostingId: jobGlobexMarketing.id,
        candidateId: candLaura.id,
        status: "offer" as const,
        aiScore: 88,
        aiAnalysis: JSON.stringify({ pros: ["Strong SEO"], cons: ["Remote only"], skills_matched: ["SEO", "Marketing"] })
      },
      {
        id: nanoid(),
        jobPostingId: jobGlobexMarketing.id,
        candidateId: candCharlie.id, // Charlie applying to Marketing too? Why not.
        status: "rejected" as const,
        aiScore: 40,
        aiFeedback: "Not enough marketing experience.",
      },
      {
        id: nanoid(),
        jobPostingId: jobGlobexPower.id,
        candidateId: candKevin.id,
        status: "screening" as const,
        aiScore: 75,
      },
      {
        id: nanoid(),
        jobPostingId: jobGlobexSecurity.id,
        candidateId: candKevin.id, // Kevin really wants to work at Globex
        status: "applied" as const,
        aiScore: 60,
      },

      // Soylent Applications
      {
        id: nanoid(),
        jobPostingId: jobSoylentFood.id,
        candidateId: candMike.id,
        status: "screening" as const,
        aiScore: 82,
      },
      {
        id: nanoid(),
        jobPostingId: jobSoylentSupply.id,
        candidateId: candNina.id,
        status: "interview" as const,
        aiScore: 91,
        aiFeedback: "Excellent logistics background.",
      },
      {
        id: nanoid(),
        jobPostingId: jobSoylentSupply.id,
        candidateId: candKevin.id, // Kevin applying everywhere
        status: "applied" as const,
        aiScore: 30,
      },
      {
        id: nanoid(),
        jobPostingId: jobSoylentTester.id,
        candidateId: candKevin.id,
        status: "offer" as const,
        aiScore: 88,
        aiFeedback: "Great enthusiasm for food.",
      },
      {
        id: nanoid(),
        jobPostingId: jobSoylentLab.id,
        candidateId: candMike.id,
        status: "interview" as const,
        aiScore: 85,
      }
    ];

    await db.insert(application).values(apps);

    console.log("✅ Seed completed successfully!");
    console.log(`
    Credentials for testing:
    
    🔑 DEFAULT PASSWORD FOR ALL USERS: Dg@123456

    SPECIAL USERS:
    - Luca (Admin): lucadigerlando@gmail.com
    - Luigi (Candidate): luigi@test.it

    ACME CORP:
    - Owner: alice@example.com
    - Member: bob@example.com
    
    GLOBEX CORP:
    - Owner: frank@globex.com
    - Admin: grace@globex.com
    - Member: heidi@globex.com
    
    SOYLENT CORP:
    - Owner: ivan@soylent.com
    - Member: judy@soylent.com
    
    CANDIDATES:
    - charlie@example.com (Frontend)
    - david@example.com (Design)
    - eve@example.com (Backend)
    - kevin@example.com (Safety)
    - laura@example.com (Marketing)
    - mike@example.com (Science)
    - nina@example.com (Supply Chain)
    `);
    
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
