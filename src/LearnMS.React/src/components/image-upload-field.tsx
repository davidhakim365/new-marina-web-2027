import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { uploadToImgBb } from "@/lib/imgbb-upload";
import { ImageIcon, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  value?: string | null;
  onChange: (url: string) => void;
  className?: string;
  disabled?: boolean;
};

/** Upload an image via ImgBB (same path as quiz question images). */
export function ImageUploadField({
  value,
  onChange,
  className,
  disabled,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please choose an image file.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const url = await uploadToImgBb(file);
      onChange(url);
    } catch (e) {
      toast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : "Could not upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("min-w-0 max-w-full space-y-3", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={disabled || uploading}
        onChange={(e) => {
          const f = e.target.files?.[0];
          void handleFile(f);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full justify-center sm:w-auto"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading…
          </>
        ) : (
          <>
            <ImageIcon className="h-4 w-4" />
            {value ? "Replace image" : "Choose image"}
          </>
        )}
      </Button>

      {value ? (
        <div className="relative inline-block max-w-full">
          <img
            src={value}
            alt="Preview"
            className="max-h-40 w-full max-w-full rounded-lg border bg-background object-contain sm:max-h-48"
          />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute right-1 top-1 h-7 w-7 sm:-right-2 sm:-top-2"
            disabled={disabled || uploading}
            onClick={() => onChange("")}
            aria-label="Remove image"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center gap-2 rounded-lg border border-dashed px-3 text-center text-sm text-muted-foreground sm:h-28">
          <ImageIcon className="h-4 w-4 shrink-0" />
          <span>Choose an image to upload</span>
        </div>
      )}
    </div>
  );
}
