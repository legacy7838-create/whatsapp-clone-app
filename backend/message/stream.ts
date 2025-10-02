import { api, APIError, StreamOut } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import db from "../db";

export interface StreamHandshake {
  chatId: string;
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

class MessageStreamManager {
  private streams = new Map<string, Set<StreamOut<Message>>>();

  register(chatId: string, stream: StreamOut<Message>) {
    if (!this.streams.has(chatId)) {
      this.streams.set(chatId, new Set());
    }
    this.streams.get(chatId)!.add(stream);
  }

  unregister(chatId: string, stream: StreamOut<Message>) {
    const chatStreams = this.streams.get(chatId);
    if (chatStreams) {
      chatStreams.delete(stream);
      if (chatStreams.size === 0) {
        this.streams.delete(chatId);
      }
    }
  }

  async broadcast(chatId: string, message: Message) {
    const chatStreams = this.streams.get(chatId);
    if (!chatStreams) return;

    const deadStreams: StreamOut<Message>[] = [];
    
    for (const stream of chatStreams) {
      try {
        await stream.send(message);
      } catch {
        deadStreams.push(stream);
      }
    }
    
    for (const stream of deadStreams) {
      this.unregister(chatId, stream);
    }
  }
}

export const messageStream = new MessageStreamManager();

// Establishes a real-time stream for receiving new messages in a chat.
export const stream = api.streamOut<StreamHandshake, Message>(
  { auth: true, expose: true, path: "/message/stream" },
  async (handshake, stream) => {
    const auth = getAuthData()!;
    
    const isMember = await db.queryRow<{ exists: boolean }>`
      SELECT EXISTS(
        SELECT 1 FROM chat_participants
        WHERE chat_id = ${handshake.chatId} AND user_id = ${auth.userID}
      ) as exists
    `;
    
    if (!isMember?.exists) {
      throw APIError.permissionDenied("not a member of this chat");
    }
    
    messageStream.register(handshake.chatId, stream);
    
    try {
      await new Promise(() => {});
    } finally {
      messageStream.unregister(handshake.chatId, stream);
    }
  }
);
