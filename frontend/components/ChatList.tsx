import type { ChatListItem } from "~backend/chat/list";
import { UserCircle, Users } from "lucide-react";

interface ChatListProps {
  chats: ChatListItem[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

export function ChatList({ chats, selectedChatId, onSelectChat }: ChatListProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      {chats.map((chat) => {
        const displayName = chat.isGroup ? chat.name : chat.otherUser?.name;
        const displayAvatar = chat.isGroup ? chat.avatarUrl : chat.otherUser?.avatarUrl;

        return (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`w-full flex items-center gap-3 p-4 hover:bg-accent transition-colors border-b border-border ${
              selectedChatId === chat.id ? "bg-accent" : ""
            }`}
          >
            <div className="flex-shrink-0">
              {displayAvatar ? (
                <img src={displayAvatar} alt={displayName ?? ""} className="w-12 h-12 rounded-full object-cover" />
              ) : chat.isGroup ? (
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0 text-left">
              <div className="font-medium truncate">{displayName}</div>
              {chat.lastMessage && (
                <div className="text-sm text-muted-foreground truncate">{chat.lastMessage}</div>
              )}
            </div>
            
            {chat.lastMessageAt && (
              <div className="text-xs text-muted-foreground flex-shrink-0">
                {new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
          </button>
        );
      })}
      
      {chats.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          No chats yet. Start a new conversation!
        </div>
      )}
    </div>
  );
}
