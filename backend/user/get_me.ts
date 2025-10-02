import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";

export interface UserInfo {
  id: string;
  email: string | null;
  name: string;
  avatarUrl: string;
}

// Retrieves the current authenticated user's information.
export const getMe = api<void, UserInfo>(
  { auth: true, expose: true, method: "GET", path: "/user/me" },
  async () => {
    const auth = getAuthData()!;
    return {
      id: auth.userID,
      email: auth.email,
      name: auth.name,
      avatarUrl: auth.imageUrl,
    };
  }
);
