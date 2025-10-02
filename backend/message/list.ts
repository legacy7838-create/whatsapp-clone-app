import { api, APIError } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface ListMessagesParams {
  chatId: Query<string>;
  limit?: Query<number>;
  before?: Query<string>;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: Date;
}

export interface ListMessagesResponse {
  messages: Message[];
}

// Retrieves messages from a chat, ordered by creation time descending.
export const list = api<ListMessagesParams, ListMessagesResponse>(
  { auth: true, expose: true, method: "GET", path: "/message" },
  async ({ chatId, limit = 50, before }) => {
    const auth = getAuthData()!;
    
    const isMember = await db.queryRow<{ exists: boolean }>`
      SELECT EXISTS(
        SELECT 1 FROM chat_participants
        WHERE chat_id = ${chatId} AND user_id = ${auth.userID}
      ) as exists
    `;
    
    if (!isMember?.exists) {
      throw APIError.permissionDenied("not a member of this chat");
    }
    
    let rows: Message[];
    if (before) {
      const beforeDate = await db.queryRow<{ createdAt: Date }>`
        SELECT created_at as "createdAt" FROM messages WHERE id = ${before}
      `;
      
      rows = await db.queryAll<Message>`
        SELECT 
          m.id,
          m.chat_id as "chatId",
          m.sender_id as "senderId",
          u.name as "senderName",
          u.avatar_url as "senderAvatar",
          m.content,
          m.media_url as "mediaUrl",
          m.media_type as "mediaType",
          m.created_at as "createdAt"
        FROM messages m
        INNER JOIN users u ON m.sender_id = u.id
        WHERE m.chat_id = ${chatId} AND m.created_at < ${beforeDate?.createdAt ?? new Date()}
        ORDER BY m.created_at DESC
        LIMIT ${limit}
      `;
    } else {
      rows = await db.queryAll<Message>`
        SELECT 
          m.id,
          m.chat_id as "chatId",
          m.sender_id as "senderId",
          u.name as "senderName",
          u.avatar_url as "senderAvatar",
          m.content,
          m.media_url as "mediaUrl",
          m.media_type as "mediaType",
          m.created_at as "createdAt"
        FROM messages m
        INNER JOIN users u ON m.sender_id = u.id
        WHERE m.chat_id = ${chatId}
        ORDER BY m.created_at DESC
        LIMIT ${limit}
      `;
    }
    
    return { messages: rows };
  }
);
