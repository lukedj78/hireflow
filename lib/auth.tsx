import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";
import { eq } from "drizzle-orm"
// import { randomUUID } from "crypto";
import { sendEmail } from "./email";
import VerificationEmail from "@/emails/verification-email";
import ResetPasswordEmail from "@/emails/reset-password-email";
import InvitationEmail from "@/emails/invitation-email";
import { ac, adminRole, userRole, businessRole, candidateRole, orgOwnerRole, orgAdminRole, orgMemberRole, orgHRRole } from "./permissions";
import { admin } from "better-auth/plugins";
import { organization } from "better-auth/plugins";
import { APIError } from "better-auth/api";
import { polar, checkout, portal, usage, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { user, session, account, verification, organization as organizationSchema, organizationMember, organizationInvitation, team, teamMember } from "@/lib/db/schema";

interface TeamContext {
    team: {
        name: string;
        id?: string;
    };
    teamId?: string;
    member?: {
        userId: string;
        id?: string;
    };
    memberId?: string;
}

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: 'sandbox'
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
        user,
        session,
        account,
        verification,
        organization: organizationSchema,
        member: organizationMember,
        invitation: organizationInvitation,
        team,
        teamMember
    }
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async (data) => {
      await sendEmail({
        to: data.user.email,
        subject: "Reset Your Password",
        react: <ResetPasswordEmail resetLink={data.url} />,
      });
    },
  },
  plugins: [
    nextCookies(),
    admin({
      defaultRole: "user",
      adminRole: "admin",
      ac,
      roles: {
          user: userRole,
          admin: adminRole,
          business: businessRole,
          candidate: candidateRole
      }
    }),
    organization({
      ac,
      roles: {
          owner: orgOwnerRole,
          admin: orgAdminRole,
          member: orgMemberRole,
          hr: orgHRRole
      },
      async sendInvitationEmail(data) {
        const inviteLink = `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL}/accept-invitation/${data.id}`;
        await sendEmail({
            to: data.email,
            subject: `You've been invited to join ${data.organization.name}`,
            react: <InvitationEmail 
                inviteLink={inviteLink}
                invitedByUsername={data.inviter.user.name}
                invitedByEmail={data.inviter.user.email}
                teamName={data.organization.name}
            />
        });
      },
      teams: {
        enabled: true,
      },
      organizationHooks: {
        beforeCreateOrganization: async (ctx) => {
            // Error handling: throwing APIError prevents organization creation and returns error to client
            if (ctx.organization.name === "Forbidden") {
                throw new APIError("BAD_REQUEST", { message: "Organization name is forbidden" });
            }
            console.log("Creating organization:", ctx.organization.name);
        },
        afterCreateOrganization: async (ctx) => {
            console.log("Organization created:", ctx.organization.slug);
        },
        beforeUpdateOrganization: async (ctx) => {
            console.log("Updating organization:", ctx.organization.slug);
        },
        afterUpdateOrganization: async (ctx) => {
            console.log("Organization updated:", ctx.organization?.slug);
        },
        beforeDeleteOrganization: async (ctx) => {
            console.log("Deleting organization:", ctx.organization.slug);
        },
        afterDeleteOrganization: async (ctx) => {
            console.log("Organization deleted:", ctx.organization?.slug);
        },
        beforeAddMember: async (ctx) => {
            console.log("Adding member:", ctx.member.userId);
        },
        afterAddMember: async (ctx) => {
            console.log("Member added:", ctx.member?.id);
        },
        beforeUpdateMemberRole: async (ctx) => {
            console.log("Updating member role:", ctx.member.role);
        },
        afterUpdateMemberRole: async (ctx) => {
            console.log("Member role updated:", ctx.member?.id);
        },
        beforeRemoveMember: async (ctx) => {
            console.log("Removing member:", ctx.member.userId);
        },
        afterRemoveMember: async (ctx) => {
            console.log("Member removed:", ctx.member?.id);
        },
        beforeCreateInvitation: async (ctx) => {
            console.log("Creating invitation for:", ctx.invitation.email);
        },
        afterCreateInvitation: async (ctx) => {
            console.log("Invitation created:", ctx.invitation?.id);
        },
        beforeCancelInvitation: async (ctx) => {
            console.log("Cancelling invitation:", ctx.invitation.id);
        },
        afterCancelInvitation: async (ctx) => {
            console.log("Invitation cancelled:", ctx.invitation?.id);
        },
        beforeAcceptInvitation: async (ctx) => {
            console.log("Accepting invitation:", ctx.invitation.id);
        },
        afterAcceptInvitation: async (ctx) => {
            console.log("Invitation accepted:", ctx.invitation?.id);
        },
        beforeRejectInvitation: async (ctx) => {
            console.log("Rejecting invitation:", ctx.invitation.id);
        },
        afterRejectInvitation: async (ctx) => {
            console.log("Invitation rejected:", ctx.invitation?.id);
        }
      },
      teamHooks: {
        beforeCreateTeam: async (ctx: TeamContext) => {
            console.log("Creating team:", ctx.team.name);
        },
        // ... other hooks can be used for business logic validation (e.g. subscription limits)
        // Note: RBAC permissions are automatically handled by the 'ac' plugin configuration.

        afterCreateTeam: async (ctx: TeamContext) => {
            console.log("Team created:", ctx.team?.id);
        },
        beforeUpdateTeam: async (ctx: TeamContext) => {
            console.log("Updating team:", ctx.teamId);
        },
        afterUpdateTeam: async (ctx: TeamContext) => {
            console.log("Team updated:", ctx.team?.id);
        },
        beforeDeleteTeam: async (ctx: TeamContext) => {
            console.log("Deleting team:", ctx.teamId);
        },
        afterDeleteTeam: async (ctx: TeamContext) => {
            console.log("Team deleted:", ctx.team?.id);
        },
        beforeAddTeamMember: async (ctx: TeamContext) => {
            if (ctx.member) console.log("Adding team member:", ctx.member.userId);
        },
        afterAddTeamMember: async (ctx: TeamContext) => {
            console.log("Team member added:", ctx.member?.id);
        },
        beforeRemoveTeamMember: async (ctx: TeamContext) => {
            console.log("Removing team member:", ctx.memberId);
        },
        afterRemoveTeamMember: async (ctx: TeamContext) => {
            console.log("Team member removed:", ctx.member?.id);
        }
      }
    }),
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      portal: {
        enabled: true
      },
      use: [
        checkout({
          products: [
            {
              productId: process.env.POLAR_PRODUCT_ID || "",
              slug: "pro"
            }
          ],
          successUrl: "/dashboard",
          authenticatedUsersOnly: true
        }),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET!,
          onOrderPaid: async (payload) => {
            if (payload.data.customerId) {
              // Logic for when an order is paid
            }
          },
          onSubscriptionActive: async (payload) => {
            const customerId = payload.data.customerId;
            try {
              const customer = await polarClient.customers.get({ id: customerId });
              const userId = customer.metadata?.external_id || customer.externalId;

              if (userId) {
                await db.update(user)
                  .set({
                    isPremium: true,
                    subscriptionStatus: "active",
                    subscriptionId: payload.data.id,
                    subscriptionPeriodEnd: new Date(payload.data.currentPeriodEnd || Date.now())
                  })
                  .where(eq(user.id, userId as string));
              }
            } catch (e) {
              console.error("Failed to update subscription status", e);
            }
          },
          onSubscriptionRevoked: async (payload) => {
            const customerId = payload.data.customerId;
            try {
              const customer = await polarClient.customers.get({ id: customerId });
              const userId = customer.metadata?.external_id || customer.externalId;

              if (userId) {
                await db.update(user)
                  .set({
                    isPremium: false,
                    subscriptionStatus: "revoked",
                    subscriptionId: null,
                    subscriptionPeriodEnd: null
                  })
                  .where(eq(user.id, userId as string));
              }
            } catch (e) {
              console.error("Failed to revoke subscription status", e);
            }
          }
        })
      ]
    })
  ],
  experimental: { joins: true },
  emailVerification: {
    sendVerificationEmail: async (data) => {
      await sendEmail({
        to: data.user.email,
        subject: "Verify your email address",
        react: <VerificationEmail verificationLink={data.url} />,
      });
    },
  },
});
