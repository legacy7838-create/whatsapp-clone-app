import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";
import { messageStream } from "./stream";

export interface SendMessageRequest {
  chatId: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: string;
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

// Sends a message to a chat.
export const send = api<SendMessageRequest, Message>(
  { auth: true, expose: true, method: "POST", path: "/message" },
  async (req) => {
    const auth = getAuthData()!;
    
    if (!req.content && !req.mediaUrl) {
      throw APIError.invalidArgument("message must have content or media");
    }
    
    const isMember = await db.queryRow<{ exists: boolean }>`
      SELECT EXISTS(
        SELECT 1 FROM chat_participants
        WHERE chat_id = ${req.chatId} AND user_id = ${auth.userID}
      ) as exists
    `;
    
    if (!isMember?.exists) {
      throw APIError.permissionDenied("not a member of this chat");
    }
    
    const messageId = crypto.randomUUID();
    
    await db.exec`
      INSERT INTO messages (id, chat_id, sender_id, content, media_url, media_type)
      VALUES (${messageId}, ${req.chatId}, ${auth.userID}, ${req.content ?? null}, ${req.mediaUrl ?? null}, ${req.mediaType ?? null})
    `;
    
    const message = await db.queryRow<Message>`
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
      WHERE m.id = ${messageId}
    `;
    
    await messageStream.broadcast(req.chatId, message!);
    
    return message!;
  }
);
