"use strict";
"use client";

import { useState, useEffect } from "react";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Application, Candidate } from "@/lib/db/schema";
import { updateApplicationStatusAction } from "@/lib/server/application-actions";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { CircleNotchIcon, EnvelopeIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";

type ApplicationStatus = "applied" | "screening" | "interview" | "offer" | "hired" | "rejected";

const COLUMNS: { id: ApplicationStatus; title: string; color: string }[] = [
  { id: "applied", title: "Applied", color: "bg-gray-100 dark:bg-gray-800" },
  { id: "screening", title: "Screening", color: "bg-blue-50 dark:bg-blue-900/20" },
  { id: "interview", title: "Interview", color: "bg-purple-50 dark:bg-purple-900/20" },
  { id: "offer", title: "Offer", color: "bg-yellow-50 dark:bg-yellow-900/20" },
  { id: "hired", title: "Hired", color: "bg-green-50 dark:bg-green-900/20" },
  { id: "rejected", title: "Rejected", color: "bg-red-50 dark:bg-red-900/20" },
];

type ApplicationWithCandidate = Application & { candidate: Candidate };

type PipelineClientPageProps = {
  jobId: string;
  initialApplications: ApplicationWithCandidate[];
};

export default function PipelineClientPage({ jobId, initialApplications }: PipelineClientPageProps) {
  const [applications, setApplications] = useState(initialApplications);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // eslint-disable-next-line
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 5,
        },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the dropped application
    const application = applications.find((app) => app.id === activeId);
    if (!application) return;

    // Determine new status
    // If dropped on a column (container), overId is the status
    // If dropped on another card, we need to find that card's status
    let newStatus: ApplicationStatus | undefined;

    if (COLUMNS.some((col) => col.id === overId)) {
        newStatus = overId as ApplicationStatus;
    } else {
        const overApplication = applications.find((app) => app.id === overId);
        if (overApplication) {
            newStatus = overApplication.status as ApplicationStatus;
        }
    }

    if (newStatus && newStatus !== application.status) {
        // Optimistic Update
        const oldStatus = application.status;
        setApplications((prev) =>
            prev.map((app) =>
                app.id === activeId ? { ...app, status: newStatus! } : app
            )
        );

        try {
            await updateApplicationStatusAction(activeId, newStatus);
            toast.success(`Moved to ${newStatus}`);
        } catch (error) {
            // Revert on failure
            setApplications((prev) =>
                prev.map((app) =>
                    app.id === activeId ? { ...app, status: oldStatus } : app
                )
            );
            toast.error("Failed to update status");
        }
    }
  };

  if (!isMounted) return <div className="p-8 flex justify-center"><CircleNotchIcon className="animate-spin" /></div>;

  return (
    <div className="h-[calc(100vh-200px)] overflow-x-auto pb-4">
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 min-w-max h-full">
                {COLUMNS.map((column) => (
                    <PipelineColumn
                        key={column.id}
                        column={column}
                        applications={applications.filter((app) => app.status === column.id)}
                    />
                ))}
            </div>

            <DragOverlay dropAnimation={dropAnimation}>
                {activeId ? (
                    <ApplicationCard
                        application={applications.find((app) => app.id === activeId)!}
                        isOverlay
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    </div>
  );
}

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
};

function PipelineColumn({ column, applications }: { column: typeof COLUMNS[0], applications: ApplicationWithCandidate[] }) {
    const { setNodeRef } = useSortable({
        id: column.id,
        data: {
            type: "Column",
            column,
        },
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "w-80 flex-shrink-0 rounded-lg p-4 flex flex-col gap-4",
                column.color
            )}
        >
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200">{column.title}</h3>
                <Badge variant="secondary">{applications.length}</Badge>
            </div>
            
            <SortableContext 
                items={applications.map((app) => app.id)} 
                strategy={verticalListSortingStrategy}
            >
                <div className="flex flex-col gap-3 flex-1 overflow-y-auto min-h-[100px]">
                    {applications.map((app) => (
                        <SortableApplicationCard key={app.id} application={app} />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
}

function SortableApplicationCard({ application }: { application: ApplicationWithCandidate }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: application.id,
        data: {
            type: "Application",
            application,
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-30 h-[150px] bg-gray-200 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-400"
            />
        );
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <ApplicationCard application={application} />
        </div>
    );
}

function ApplicationCard({ application, isOverlay }: { application: ApplicationWithCandidate, isOverlay?: boolean }) {
    const params = useParams();
    const organizationId = params?.organizationId as string;

    const scoreColor = (score: number) => {
        if (score >= 80) return "text-green-600 bg-green-100 border-green-200";
        if (score >= 50) return "text-yellow-600 bg-yellow-100 border-yellow-200";
        return "text-red-600 bg-red-100 border-red-200";
    };

    return (
        <Card className={cn(
            "bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing",
            isOverlay && "rotate-2 shadow-xl scale-105"
        )}>
            <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                         <Avatar className="h-8 w-8">
                            <AvatarFallback>{application.candidate.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium text-sm line-clamp-1">{application.candidate.name}</p>
                            <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(application.createdAt), { addSuffix: true })}</p>
                        </div>
                    </div>
                </div>

                {application.aiScore !== null && (
                    <div className={cn("text-xs font-semibold px-2 py-1 rounded-full border w-fit flex items-center gap-1", scoreColor(application.aiScore || 0))}>
                        <span>AI Match: {application.aiScore}%</span>
                    </div>
                )}

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <EnvelopeIcon className="h-3 w-3" />
                        <span className="truncate max-w-[100px]">{application.candidate.email}</span>
                    </div>
                </div>
                
                <Link 
                    href={`/dashboard/${organizationId}/jobs/${application.jobPostingId}/applications/${application.id}`}
                    className="block w-full mt-2"
                    onClick={(e) => e.stopPropagation()} // Prevent drag start when clicking link
                >
                     <Badge variant="outline" className="w-full justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        View Details
                     </Badge>
                </Link>
            </CardContent>
        </Card>
    );
}
