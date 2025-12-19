"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createInterviewAction } from "@/lib/server/interview-actions";
import { Form } from "@/components/ui/form";

const formSchema = z.object({
    date: z.date(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    duration: z.preprocess((val) => Number(val), z.number().min(15).max(240)),
    location: z.string().optional(),
    meetingLink: z.string().url("Invalid URL").optional().or(z.literal("")),
    notes: z.string().optional(),
});

interface ScheduleInterviewDialogProps {
    applicationId: string;
    candidateId: string;
    jobId: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function ScheduleInterviewDialog({
    applicationId,
    candidateId,
    jobId,
    open,
    onOpenChange,
}: ScheduleInterviewDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const show = open !== undefined ? open : isOpen;
    const setShow = onOpenChange || setIsOpen;

    const form = useForm<z.infer<typeof formSchema>>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            startTime: "",
            duration: 60,
            location: "Remote (Google Meet / Zoom)",
            meetingLink: "",
            notes: "",
        },
    });

    const isSubmitting = form.formState.isSubmitting;

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            // Combine date and time
            const [hours, minutes] = values.startTime.split(":").map(Number);
            const startDateTime = new Date(values.date);
            startDateTime.setHours(hours, minutes);

            const endDateTime = new Date(startDateTime);
            endDateTime.setMinutes(endDateTime.getMinutes() + values.duration);

            const result = await createInterviewAction({
                applicationId,
                candidateId,
                jobId,
                startTime: startDateTime,
                endTime: endDateTime,
                location: values.location,
                meetingLink: values.meetingLink || undefined,
                notes: values.notes,
            });

            if (result.success) {
                toast.success("Interview scheduled successfully");
                setShow(false);
                form.reset();
            } else {
                toast.error(result.error || "Failed to schedule interview");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        }
    }

    return (
        <Dialog open={show} onOpenChange={setShow}>
            <DialogTrigger className={buttonVariants({ variant: "default" })}>
                Schedule Interview
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Schedule Interview</DialogTitle>
                    <DialogDescription>
                        Set up an interview with the candidate. They will be notified via email.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field, fieldState }) => (
                                    <Field className="flex flex-col">
                                        <FieldLabel>Date</FieldLabel>
                                        <Popover>
                                            <PopoverTrigger className={cn(
                                                buttonVariants({ variant: "outline" }),
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}>
                                                {field.value ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date() || date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FieldError errors={[fieldState.error]} />
                                    </Field>
                                )}
                            />
                            <div className="flex gap-2">
                                <FormField
                                    control={form.control}
                                    name="startTime"
                                    render={({ field, fieldState }) => (
                                        <Field className="flex-1">
                                            <FieldLabel>Time</FieldLabel>
                                            <Input type="time" {...field} />
                                            <FieldError errors={[fieldState.error]} />
                                        </Field>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="duration"
                                    render={({ field, fieldState }) => (
                                        <Field className="flex-1">
                                            <FieldLabel>Duration (min)</FieldLabel>
                                            <Input type="number" {...field} />
                                            <FieldError errors={[fieldState.error]} />
                                        </Field>
                                    )}
                                />
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field, fieldState }) => (
                                <Field>
                                    <FieldLabel>Location</FieldLabel>
                                    <Input placeholder="e.g. Google Meet, Office 304..." {...field} />
                                    <FieldError errors={[fieldState.error]} />
                                </Field>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="meetingLink"
                            render={({ field, fieldState }) => (
                                <Field>
                                    <FieldLabel>Meeting Link (Optional)</FieldLabel>
                                    <Input placeholder="https://meet.google.com/..." {...field} />
                                    <FieldError errors={[fieldState.error]} />
                                </Field>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field, fieldState }) => (
                                <Field>
                                    <FieldLabel>Notes (Internal)</FieldLabel>
                                    <Textarea
                                        placeholder="Interview focus, questions to ask..."
                                        className="resize-none"
                                        {...field}
                                    />
                                    <FieldError errors={[fieldState.error]} />
                                </Field>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Schedule Interview
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
