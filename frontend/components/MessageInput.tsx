import { useState } from "react";
import { Send, Paperclip, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import { useToast } from "@/components/ui/use-toast";

interface MessageInputProps {
  onSend: (content?: string, mediaUrl?: string, mediaType?: string) => void;
  disabled: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const backend = useBackend();
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { uploadUrl, publicUrl } = await backend.media.uploadUrl({
        filename: file.name,
        contentType: file.type,
      });

      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      return { publicUrl, contentType: file.type };
    },
  });

  const handleSend = async () => {
    if (!message.trim() && !selectedFile) return;

    try {
      let mediaUrl: string | undefined;
      let mediaType: string | undefined;

      if (selectedFile) {
        const result = await uploadMutation.mutateAsync(selectedFile);
        mediaUrl = result.publicUrl;
        mediaType = result.contentType;
      }

      onSend(message.trim() || undefined, mediaUrl, mediaType);
      setMessage("");
      setSelectedFile(null);
    } catch (err) {
      console.error("Failed to send message:", err);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <div className="border-t border-border p-4">
      {selectedFile && (
        <div className="mb-2 flex items-center gap-2 p-2 bg-muted rounded-lg">
          <Paperclip className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
          <button
            onClick={() => setSelectedFile(null)}
            className="p-1 hover:bg-background rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      <div className="flex gap-2">
        <label className="flex-shrink-0 cursor-pointer">
          <input
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,video/*"
          />
          <div className="p-2 hover:bg-accent rounded-full transition-colors">
            <Paperclip className="w-5 h-5 text-muted-foreground" />
          </div>
        </label>
        
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-1 px-4 py-2 bg-muted rounded-full outline-none focus:ring-2 focus:ring-primary"
        />
        
        <button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && !selectedFile)}
          className="flex-shrink-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
