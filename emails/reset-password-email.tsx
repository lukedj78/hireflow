import { Body, Button, Container, Head, Html, Preview, Section, Text } from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import { EmailHeader } from "./components/EmailHeader";
import { EmailFooter } from "./components/EmailFooter";

interface ResetPasswordEmailProps {
  resetLink: string;
}

export default function ResetPasswordEmail({ resetLink }: ResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset Your Password</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-full ">
            <EmailHeader />
            <Section className="mt-[32px] text-center">
              <Text className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">Reset Your Password</Text>
              <Text className="text-black text-[14px] leading-[24px]">
                Click the button below to reset your password.
              </Text>
              <Button
                className="bg-[#1D4ED8] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={resetLink}
              >
                Reset Password
              </Button>
            </Section>
            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
