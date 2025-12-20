"use server";

import { createElement } from "react";
import { render } from "@react-email/render";
import AccountStatusEmail from "@/emails/account-status-email";
import ApplicationReceivedEmail from "@/emails/application-received-email";
import ApplicationStatusUpdateEmail from "@/emails/application-status-update-email";
import HighMatchAlertEmail from "@/emails/high-match-alert-email";
import InterviewCancelledEmail from "@/emails/interview-cancelled-email";
import InterviewScheduledEmail from "@/emails/interview-scheduled-email";
import InterviewUpdatedEmail from "@/emails/interview-updated-email";
import InvitationEmail from "@/emails/invitation-email";
import NewApplicationAlertEmail from "@/emails/new-application-alert-email";
import ResetPasswordEmail from "@/emails/reset-password-email";
import VerificationEmail from "@/emails/verification-email";

// Define mock data for each email
const MOCK_DATA = {
    "account-status-banned": {
        component: AccountStatusEmail,
        props: {
            userName: "John Doe",
            type: "banned" as const,
            reason: "Violation of terms of service",
            supportLink: "https://hireflow.com/support"
        }
    },
    "account-status-unbanned": {
        component: AccountStatusEmail,
        props: {
            userName: "John Doe",
            type: "unbanned" as const,
            dashboardLink: "https://hireflow.com/dashboard"
        }
    },
    "application-received": {
        component: ApplicationReceivedEmail,
        props: {
            candidateName: "Alice Smith",
            jobTitle: "Senior Frontend Developer",
            companyName: "TechCorp Inc.",
            dashboardLink: "https://hireflow.com/dashboard"
        }
    },
    "application-status-update": {
        component: ApplicationStatusUpdateEmail,
        props: {
            candidateName: "Bob Jones",
            jobTitle: "Product Manager",
            companyName: "Innovate LLC",
            newStatus: "Interview",
            dashboardLink: "https://hireflow.com/dashboard"
        }
    },
    "high-match-alert": {
        component: HighMatchAlertEmail,
        props: {
            candidateName: "Sarah Connor",
            jobTitle: "Security Specialist",
            matchScore: 95,
            analysisSummary: "Exceptional match for security protocols and leadership experience.",
            applicationLink: "https://hireflow.com/dashboard/applications/123"
        }
    },
    "interview-cancelled": {
        component: InterviewCancelledEmail,
        props: {
            candidateName: "Michael Scott",
            jobTitle: "Regional Manager",
            companyName: "Dunder Mifflin",
            interviewDate: "October 24, 2025 at 2:00 PM",
            dashboardLink: "https://hireflow.com/dashboard"
        }
    },
    "interview-scheduled": {
        component: InterviewScheduledEmail,
        props: {
            candidateName: "Pam Beesly",
            jobTitle: "Office Administrator",
            companyName: "Dunder Mifflin",
            interviewDate: "October 25, 2025 at 10:00 AM",
            interviewLink: "https://meet.google.com/abc-defg-hij",
            interviewType: "video" as const
        }
    },
    "interview-updated": {
        component: InterviewUpdatedEmail,
        props: {
            candidateName: "Jim Halpert",
            jobTitle: "Sales Executive",
            companyName: "Dunder Mifflin",
            oldDate: "October 26, 2025 at 11:00 AM",
            newDate: "October 27, 2025 at 3:00 PM",
            interviewLink: "https://meet.google.com/xyz-uvw-rst",
            dashboardLink: "https://hireflow.com/dashboard"
        }
    },
    "invitation": {
        component: InvitationEmail,
        props: {
            username: "Dwight Schrute",
            invitedByUsername: "Michael Scott",
            invitedByEmail: "michael@dundermifflin.com",
            teamName: "Sales Team",
            inviteLink: "https://hireflow.com/invite/accept/123"
        }
    },
    "new-application-alert": {
        component: NewApplicationAlertEmail,
        props: {
            candidateName: "Ryan Howard",
            jobTitle: "Business Student",
            jobId: "job-123",
            applicationId: "app-456",
            dashboardLink: "https://hireflow.com/dashboard/jobs/job-123"
        }
    },
    "reset-password": {
        component: ResetPasswordEmail,
        props: {
            resetLink: "https://hireflow.com/auth/reset-password?token=xyz"
        }
    },
    "verification": {
        component: VerificationEmail,
        props: {
            verificationLink: "https://hireflow.com/auth/verify?token=abc"
        }
    }
};

export type EmailTemplateKey = keyof typeof MOCK_DATA;

export async function getEmailTemplatesListAction() {
    return Object.keys(MOCK_DATA) as EmailTemplateKey[];
}

export async function renderEmailPreviewAction(templateKey: string) {
    const template = MOCK_DATA[templateKey as EmailTemplateKey];
    
    if (!template) {
        return { success: false, error: "Template not found" };
    }

    try {
        const Component = template.component as React.ComponentType<typeof template.props>;
        const html = await render(createElement(Component, template.props));
        return { success: true, html };
    } catch (error) {
        console.error("Error rendering email:", error);
        return { success: false, error: "Failed to render email" };
    }
}
