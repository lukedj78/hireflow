import { Body, Button, Container, Head, Html, Preview, Section, Text } from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import { EmailHeader } from "./components/EmailHeader";
import { EmailFooter } from "./components/EmailFooter";

interface HighMatchAlertEmailProps {
  candidateName: string;
  jobTitle: string;
  matchScore: number;
  analysisSummary: string;
  applicationLink: string;
}

export default function HighMatchAlertEmail({ 
  candidateName = "Jane Doe", 
  jobTitle = "Senior Product Designer", 
  matchScore = 92,
  analysisSummary = "Strong match for required skills in UI/UX and Figma. Good experience level.",
  applicationLink = "https://hireflow.com/dashboard"
}: HighMatchAlertEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Top Talent Alert: {candidateName} ({matchScore.toString()}%)</Preview>
      <Tailwind>
        <Body className="bg-gray-50 my-auto mx-auto font-sans">
          <Container className="bg-white border border-solid border-gray-200 rounded my-[40px] mx-auto p-[20px] w-full ">
            <EmailHeader />
            <Section className="mt-[32px] text-center">
              <Text className="text-green-600 text-[24px] font-bold text-center p-0 my-[30px] mx-0">
                High Match Candidate! 🎯
              </Text>
              <Text className="text-gray-700 text-[16px] leading-[24px] text-left">
                We found a strong candidate for <strong>{jobTitle}</strong>.
              </Text>
              
              <Section className="bg-green-50 p-4 rounded-lg my-4 text-left">
                <Text className="text-green-800 text-[18px] font-bold m-0">
                  {candidateName}
                </Text>
                <Text className="text-green-700 text-[32px] font-bold m-0 mt-2">
                  {matchScore}% Match
                </Text>
                <Text className="text-green-800 text-[14px] mt-2">
                  {analysisSummary}
                </Text>
              </Section>

              <Button
                className="bg-blue-700 rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3 mt-4"
                href={applicationLink}
              >
                View Profile & Analysis
              </Button>
            </Section>
            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
