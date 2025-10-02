import { useEffect, useRef } from "react";
import type { Message } from "~backend/message/list";
import { useQuery } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const backend = useBackend();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: user } = useQuery({
    queryKey: ["user", "me"],
    queryFn: () => backend.user.getMe(),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sortedMessages = [...messages].reverse();

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {sortedMessages.map((message) => {
        const isOwnMessage = message.senderId === user?.id;
        
        return (
          <div
            key={message.id}
            className={`flex gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}
          >
            {!isOwnMessage && (
              <img
                src={message.senderAvatar}
                alt={message.senderName}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
            )}
            
            <div className={`max-w-[70%] ${isOwnMessage ? "items-end" : "items-start"} flex flex-col gap-1`}>
              {!isOwnMessage && (
                <div className="text-xs font-medium text-muted-foreground px-3">
                  {message.senderName}
                </div>
              )}
              
              <div
                className={`rounded-lg px-3 py-2 ${
                  isOwnMessage
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.mediaUrl && (
                  <div className="mb-2">
                    {message.mediaType?.startsWith("image/") ? (
                      <img
                        src={message.mediaUrl}
                        alt="Shared media"
                        className="max-w-full rounded"
                      />
                    ) : message.mediaType?.startsWith("video/") ? (
                      <video
                        src={message.mediaUrl}
                        controls
                        className="max-w-full rounded"
                      />
                    ) : (
                      <a
                        href={message.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        View file
                      </a>
                    )}
                  </div>
                )}
                
                {message.content && <div className="whitespace-pre-wrap break-words">{message.content}</div>}
              </div>
              
              <div className={`text-xs text-muted-foreground px-3`}>
                {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
