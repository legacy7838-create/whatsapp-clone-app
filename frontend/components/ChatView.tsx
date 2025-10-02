import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { UserCircle, Users } from "lucide-react";
import { useEffect } from "react";

interface ChatViewProps {
  chatId: string;
}

export function ChatView({ chatId }: ChatViewProps) {
  const backend = useBackend();
  const queryClient = useQueryClient();

  const { data: chat } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: () => backend.chat.get({ id: chatId }),
  });

  const { data: messagesData } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => backend.message.list({ chatId }),
  });

  const sendMutation = useMutation({
    mutationFn: async ({ content, mediaUrl, mediaType }: { content?: string; mediaUrl?: string; mediaType?: string }) => {
      return backend.message.send({ chatId, content, mediaUrl, mediaType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  useEffect(() => {
    let active = true;

    async function startStream() {
      try {
        const stream = await backend.message.stream({ chatId });

        for await (const message of stream) {
          if (!active) break;
          queryClient.setQueryData(["messages", chatId], (old: any) => {
            if (!old) return old;
            const exists = old.messages.some((m: any) => m.id === message.id);
            if (exists) return old;
            return {
              messages: [message, ...old.messages],
            };
          });
          queryClient.invalidateQueries({ queryKey: ["chats"] });
        }
      } catch (err) {
        console.error("Stream error:", err);
      }
    }

    startStream();

    return () => {
      active = false;
    };
  }, [chatId, backend, queryClient]);

  const displayName = chat?.isGroup ? chat.name : chat?.participants.find(p => p.id !== chat?.participants[0]?.id)?.name;
  const displayAvatar = chat?.isGroup ? chat.avatarUrl : chat?.participants.find(p => p.id !== chat?.participants[0]?.id)?.avatarUrl;

  return (
    <div className="h-full flex flex-col">
      <div className="h-16 bg-muted border-b border-border flex items-center px-4 gap-3">
        {displayAvatar ? (
          <img src={displayAvatar} alt={displayName ?? ""} className="w-10 h-10 rounded-full object-cover" />
        ) : chat?.isGroup ? (
          <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        <div>
          <div className="font-semibold">{displayName}</div>
          {chat?.isGroup && (
            <div className="text-xs text-muted-foreground">
              {chat.participants.length} participants
            </div>
          )}
        </div>
      </div>

      <MessageList messages={messagesData?.messages ?? []} />

      <MessageInput
        onSend={(content, mediaUrl, mediaType) => sendMutation.mutate({ content, mediaUrl, mediaType })}
        disabled={sendMutation.isPending}
      />
    </div>
  );
}
