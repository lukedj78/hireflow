import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, Trash2, Eye } from "lucide-react"
import { PageLayout } from "@/components/page-layout"

export default function CandidateResumePage() {
  return (
    <PageLayout>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resume</h1>
          <p className="text-muted-foreground">
            Upload and manage your resume.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Upload Resume</CardTitle>
                <CardDescription>
                    Upload your latest resume in PDF or DOCX format. Max size 5MB.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 hover:bg-muted/50 cursor-pointer transition-colors">
                    <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOCX (Max 5MB)</p>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Current Resume</CardTitle>
                <CardDescription>
                    This is the resume currently used for your applications.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded">
                            <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium">John_Doe_Resume.pdf</p>
                            <p className="text-xs text-muted-foreground">Uploaded on Oct 24, 2023</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                         <Button variant="ghost" size="icon" title="View">
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
