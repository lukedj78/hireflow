import { Body, Button, Container, Head, Html, Preview, Section, Text } from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import { EmailHeader } from "./components/EmailHeader";
import { EmailFooter } from "./components/EmailFooter";

interface ApplicationStatusUpdateEmailProps {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  status: string;
  dashboardLink: string;
}

export default function ApplicationStatusUpdateEmail({ 
  candidateName = "Candidate", 
  jobTitle = "Software Engineer", 
  companyName = "Acme Inc.", 
  status = "screening",
  dashboardLink = "https://hireflow.com/dashboard" 
}: ApplicationStatusUpdateEmailProps) {
  
  const getStatusMessage = (status: string) => {
    switch(status) {
      case 'screening': return "Your application is now being reviewed by our team.";
      case 'interview': return "Great news! We'd like to invite you for an interview.";
      case 'offer': return "Congratulations! We are excited to offer you the position.";
      case 'hired': return "Welcome aboard! You have been hired.";
      case 'rejected': return "Thank you for your interest. Unfortunately, we have decided to proceed with other candidates.";
      default: return `Your application status has been updated to ${status}.`;
    }
  };

  const isPositive = ['screening', 'interview', 'offer', 'hired'].includes(status);
  const colorClass = isPositive ? "text-blue-700" : (status === 'rejected' ? "text-gray-700" : "text-blue-700");

  return (
    <Html>
      <Head />
      <Preview>Update on your application for {jobTitle}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 my-auto mx-auto font-sans">
          <Container className="bg-white border border-solid border-gray-200 rounded my-[40px] mx-auto p-[20px] w-full ">
            <EmailHeader />
            <Section className="mt-[32px] text-center">
              <Text className={`${colorClass} text-[24px] font-bold text-center p-0 my-[30px] mx-0 capitalize`}>
                Application Update: {status}
              </Text>
              <Text className="text-gray-700 text-[16px] leading-[24px] text-left">
                Hi {candidateName},
              </Text>
              <Text className="text-gray-700 text-[16px] leading-[24px] text-left">
                There has been an update to your application for <strong>{jobTitle}</strong> at <strong>{companyName}</strong>.
              </Text>
              <Text className="text-gray-700 text-[16px] leading-[24px] text-left font-medium">
                {getStatusMessage(status)}
              </Text>
              <Button
                className="bg-blue-700 rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3 mt-4"
                href={dashboardLink}
              >
                View Application
              </Button>
            </Section>
            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
