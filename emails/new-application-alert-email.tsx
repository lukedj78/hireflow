import { Body, Button, Container, Head, Html, Preview, Section, Text } from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import EmailHeader from "./components/EmailHeader";
import EmailFooter from "./components/EmailFooter";

interface NewApplicationAlertEmailProps {
  candidateName: string;
  jobTitle: string;
  applicationLink: string;
  matchScore?: number;
  candidateEmail?: string;
  candidatePhone?: string;
}

export default function NewApplicationAlertEmail({ 
  candidateName = "John Doe", 
  jobTitle = "Software Engineer", 
  applicationLink = "https://hireflow.com/dashboard",
  matchScore,
  candidateEmail,
  candidatePhone
}: NewApplicationAlertEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New candidate for {jobTitle}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 my-auto mx-auto font-sans">
          <Container className="bg-white border border-solid border-gray-200 rounded my-[40px] mx-auto p-[20px] w-full ">
            <EmailHeader />
            <Section className="mt-[32px] text-center">
              <Text className="text-blue-700 text-[24px] font-bold text-center p-0 my-[30px] mx-0">
                New Application
              </Text>
              <Text className="text-gray-700 text-[16px] leading-[24px] text-left">
                <strong>{candidateName}</strong> has just applied for the <strong>{jobTitle}</strong> position.
              </Text>
              
              <Section className="bg-gray-50 p-4 rounded-lg my-4 text-left">
                {candidateEmail && (
                  <Text className="text-gray-600 text-[14px] m-0">
                    Email: <span className="text-gray-900">{candidateEmail}</span>
                  </Text>
                )}
                {candidatePhone && (
                  <Text className="text-gray-600 text-[14px] m-0 mt-1">
                    Phone: <span className="text-gray-900">{candidatePhone}</span>
                  </Text>
                )}
              </Section>

              {matchScore !== undefined && (
                <Text className="text-gray-700 text-[16px] leading-[24px] text-left">
                  Initial AI Match Score: <strong>{matchScore}%</strong>
                </Text>
              )}

              <Button
                className="bg-blue-700 rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3 mt-4"
                href={applicationLink}
              >
                Review Application
              </Button>
            </Section>
            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
