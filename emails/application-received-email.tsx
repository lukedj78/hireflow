import { Body, Button, Container, Head, Html, Preview, Section, Text, Link } from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import { EmailHeader } from "./components/EmailHeader";
import { EmailFooter } from "./components/EmailFooter";

interface ApplicationReceivedEmailProps {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  dashboardLink: string;
}

export default function ApplicationReceivedEmail({ 
  candidateName = "Candidate", 
  jobTitle = "Software Engineer", 
  companyName = "Acme Inc.", 
  dashboardLink = "https://hireflow.com/dashboard" 
}: ApplicationReceivedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>We received your application for {jobTitle}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 my-auto mx-auto font-sans">
          <Container className="bg-white border border-solid border-gray-200 rounded my-[40px] mx-auto p-[20px] w-full ">
            <EmailHeader />
            <Section className="mt-[32px] text-center">
              <Text className="text-blue-700 text-[24px] font-bold text-center p-0 my-[30px] mx-0">
                Application Received
              </Text>
              <Text className="text-gray-700 text-[16px] leading-[24px] text-left">
                Hi {candidateName},
              </Text>
              <Text className="text-gray-700 text-[16px] leading-[24px] text-left">
                Thanks for applying to the <strong>{jobTitle}</strong> position at <strong>{companyName}</strong>.
              </Text>
              <Text className="text-gray-700 text-[16px] leading-[24px] text-left">
                We have successfully received your application and our team will review it shortly. You can track the status of your application in your dashboard.
              </Text>
              <Button
                className="bg-blue-700 rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3 mt-4"
                href={dashboardLink}
              >
                View Application Status
              </Button>
            </Section>
            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
