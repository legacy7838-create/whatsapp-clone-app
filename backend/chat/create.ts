import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface CreateChatRequest {
  participantIds: string[];
  isGroup: boolean;
  name?: string;
}

export interface Chat {
  id: string;
  name: string | null;
  isGroup: boolean;
  avatarUrl: string | null;
  createdAt: Date;
}

// Creates a new chat or returns an existing one-on-one chat.
export const create = api<CreateChatRequest, Chat>(
  { auth: true, expose: true, method: "POST", path: "/chat" },
  async (req) => {
    const auth = getAuthData()!;
    
    if (req.participantIds.length === 0) {
      throw APIError.invalidArgument("at least one participant required");
    }
    
    if (!req.isGroup && req.participantIds.length !== 1) {
      throw APIError.invalidArgument("one-on-one chat must have exactly one other participant");
    }
    
    if (req.isGroup && !req.name) {
      throw APIError.invalidArgument("group chat must have a name");
    }

    if (!req.isGroup) {
      const otherUserId = req.participantIds[0];
      const existing = await db.queryRow<{ id: string }>`
        SELECT c.id
        FROM chats c
        INNER JOIN chat_participants cp1 ON c.id = cp1.chat_id AND cp1.user_id = ${auth.userID}
        INNER JOIN chat_participants cp2 ON c.id = cp2.chat_id AND cp2.user_id = ${otherUserId}
        WHERE c.is_group = false
        LIMIT 1
      `;
      
      if (existing) {
        const chat = await db.queryRow<Chat>`
          SELECT id, name, is_group as "isGroup", avatar_url as "avatarUrl", created_at as "createdAt"
          FROM chats
          WHERE id = ${existing.id}
        `;
        return chat!;
      }
    }

    const chatId = crypto.randomUUID();
    
    await db.exec`
      INSERT INTO chats (id, name, is_group, created_by)
      VALUES (${chatId}, ${req.name ?? null}, ${req.isGroup}, ${auth.userID})
    `;
    
    await db.exec`
      INSERT INTO chat_participants (chat_id, user_id)
      VALUES (${chatId}, ${auth.userID})
    `;
    
    for (const participantId of req.participantIds) {
      await db.exec`
        INSERT INTO chat_participants (chat_id, user_id)
        VALUES (${chatId}, ${participantId})
      `;
    }
    
    const chat = await db.queryRow<Chat>`
      SELECT id, name, is_group as "isGroup", avatar_url as "avatarUrl", created_at as "createdAt"
      FROM chats
      WHERE id = ${chatId}
    `;
    
    return chat!;
  }
);
