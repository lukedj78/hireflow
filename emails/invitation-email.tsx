import { Body, Button, Container, Head, Html, Preview, Section, Text } from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import { EmailHeader } from "./components/EmailHeader";
import { EmailFooter } from "./components/EmailFooter";

interface InvitationEmailProps {
  inviteLink: string;
  invitedByUsername: string;
  invitedByEmail: string;
  teamName: string;
}

export default function InvitationEmail({ inviteLink, invitedByUsername, invitedByEmail, teamName }: InvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Join {teamName} on HireFlow</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-full ">
            <Section className="mt-[32px] text-center">
              <Text className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                Join {teamName}
              </Text>
              <Text className="text-black text-[14px] leading-[24px]">
                {invitedByUsername} ({invitedByEmail}) has invited you to join the organization <strong>{teamName}</strong> on HireFlow.
              </Text>
              <Button
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3 mt-4"
                href={inviteLink}
              >
                Accept Invitation
              </Button>
            </Section>
            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
