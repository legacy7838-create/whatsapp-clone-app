import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface ChatListItem {
  id: string;
  name: string | null;
  isGroup: boolean;
  avatarUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  otherUser: {
    id: string;
    name: string;
    avatarUrl: string;
  } | null;
}

export interface ListChatsResponse {
  chats: ChatListItem[];
}

// Retrieves all chats for the current user, ordered by last message.
export const list = api<void, ListChatsResponse>(
  { auth: true, expose: true, method: "GET", path: "/chat" },
  async () => {
    const auth = getAuthData()!;
    
    const rows = await db.queryAll<{
      id: string;
      name: string | null;
      isGroup: boolean;
      avatarUrl: string | null;
      lastMessage: string | null;
      lastMessageAt: Date | null;
      otherUserId: string | null;
      otherUserName: string | null;
      otherUserAvatar: string | null;
    }>`
      SELECT 
        c.id,
        c.name,
        c.is_group as "isGroup",
        c.avatar_url as "avatarUrl",
        m.content as "lastMessage",
        m.created_at as "lastMessageAt",
        u.id as "otherUserId",
        u.name as "otherUserName",
        u.avatar_url as "otherUserAvatar"
      FROM chats c
      INNER JOIN chat_participants cp ON c.id = cp.chat_id AND cp.user_id = ${auth.userID}
      LEFT JOIN LATERAL (
        SELECT content, created_at
        FROM messages
        WHERE chat_id = c.id
        ORDER BY created_at DESC
        LIMIT 1
      ) m ON true
      LEFT JOIN LATERAL (
        SELECT u.id, u.name, u.avatar_url
        FROM chat_participants cp2
        INNER JOIN users u ON cp2.user_id = u.id
        WHERE cp2.chat_id = c.id AND cp2.user_id != ${auth.userID}
        LIMIT 1
      ) u ON c.is_group = false
      ORDER BY m.created_at DESC NULLS LAST, c.created_at DESC
    `;
    
    const chats: ChatListItem[] = rows.map(row => ({
      id: row.id,
      name: row.name,
      isGroup: row.isGroup,
      avatarUrl: row.avatarUrl,
      lastMessage: row.lastMessage,
      lastMessageAt: row.lastMessageAt,
      otherUser: row.otherUserId ? {
        id: row.otherUserId,
        name: row.otherUserName!,
        avatarUrl: row.otherUserAvatar!,
      } : null,
    }));
    
    return { chats };
  }
);
