import { Body, Button, Container, Head, Html, Preview, Section, Text } from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import { EmailHeader } from "./components/EmailHeader";
import { EmailFooter } from "./components/EmailFooter";

interface InterviewUpdatedEmailProps {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  oldDate: string;
  newDate: string;
  newLink?: string;
  newLocation?: string;
  dashboardLink?: string;
  type?: 'updated' | 'rescheduled';
}

export default function InterviewUpdatedEmail({ 
  candidateName = "John", 
  jobTitle = "Software Engineer", 
  companyName = "Acme Inc",
  oldDate = "Monday, January 12th at 10:00 AM",
  newDate = "Tuesday, January 13th at 2:00 PM",
  newLink,
  newLocation,
  dashboardLink = "https://hireflow.com/dashboard",
  type = 'updated'
}: InterviewUpdatedEmailProps) {
  
  const title = type === 'rescheduled' ? "Interview Rescheduled" : "Interview Updated";

  return (
    <Html>
      <Head />
      <Preview>{title}: {jobTitle}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 my-auto mx-auto font-sans">
          <Container className="bg-white border border-solid border-gray-200 rounded my-[40px] mx-auto p-[20px] w-full ">
            <EmailHeader />
            <Section className="mt-[32px] text-center">
              <Text className="text-orange-600 text-[24px] font-bold text-center p-0 my-[30px] mx-0">
                {title}
              </Text>
              <Text className="text-gray-700 text-[16px] leading-[24px] text-left">
                Hi {candidateName},
              </Text>
              <Text className="text-gray-700 text-[16px] leading-[24px] text-left">
                The interview details for <strong>{jobTitle}</strong> at <strong>{companyName}</strong> have been updated.
              </Text>
              
              <Section className="bg-orange-50 p-4 rounded-lg my-4 text-left border-l-4 border-orange-500">
                <Text className="text-orange-900 text-[14px] font-bold m-0 uppercase tracking-wide">
                  New Time
                </Text>
                <Text className="text-gray-800 text-[16px] m-0 mb-4">
                  {newDate}
                </Text>

                {newLocation && (
                    <>
                        <Text className="text-orange-900 text-[14px] font-bold m-0 uppercase tracking-wide">
                        New Location
                        </Text>
                        <Text className="text-gray-800 text-[16px] m-0 mb-4">
                        {newLocation}
                        </Text>
                    </>
                )}
              </Section>

              {newLink && (
                <Button
                  className="bg-green-600 rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3 mt-4 mr-2"
                  href={newLink}
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
