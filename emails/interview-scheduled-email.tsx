import { Body, Button, Container, Head, Html, Preview, Section, Text } from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import { EmailHeader } from "./components/EmailHeader";
import { EmailFooter } from "./components/EmailFooter";

interface InterviewScheduledEmailProps {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  interviewDate: string;
  interviewLink?: string;
  location?: string;
  isCandidate?: boolean;
  dashboardLink?: string;
}

export default function InterviewScheduledEmail({ 
  candidateName = "John Doe",
  jobTitle = "Software Engineer", 
  companyName = "Acme Inc",
  interviewDate = "Monday, January 12th at 10:00 AM",
  interviewLink,
  location,
  isCandidate = true,
  dashboardLink = "https://hireflow.com/dashboard"
}: InterviewScheduledEmailProps) {
  
  const title = isCandidate 
    ? `Interview Scheduled: ${jobTitle}`
    : `Interview Scheduled: ${candidateName}`;

  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 my-auto mx-auto font-sans">
          <Container className="bg-white border border-solid border-gray-200 rounded my-[40px] mx-auto p-[20px] w-full ">
            <EmailHeader />
            <Section className="mt-[32px] text-center">
              <Text className="text-blue-700 text-[24px] font-bold text-center p-0 my-[30px] mx-0">
                Interview Confirmed
              </Text>
              <Text className="text-gray-700 text-[16px] leading-[24px] text-left">
                Hi {candidateName},
              </Text>
              <Text className="text-gray-700 text-[16px] leading-[24px] text-left">
                An interview has been scheduled for the <strong>{jobTitle}</strong> position at <strong>{companyName}</strong>.
              </Text>
              
              <Section className="bg-blue-50 p-4 rounded-lg my-4 text-left border-l-4 border-blue-500">
                <Text className="text-blue-900 text-[14px] font-bold m-0 uppercase tracking-wide">
                  When
                </Text>
                <Text className="text-gray-800 text-[16px] m-0 mb-4">
                  {interviewDate}
                </Text>

                <Text className="text-blue-900 text-[14px] font-bold m-0 uppercase tracking-wide">
                  Where
                </Text>
                <Text className="text-gray-800 text-[16px] m-0">
                  {interviewLink ? "Video Call" : (location || "TBD")}
                </Text>
              </Section>

              {interviewLink && (
                <Button
                  className="bg-green-600 rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3 mt-4 mr-2"
                  href={interviewLink}
                >
                  Join Meeting
                </Button>
              )}

              <Button
                className="bg-blue-700 rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3 mt-4"
                href={dashboardLink}
              >
                View Details
              </Button>
            </Section>
            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
