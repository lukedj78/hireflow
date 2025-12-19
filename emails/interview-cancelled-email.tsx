import { Body, Button, Container, Head, Html, Preview, Section, Text } from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import { EmailHeader } from "./components/EmailHeader";
import { EmailFooter } from "./components/EmailFooter";

interface InterviewCancelledEmailProps {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  interviewDate: string;
}

export default function InterviewCancelledEmail({ 
  candidateName = "John", 
  jobTitle = "Software Engineer", 
  companyName = "Acme Inc",
  interviewDate = "October 24, 2024 at 10:00 AM",
}: InterviewCancelledEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Interview Cancelled: {jobTitle}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 my-auto mx-auto font-sans">
          <Container className="bg-white border border-solid border-gray-200 rounded my-[40px] mx-auto p-[20px] w-full ">
            <EmailHeader />
            <Section className="mt-[32px] text-center">
              <Text className="text-red-600 text-[24px] font-bold text-center p-0 my-[30px] mx-0">
                Interview Cancelled
              </Text>
              <Text className="text-gray-700 text-[16px] leading-[24px] text-left">
                Hi {candidateName},
              </Text>
              <Text className="text-gray-700 text-[16px] leading-[24px] text-left">
                The interview for <strong>{jobTitle}</strong> at <strong>{companyName}</strong> scheduled for {interviewDate} has been cancelled.
              </Text>
              <Text className="text-gray-700 text-[16px] leading-[24px] text-left">
                Please check your dashboard for any updates or reach out to the team if you have questions.
              </Text>
            </Section>
            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
