import type { AppState } from "../types";
import { migrate, type Repository } from "./repo";
import { createInitialState } from "../data/factory";

/**
 * Базовый URL API. По умолчанию берём текущий хост и порт 3000 —
 * так фронт работает и на localhost, и по локальной сети (телефон).
 * Можно переопределить через VITE_API_URL.
 */
export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  `${window.location.protocol}//${window.location.hostname}:3000`;

const TOKEN_KEY = "system.token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string): void {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, opts: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, headers, ...rest } = opts;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  if (!res.ok) {
    let msg = `Ошибка ${res.status}`;
    try {
      const body = await res.json();
      msg = Array.isArray(body.message) ? body.message.join(", ") : body.message || msg;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, msg);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export interface FeedItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  type: string;
  title: string;
  detail?: string | null;
  icon?: string | null;
  color?: string | null;
  createdAt: string;
}

export interface FeedDraft {
  type: string;
  title: string;
  detail?: string;
  icon?: string;
  color?: string;
}

export const feedApi = {
  list: (token: string, limit = 50) =>
    request<FeedItem[]>(`/feed?limit=${limit}`, { token }),
  post: (token: string, event: FeedDraft) =>
    request<FeedItem>("/feed", { method: "POST", token, body: JSON.stringify(event) }),
};

export const authApi = {
  register: (email: string, password: string, name: string) =>
    request<{ token: string; user: AuthUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),
  login: (email: string, password: string) =>
    request<{ token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: (token: string) => request<AuthUser>("/auth/me", { token }),
  updateMe: (token: string, patch: { name?: string; avatar?: string | null }) =>
    request<AuthUser>("/auth/me", { method: "PATCH", token, body: JSON.stringify(patch) }),
};

/** Репозиторий поверх REST API. Реализует тот же интерфейс, что и LocalRepository. */
export class ApiRepository implements Repository {
  private token: string;
  private onUnauthorized?: () => void;
  private accountName?: string;

  constructor(token: string, onUnauthorized?: () => void, accountName?: string) {
    this.token = token;
    this.onUnauthorized = onUnauthorized;
    this.accountName = accountName;
  }

  private handle(e: unknown): never {
    if (e instanceof ApiError && e.status === 401) this.onUnauthorized?.();
    throw e;
  }

  async load(): Promise<AppState> {
    try {
      const { data } = await request<{ data: AppState | null }>("/state", { token: this.token });
      if (!data || !data.version) {
        // Новый пользователь: имя берём из аккаунта (повторно не спрашиваем)
        const fresh = createInitialState();
        if (this.accountName) fresh.profile.name = this.accountName;
        return fresh;
      }
      // нормализуем — добавляем недостающие поля (diary и т.п.) из дефолта
      return migrate(data);
    } catch (e) {
      return this.handle(e);
    }
  }

  async save(state: AppState): Promise<void> {
    try {
      await request<{ ok: true }>("/state", {
        method: "PUT",
        token: this.token,
        body: JSON.stringify({ state }),
      });
    } catch (e) {
      // не роняем приложение при сетевой ошибке сохранения, но ловим разлогин
      if (e instanceof ApiError && e.status === 401) this.onUnauthorized?.();
    }
  }
}
