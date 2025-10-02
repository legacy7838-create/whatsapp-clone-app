import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBackend } from "../hooks/useBackend";
import { X, Search, UserCircle, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface NewChatDialogProps {
  onClose: () => void;
  onChatCreated: (chatId: string) => void;
}

export function NewChatDialog({ onClose, onChatCreated }: NewChatDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const backend = useBackend();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: searchResults } = useQuery({
    queryKey: ["users", "search", searchQuery],
    queryFn: () => backend.user.search({ query: searchQuery }),
    enabled: searchQuery.length > 0,
  });

  const createChatMutation = useMutation({
    mutationFn: async () => {
      return backend.chat.create({
        participantIds: selectedUsers,
        isGroup,
        name: isGroup ? groupName : undefined,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      onChatCreated(data.id);
    },
    onError: (err) => {
      console.error("Failed to create chat:", err);
      toast({
        title: "Error",
        description: "Failed to create chat. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = () => {
    if (selectedUsers.length === 0) return;
    if (isGroup && !groupName.trim()) return;
    createChatMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold">New Chat</h2>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div className="flex gap-2">
            <button
              onClick={() => setIsGroup(false)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                !isGroup ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              Direct Message
            </button>
            <button
              onClick={() => setIsGroup(true)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                isGroup ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              Group Chat
            </button>
          </div>

          {isGroup && (
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="w-full px-4 py-2 bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary"
            />
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((userId) => {
                const user = searchResults?.users.find((u) => u.id === userId);
                return (
                  <div
                    key={userId}
                    className="flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm"
                  >
                    <span>{user?.name}</span>
                    <button onClick={() => toggleUser(userId)} className="hover:opacity-80">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-1">
            {searchResults?.users.map((user) => (
              <button
                key={user.id}
                onClick={() => toggleUser(user.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors ${
                  selectedUsers.includes(user.id) ? "bg-accent" : ""
                }`}
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <UserCircle className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 text-left">
                  <div className="font-medium">{user.name}</div>
                  {user.email && <div className="text-sm text-muted-foreground">{user.email}</div>}
                </div>
                {selectedUsers.includes(user.id) && (
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleCreate}
            disabled={selectedUsers.length === 0 || (isGroup && !groupName.trim()) || createChatMutation.isPending}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGroup ? "Create Group" : "Start Chat"}
          </button>
        </div>
      </div>
    </div>
  );
}
