import { Body, Button, Container, Head, Html, Preview, Section, Text } from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";

interface VerificationEmailProps {
  verificationLink: string;
}

export default function VerificationEmail({ verificationLink }: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Email Verification</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Section className="mt-[32px] text-center">
              <Text className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">Email Verification</Text>
              <Text className="text-black text-[14px] leading-[24px]">
                Click the button below to verify your email address.
              </Text>
              <Button
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={verificationLink}
              >
                Verify Email
              </Button>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
