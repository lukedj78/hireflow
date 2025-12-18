import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr"

export default function DashboardLoading() {
    return (
        <div className="flex h-full w-full items-center justify-center p-8">
            <CircleNotchIcon className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    )
}
