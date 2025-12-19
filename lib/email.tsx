import { Resend } from "resend";
import * as React from 'react';

import ApplicationReceivedEmail from "@/emails/application-received-email";
import NewApplicationAlertEmail from "@/emails/new-application-alert-email";
import ApplicationStatusUpdateEmail from "@/emails/application-status-update-email";
import HighMatchAlertEmail from "@/emails/high-match-alert-email";
import InterviewScheduledEmail from "@/emails/interview-scheduled-email";
import InterviewUpdatedEmail from "@/emails/interview-updated-email";
import InterviewCancelledEmail from "@/emails/interview-cancelled-email";
import AccountStatusEmail from "@/emails/account-status-email";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "HireFlow <no-reply@hireflow.com>";

export const sendEmail = async ({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: React.ReactElement;
}) => {
  if (!process.env.RESEND_API_KEY) {
    console.log("RESEND_API_KEY is not set. Email would have been sent to:", to, "Subject:", subject);
    return;
  }
  
  try {
    await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject,
        react,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
  }
};

export const sendApplicationReceivedEmail = async (to: string, props: React.ComponentProps<typeof ApplicationReceivedEmail>) => {
    return sendEmail({
        to,
        subject: `Application Received: ${props.jobTitle}`,
        react: <ApplicationReceivedEmail {...props} />
    });
};

export const sendNewApplicationAlertEmail = async (to: string, props: React.ComponentProps<typeof NewApplicationAlertEmail>) => {
    return sendEmail({
        to,
        subject: `New Application: ${props.candidateName} for ${props.jobTitle}`,
        react: <NewApplicationAlertEmail {...props} />
    });
};

export const sendApplicationStatusUpdateEmail = async (to: string, props: React.ComponentProps<typeof ApplicationStatusUpdateEmail>) => {
    return sendEmail({
        to,
        subject: `Update on your application for ${props.jobTitle}`,
        react: <ApplicationStatusUpdateEmail {...props} />
    });
};

export const sendHighMatchAlertEmail = async (to: string, props: React.ComponentProps<typeof HighMatchAlertEmail>) => {
    return sendEmail({
        to,
        subject: `High Match Alert: ${props.candidateName} (${props.matchScore}%)`,
        react: <HighMatchAlertEmail {...props} />
    });
};

export const sendInterviewScheduledEmail = async (to: string, props: React.ComponentProps<typeof InterviewScheduledEmail>) => {
    const isCandidate = props.isCandidate ?? true;
    const subject = isCandidate 
        ? `Interview Scheduled: ${props.jobTitle}`
        : `Interview Scheduled: ${props.candidateName}`;
    
    return sendEmail({
        to,
        subject,
        react: <InterviewScheduledEmail {...props} />
    });
};

export const sendInterviewUpdatedEmail = async (to: string, props: React.ComponentProps<typeof InterviewUpdatedEmail>) => {
    const title = props.type === 'rescheduled' ? "Interview Rescheduled" : "Interview Updated";
    return sendEmail({
        to,
        subject: `${title}: ${props.jobTitle}`,
        react: <InterviewUpdatedEmail {...props} />
    });
};

export const sendInterviewCancelledEmail = async (to: string, props: React.ComponentProps<typeof InterviewCancelledEmail>) => {
    return sendEmail({
        to,
        subject: `Interview Cancelled: ${props.jobTitle}`,
        react: <InterviewCancelledEmail {...props} />
    });
};

export const sendInvitationToApplyEmail = async (to: string, props: {
    candidateName: string;
    jobTitle: string;
    organizationName: string;
    message?: string;
}) => {
    return sendEmail({
        to,
        subject: `Invitation to Apply: ${props.jobTitle} at ${props.organizationName}`,
        react: (
            <div>
                <h1>Invitation to Apply</h1>
                <p>Hello {props.candidateName},</p>
                <p>We are interested in your profile for the <strong>{props.jobTitle}</strong> position at <strong>{props.organizationName}</strong>.</p>
                {props.message && (
                    <div style={{ margin: "20px 0", padding: "15px", backgroundColor: "#f3f4f6", borderRadius: "5px" }}>
                        <p style={{ fontStyle: "italic", margin: 0 }}>&quot;{props.message}&quot;</p>
                    </div>
                )}
                <p>Please log in to your account to view the job details and apply.</p>
                <p>Best regards,<br/>The {props.organizationName} Team</p>
            </div>
        )
    });
};

export const sendAccountStatusEmail = async (to: string, props: React.ComponentProps<typeof AccountStatusEmail>) => {
  const subject = props.type === 'banned' 
      ? "Important: Account Suspended" 
      : "Account Reactivated";
  
  return sendEmail({
      to,
      subject,
      react: <AccountStatusEmail {...props} />
  });
};
