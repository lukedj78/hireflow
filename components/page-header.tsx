import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface PageHeaderProps {
    title: React.ReactNode;
    description?: React.ReactNode;
    backHref?: string;
    actions?: React.ReactNode;
    className?: string;
}

export function PageHeader({
    title,
    description,
    backHref,
    actions,
    className,
}: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6", className)}>
            <div className="flex items-center gap-4">
                {backHref && (
                    <Link
                        href={backHref}
                        className={buttonVariants({ variant: "ghost", size: "icon" })}
                    >
                        <ArrowLeftIcon className="h-4 w-4" />
                    </Link>
                )}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                    {description && (
                        <p className="text-muted-foreground">{description}</p>
                    )}
                </div>
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}
