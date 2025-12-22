import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, RotateCcw, FileText } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface FileEditorProps {
  filename: string;
  initialContent: string;
  onSave?: (content: string) => void;
  readOnly?: boolean;
}

export function FileEditor({
  filename,
  initialContent,
  onSave,
  readOnly = false,
}: FileEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [hasChanges, setHasChanges] = useState(false);

  const validateMutation = trpc.config.validateYAML.useMutation();
  const saveMutation = trpc.config.saveFile.useMutation({
    onSuccess: () => {
      toast.success("File saved successfully");
      setHasChanges(false);
      onSave?.(content);
    },
    onError: (error) => {
      toast.error(`Save failed: ${error.message}`);
    },
  });

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
      setHasChanges(value !== initialContent);
    }
  };

  const handleSave = async () => {
    // Validate YAML before saving
    if (filename.endsWith('.yml') || filename.endsWith('.yaml')) {
      const validation = await validateMutation.mutateAsync({ content });
      if (!validation.valid) {
        toast.error(`Invalid YAML: ${validation.errors.join(', ')}`);
        return;
      }
    }

    saveMutation.mutate({
      filename,
      content,
      commitMessage: `Updated ${filename} via dashboard`,
    });
  };

  const handleReset = () => {
    setContent(initialContent);
    setHasChanges(false);
    toast.info("Changes discarded");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {filename}
          </CardTitle>
          {!readOnly && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!hasChanges}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={!hasChanges || saveMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Editor
            height="600px"
            defaultLanguage="yaml"
            value={content}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              readOnly,
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>
        {hasChanges && !readOnly && (
          <p className="text-sm text-yellow-500 mt-2">
            You have unsaved changes
          </p>
        )}
      </CardContent>
    </Card>
  );
}
