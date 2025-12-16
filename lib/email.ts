import { Resend } from "resend";
import * as React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: React.ReactElement;
}) => {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "no-reply@hireflow.com",
    to,
    subject,
    react,
  });
};
