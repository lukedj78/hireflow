import { cn } from "@/lib/utils"

interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  maxWidth?: "default" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full"
}

export function PageLayout({ 
  children, 
  className, 
  maxWidth = "7xl",
  ...props 
}: PageLayoutProps) {
  return (
    <div 
      className={cn(
        "mx-auto w-full py-8 px-4 md:px-8 space-y-8",
        maxWidth === "default" && "max-w-7xl",
        maxWidth === "7xl" && "max-w-7xl",
        maxWidth === "6xl" && "max-w-6xl",
        maxWidth === "5xl" && "max-w-5xl",
        maxWidth === "full" && "max-w-full",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
}
