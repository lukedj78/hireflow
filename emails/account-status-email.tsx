import { Body, Button, Container, Head, Html, Preview, Section, Text } from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import EmailHeader from "./components/EmailHeader";
import EmailFooter from "./components/EmailFooter";

interface AccountStatusEmailProps {
  userName: string;
  type: 'banned' | 'unbanned';
  reason?: string;
  supportLink?: string;
}

export default function AccountStatusEmail({ 
  userName = "User", 
  type = "banned",
  reason,
  supportLink = "mailto:support@hireflow.com" 
}: AccountStatusEmailProps) {
  
  const isBanned = type === 'banned';
  const title = isBanned ? "Account Suspended" : "Account Reactivated";
  const colorClass = isBanned ? "text-red-600" : "text-green-600";
  const previewText = isBanned 
    ? "Important information regarding your HireFlow account status" 
    : "Your HireFlow account has been reactivated";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 my-auto mx-auto font-sans">
          <Container className="bg-white border border-solid border-gray-200 rounded my-[40px] mx-auto p-[20px] w-full ">
            <EmailHeader />
            <Section className="mt-[32px] text-center">
              <Text className={`${colorClass} text-[24px] font-bold text-center p-0 my-[30px] mx-0`}>
                {title}
              </Text>
              <Text className="text-gray-700 text-[16px] leading-[24px] text-left">
                Hi {userName},
              </Text>
              
              {isBanned ? (
                <>
                  <Text className="text-gray-700 text-[16px] leading-[24px] text-left">
                    Your account has been suspended due to a violation of our terms of service or administrative action.
                  </Text>
                  {reason && (
                    <Text className="text-gray-700 text-[16px] leading-[24px] text-left bg-gray-100 p-4 rounded border border-gray-200">
                      <strong>Reason:</strong> {reason}
                    </Text>
                  )}
                  <Text className="text-gray-700 text-[16px] leading-[24px] text-left mt-4">
                    If you believe this is a mistake, please contact our support team.
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-gray-700 text-[16px] leading-[24px] text-left">
                    Good news! Your account has been reactivated and you can now access HireFlow again.
                  </Text>
                  <Text className="text-gray-700 text-[16px] leading-[24px] text-left mt-4">
                    You can login immediately using the button below.
                  </Text>
                </>
              )}

              <Button
                className={`rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3 mt-6 ${isBanned ? 'bg-gray-600' : 'bg-blue-600'}`}
                href={isBanned ? supportLink : (process.env.NEXT_PUBLIC_APP_URL || "https://hireflow.com")}
              >
                {isBanned ? "Contact Support" : "Login to HireFlow"}
              </Button>
            </Section>
            <EmailFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
