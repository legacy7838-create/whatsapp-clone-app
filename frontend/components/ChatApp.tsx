import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useBackend } from "../hooks/useBackend";
import { ChatList } from "./ChatList";
import { ChatView } from "./ChatView";
import { NewChatDialog } from "./NewChatDialog";
import { UserCircle } from "lucide-react";

export function ChatApp() {
  const backend = useBackend();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [newChatOpen, setNewChatOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["user", "me"],
    queryFn: () => backend.user.getMe(),
  });

  const { data: chatsData } = useQuery({
    queryKey: ["chats"],
    queryFn: () => backend.chat.list(),
    refetchInterval: 5000,
  });

  return (
    <div className="flex h-screen bg-background">
      <div className="w-full md:w-96 border-r border-border flex flex-col">
        <div className="h-16 bg-muted flex items-center justify-between px-4 border-b border-border">
          <h1 className="text-xl font-semibold">Chats</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNewChatOpen(true)}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              New Chat
            </button>
            {user && (
              <div className="flex items-center gap-2">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full" />
                ) : (
                  <UserCircle className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
            )}
          </div>
        </div>
        
        <ChatList
          chats={chatsData?.chats ?? []}
          selectedChatId={selectedChatId}
          onSelectChat={setSelectedChatId}
        />
      </div>

      <div className="flex-1 hidden md:block">
        {selectedChatId ? (
          <ChatView chatId={selectedChatId} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Select a chat to start messaging
          </div>
        )}
      </div>

      {newChatOpen && (
        <NewChatDialog
          onClose={() => setNewChatOpen(false)}
          onChatCreated={(chatId) => {
            setSelectedChatId(chatId);
            setNewChatOpen(false);
          }}
        />
      )}
    </div>
  );
}
