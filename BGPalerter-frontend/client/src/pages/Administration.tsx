import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileEditor } from "@/components/dashboard/FileEditor";
import { EmailConfigForm } from "@/components/dashboard/EmailConfigForm";
import { NotificationSettings } from "@/components/dashboard/NotificationSettings";
import { FileText, RefreshCw, History, Mail, Settings, Bell } from "lucide-react";
import { toast } from "sonner";

export default function Administration() {
  const [selectedFile, setSelectedFile] = useState<string>("config.yml");

  const { data: files, isLoading, refetch } = trpc.config.listFiles.useQuery();
  const { data: fileContent } = trpc.config.getFile.useQuery(
    { filename: selectedFile },
    { enabled: !!selectedFile }
  );

  const handleFileSelect = (filename: string) => {
    setSelectedFile(filename);
  };

  const handleFileSaved = () => {
    refetch();
    toast.success("Configuration updated and committed to Git");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Administration</h1>
        <p className="text-muted-foreground">
          Manage BGPalerter configuration files
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* File List Sidebar */}
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuration Files</CardTitle>
              <CardDescription>Select a file to edit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {files?.map((file) => (
                <Button
                  key={file.name}
                  variant={selectedFile === file.name ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => handleFileSelect(file.name)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {file.name}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">File Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Size:</span>{" "}
                <span className="font-mono">
                  {fileContent?.size ? `${(fileContent.size / 1024).toFixed(2)} KB` : "-"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Modified:</span>{" "}
                <span className="font-mono text-xs">
                  {fileContent?.lastModified
                    ? new Date(fileContent.lastModified).toLocaleString()
                    : "-"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Editor Area */}
        <div className="col-span-9">
          <Tabs defaultValue="editor">
            <TabsList>
              <TabsTrigger value="editor">
                <FileText className="h-4 w-4 mr-2" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="email">
                <Mail className="h-4 w-4 mr-2" />
                Email Config
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" />
                Version History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="mt-4">
              {fileContent ? (
                <FileEditor
                  filename={selectedFile}
                  initialContent={fileContent.content}
                  onSave={handleFileSaved}
                />
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Select a file to edit</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="email" className="mt-4">
              <EmailConfigForm />
            </TabsContent>

            <TabsContent value="notifications" className="mt-4">
              <NotificationSettings />
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Version History</CardTitle>
                  <CardDescription>
                    View and restore previous versions of {selectedFile}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    Version history will be displayed here
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
