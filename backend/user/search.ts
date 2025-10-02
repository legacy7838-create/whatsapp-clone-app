import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import db from "../db";

export interface SearchUsersParams {
  query: Query<string>;
}

export interface User {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string;
}

export interface SearchUsersResponse {
  users: User[];
}

// Searches for users by name or email.
export const search = api<SearchUsersParams, SearchUsersResponse>(
  { auth: true, expose: true, method: "GET", path: "/user/search" },
  async ({ query }) => {
    const searchTerm = `%${query}%`;
    const rows = await db.queryAll<User>`
      SELECT id, name, email, avatar_url as "avatarUrl"
      FROM users
      WHERE name ILIKE ${searchTerm} OR email ILIKE ${searchTerm}
      LIMIT 20
    `;
    return { users: rows };
  }
);
