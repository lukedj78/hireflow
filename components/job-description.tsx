import { SparkleIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";

interface JobDescriptionProps {
  description: string;
  isAiGenerated?: boolean;
}

export function JobDescription({ description, isAiGenerated }: JobDescriptionProps) {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">About the role</h2>
        {isAiGenerated && (
          <Badge variant="secondary" className="gap-1 bg-info/10 text-info hover:bg-info/15">
            <SparkleIcon className="w-3 h-3" />
            AI Generated
          </Badge>
        )}
      </div>
      <div className="whitespace-pre-wrap">{description}</div>
    </div>
  );
}
