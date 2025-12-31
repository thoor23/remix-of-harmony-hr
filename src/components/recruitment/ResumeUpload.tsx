import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X, Loader2, ExternalLink, Download, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ResumeUploadProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function ResumeUpload({ value, onChange, disabled }: ResumeUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, DOC, and DOCX files are allowed");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("recruitment-documents")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from("recruitment-documents")
        .getPublicUrl(filePath);

      onChange(data.publicUrl);
      toast.success("Resume uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload resume");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleRemove = async () => {
    if (!value) return;
    
    // Extract file path from URL
    const urlParts = value.split("/recruitment-documents/");
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      await supabase.storage.from("recruitment-documents").remove([filePath]);
    }
    
    onChange("");
    toast.success("Resume removed");
  };

  if (value) {
    return (
      <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
        <FileText className="h-8 w-8 text-primary" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">Resume uploaded</p>
          <p className="text-xs text-muted-foreground">Click to view or download</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            asChild
          >
            <a href={value} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !disabled && fileInputRef.current?.click()}
    >
      <Input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || uploading}
      />
      
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Uploading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Drop resume here or click to upload</p>
          <p className="text-xs text-muted-foreground">PDF, DOC, DOCX up to 5MB</p>
        </div>
      )}
    </div>
  );
}

interface ResumePreviewProps {
  url: string;
  candidateName: string;
}

export function ResumePreview({ url, candidateName }: ResumePreviewProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  
  if (!url) return null;

  const isPdf = url.toLowerCase().includes(".pdf");

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => isPdf && setPreviewOpen(true)}
          disabled={!isPdf}
        >
          <Eye className="h-4 w-4 mr-2" /> Preview
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <Download className="h-4 w-4 mr-2" /> Download
          </a>
        </Button>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{candidateName}'s Resume</DialogTitle>
          </DialogHeader>
          <iframe
            src={url}
            className="w-full h-full rounded-lg"
            title="Resume Preview"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
