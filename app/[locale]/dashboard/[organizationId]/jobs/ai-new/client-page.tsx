"use client";

import JobCreationAgent from "@/components/dashboard/jobs/job-creation-agent";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ClientPage({ organizationId }: { organizationId: string }) {
  return (
    <div className="flex flex-col gap-6 p-6 h-full">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
           <Link href={`/dashboard/${organizationId}/jobs`}>
             <ArrowLeft size={16} />
           </Link>
        </Button>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/dashboard/${organizationId}/jobs`}>Jobs</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>AI Creation</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex-1 min-h-0">
         <JobCreationAgent organizationId={organizationId} />
      </div>
    </div>
  );
}
