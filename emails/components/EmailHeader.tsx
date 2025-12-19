import { HeadCircuitIcon } from "@phosphor-icons/react/dist/ssr";
import { Section, Text } from "@react-email/components";
import React from "react";

export const EmailHeader = () => {
  return (
    <Section className="mt-[20px] mb-[20px]">
      <div className="text-center">
        <Text className="text-[24px] font-bold m-0 p-0 flex gap-2 items-center">
          <HeadCircuitIcon className="h-8 w-8" />
          HireFlow
        </Text>
      </div>
    </Section>
  );
};

export default EmailHeader;
