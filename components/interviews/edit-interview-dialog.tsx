"use client";

import { useState, useEffect } from "react";
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
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { updateInterviewAction } from "@/lib/server/interview-actions";
import { Interview } from "@/lib/db/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form } from "@/components/ui/form";

const formSchema = z.object({
    date: z.date(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    duration: z.preprocess((val) => Number(val), z.number().min(15).max(240)),
    location: z.string().optional(),
    meetingLink: z.string().url("Invalid URL").optional().or(z.literal("")),
    notes: z.string().optional(),
    status: z.enum(["scheduled", "completed", "cancelled", "rescheduled"]),
});

interface EditInterviewDialogProps {
    interview: Interview;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditInterviewDialog({
    interview,
    open,
    onOpenChange,
}: EditInterviewDialogProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            date: new Date(interview.startTime),
            startTime: format(new Date(interview.startTime), "HH:mm"),
            duration: Math.round((new Date(interview.endTime).getTime() - new Date(interview.startTime).getTime()) / 60000),
            location: interview.location || "",
            meetingLink: interview.meetingLink || "",
            notes: interview.notes || "",
            status: interview.status as "scheduled" | "completed" | "cancelled" | "rescheduled",
        },
    });

    // Reset form when interview changes
    useEffect(() => {
        if (open) {
            form.reset({
                date: new Date(interview.startTime),
                startTime: format(new Date(interview.startTime), "HH:mm"),
                duration: Math.round((new Date(interview.endTime).getTime() - new Date(interview.startTime).getTime()) / 60000),
                location: interview.location || "",
                meetingLink: interview.meetingLink || "",
                notes: interview.notes || "",
                status: interview.status as "scheduled" | "completed" | "cancelled" | "rescheduled",
            });
        }
    }, [interview, open, form]);

    const isSubmitting = form.formState.isSubmitting;

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            // Combine date and time
            const [hours, minutes] = values.startTime.split(":").map(Number);
            const startDateTime = new Date(values.date);
            startDateTime.setHours(hours, minutes);

            const endDateTime = new Date(startDateTime);
            endDateTime.setMinutes(endDateTime.getMinutes() + values.duration);

            const result = await updateInterviewAction(interview.id, {
                startTime: startDateTime,
                endTime: endDateTime,
                location: values.location,
                meetingLink: values.meetingLink || undefined,
                notes: values.notes,
                status: values.status,
            });

            if (result.success) {
                toast.success("Interview updated successfully");
                onOpenChange(false);
            } else {
                toast.error(result.error || "Failed to update interview");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Interview</DialogTitle>
                    <DialogDescription>
                        Update the interview details.
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
                                                        date < new Date(new Date().setHours(0, 0, 0, 0))
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FieldError errors={[fieldState.error]} />
                                    </Field>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="startTime"
                                render={({ field, fieldState }) => (
                                    <Field>
                                        <FieldLabel>Start Time</FieldLabel>
                                        <Input type="time" {...field} />
                                        <FieldError errors={[fieldState.error]} />
                                    </Field>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="duration"
                                render={({ field, fieldState }) => (
                                        <Field>
                                            <FieldLabel>Duration (minutes)</FieldLabel>
                                            <Input 
                                                type="number" 
                                                min="15" 
                                                step="15" 
                                                {...field}
                                            />
                                            <FieldError errors={[fieldState.error]} />
                                        </Field>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field, fieldState }) => (
                                    <Field>
                                        <FieldLabel>Status</FieldLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                                <SelectItem value="rescheduled">Rescheduled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FieldError errors={[fieldState.error]} />
                                    </Field>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field, fieldState }) => (
                                <Field>
                                    <FieldLabel>Location</FieldLabel>
                                    <Input placeholder="e.g. Google Meet, Office" {...field} />
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
                                    <Input placeholder="https://..." {...field} />
                                    <FieldError errors={[fieldState.error]} />
                                </Field>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field, fieldState }) => (
                                <Field>
                                    <FieldLabel>Notes (Optional)</FieldLabel>
                                    <Textarea placeholder="Agenda, topics to discuss..." {...field} />
                                    <FieldError errors={[fieldState.error]} />
                                </Field>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Update Interview
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
