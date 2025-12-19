import { Section, Text, Link, Hr } from "@react-email/components";
import React from "react";

export const EmailFooter = () => {
  return (
    <Section className="mt-[40px]">
      <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
      <Text className="text-[#666666] text-[12px] leading-[24px] text-center">
        © {new Date().getFullYear()} HireFlow. All rights reserved.
      </Text>
      <Text className="text-[#666666] text-[12px] leading-[24px] text-center">
        <Link href="https://hireflow.com/privacy" className="text-[#666666] underline">
          Privacy Policy
        </Link>{" "}
        •{" "}
        <Link href="https://hireflow.com/terms" className="text-[#666666] underline">
          Terms of Service
        </Link>
      </Text>
    </Section>
  );
};

export default EmailFooter;
