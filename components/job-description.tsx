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
          <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-700 hover:bg-blue-100/80 dark:bg-blue-900/30 dark:text-blue-400">
            <SparkleIcon className="w-3 h-3" />
            AI Generated
          </Badge>
        )}
      </div>
      <div className="whitespace-pre-wrap">{description}</div>
    </div>
  );
}
