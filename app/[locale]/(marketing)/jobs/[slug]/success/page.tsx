import { buttonVariants } from "@/components/ui/button";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default function SuccessPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="text-center space-y-4 max-w-md">
                <div className="flex justify-center">
                    <CheckCircleIcon className="w-16 h-16 text-green-500" />
                </div>
                <h1 className="text-3xl font-bold">Application Received!</h1>
                <p className="text-muted-foreground">
                    Thank you for applying. We have received your application and will review it shortly.
                </p>
                <div className="pt-4">
                    <Link href="/" className={buttonVariants()}>
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
