import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface GetChatParams {
  id: string;
}

export interface Participant {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface ChatDetails {
  id: string;
  name: string | null;
  isGroup: boolean;
  avatarUrl: string | null;
  participants: Participant[];
}

// Retrieves detailed information about a specific chat.
export const get = api<GetChatParams, ChatDetails>(
  { auth: true, expose: true, method: "GET", path: "/chat/:id" },
  async ({ id }) => {
    const auth = getAuthData()!;
    
    const isMember = await db.queryRow<{ exists: boolean }>`
      SELECT EXISTS(
        SELECT 1 FROM chat_participants
        WHERE chat_id = ${id} AND user_id = ${auth.userID}
      ) as exists
    `;
    
    if (!isMember?.exists) {
      throw APIError.permissionDenied("not a member of this chat");
    }
    
    const chat = await db.queryRow<{
      id: string;
      name: string | null;
      isGroup: boolean;
      avatarUrl: string | null;
    }>`
      SELECT id, name, is_group as "isGroup", avatar_url as "avatarUrl"
      FROM chats
      WHERE id = ${id}
    `;
    
    if (!chat) {
      throw APIError.notFound("chat not found");
    }
    
    const participants = await db.queryAll<Participant>`
      SELECT u.id, u.name, u.avatar_url as "avatarUrl"
      FROM chat_participants cp
      INNER JOIN users u ON cp.user_id = u.id
      WHERE cp.chat_id = ${id}
    `;
    
    return {
      ...chat,
      participants,
    };
  }
);
