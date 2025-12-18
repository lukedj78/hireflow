"use client"

import { Button, buttonVariants } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createOrganizationAction } from "@/lib/server/organization-actions"
import { PlusIcon, CircleNotchIcon } from "@phosphor-icons/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"

const createOrgSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    slug: z.string().min(2, "Slug must be at least 2 characters"),
})

type CreateOrgValues = z.infer<typeof createOrgSchema>

interface Organization {
    id: string
    name: string
    slug: string
    createdAt: Date
    logo?: string | null
}

export default function AdminOrganizationsClientPage({ initialOrgs: orgs }: { initialOrgs: Organization[] }) {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const form = useForm<CreateOrgValues>({
        resolver: zodResolver(createOrgSchema),
        defaultValues: {
            name: "",
            slug: "",
        },
    })

    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = form

    const onSubmit = async (data: CreateOrgValues) => {
        try {
            await createOrganizationAction(data)
            toast.success("Organization created successfully")
            setOpen(false)
            reset()
            router.refresh()
        } catch (error) {
            toast.error("Failed to create organization")
            console.error(error)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Organizations</h2>
                    <p className="text-muted-foreground">Manage all organizations.</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger render={
                        <Button variant="default">
                            <PlusIcon className="h-4 w-4" />
                            Add Organization
                        </Button>
                    }>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create Organization</DialogTitle>
                            <DialogDescription>
                                Add a new organization to the platform.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Acme Corp"
                                    {...register("name")}
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name.message}</p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="slug">Slug</Label>
                                <Input
                                    id="slug"
                                    placeholder="acme-corp"
                                    {...register("slug")}
                                />
                                {errors.slug && (
                                    <p className="text-sm text-destructive">{errors.slug.message}</p>
                                )}
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <CircleNotchIcon className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Organization
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Created At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orgs.map((org) => (
                            <TableRow key={org.id}>
                                <TableCell className="font-medium">
                                    <Link href={`/dashboard/${org.id}`} className={buttonVariants({ variant: "link" })}>
                                        {org.name}
                                    </Link>
                                </TableCell>
                                <TableCell>{org.slug}</TableCell>
                                <TableCell>
                                    {new Date(org.createdAt).toLocaleDateString()}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
