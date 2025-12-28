import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileText, FileImage, File, ExternalLink, ZoomIn, ZoomOut } from "lucide-react";
import { getAccessToken } from "@/lib/api";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const UPLOADS_BASE_URL = `${SUPABASE_URL}/functions/v1/api-documents/download`;

interface DocumentPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    name: string;
    type: string;
    file_url: string;
  } | null;
  onDownload?: () => void;
}

function getFileType(fileUrl: string, docType: string): "pdf" | "image" | "other" {
  const extension = fileUrl.split(".").pop()?.toLowerCase() || "";
  
  if (extension === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(extension)) return "image";
  if (docType.toLowerCase().includes("image")) return "image";
  
  return "other";
}

function getFileIcon(type: string) {
  if (type === "image") return FileImage;
  if (type === "pdf") return FileText;
  return File;
}

export function DocumentPreview({ open, onOpenChange, document, onDownload }: DocumentPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

  // Generate document URL when document changes
  useEffect(() => {
    if (!document?.file_url) {
      setDocumentUrl(null);
      return;
    }

    setLoading(true);
    setError(false);

    // Construct the URL for the document
    // The file_url might be a full path or just a filename
    const fileName = document.file_url.split("/").pop() || document.file_url;
    const url = `${UPLOADS_BASE_URL}/${fileName}`;
    setDocumentUrl(url);
    setLoading(false);
  }, [document?.file_url, open]);

  if (!document) return null;

  const fileType = getFileType(document.file_url, document.type);
  const FileIcon = getFileIcon(fileType);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));

  const handleOpenInNewTab = () => {
    if (documentUrl) {
      window.open(documentUrl, "_blank");
    }
  };

  // Show loading state
  if (loading && !documentUrl) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileIcon className="h-5 w-5" />
              {document.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <Skeleton className="w-full h-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const renderPreview = () => {
    if (error || !documentUrl) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 py-12 bg-muted/50 rounded-lg min-h-[300px]">
          <FileIcon className="h-24 w-24 text-muted-foreground" />
          <div className="text-center">
            <p className="font-medium text-lg">{document.name}</p>
            <p className="text-muted-foreground text-sm mt-1">
              Unable to load preview
            </p>
          </div>
          {onDownload && (
            <Button onClick={onDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download Instead
            </Button>
          )}
        </div>
      );
    }

    if (fileType === "image") {
      return (
        <div className="relative flex-1 overflow-auto bg-muted/50 rounded-lg flex items-center justify-center min-h-[400px]">
          <img
            src={documentUrl}
            alt={document.name}
            className="max-w-full max-h-[70vh] object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
        </div>
      );
    }

    if (fileType === "pdf") {
      return (
        <div className="relative flex-1 min-h-[500px] bg-muted/50 rounded-lg overflow-hidden">
          <iframe
            src={`${documentUrl}#toolbar=1&navpanes=0`}
            className="w-full h-[70vh] border-0 rounded-lg"
            title={document.name}
            onLoad={() => setLoading(false)}
          />
        </div>
      );
    }

    // Other file types - show icon and open/download options
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 py-12 bg-muted/50 rounded-lg min-h-[300px]">
        <FileIcon className="h-24 w-24 text-muted-foreground" />
        <div className="text-center">
          <p className="font-medium text-lg">{document.name}</p>
          <p className="text-muted-foreground text-sm mt-1">
            This file type cannot be previewed directly
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleOpenInNewTab}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in New Tab
          </Button>
          {onDownload && (
            <Button onClick={onDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="flex items-center gap-2">
              <FileIcon className="h-5 w-5" />
              {document.name}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {fileType === "image" && (
                <>
                  <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= 0.5}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground w-12 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= 3}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" onClick={handleOpenInNewTab}>
                <ExternalLink className="h-4 w-4" />
              </Button>
              {onDownload && (
                <Button variant="ghost" size="icon" onClick={onDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
