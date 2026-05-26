// REST client for the Scope backend. Handles Bearer auth, base URL
// configuration, and error normalization. Used by every vertical MCP
// package via @scope-bid/mcp-core.

import type { ScopeApiConfig } from "./types.js";

const DEFAULT_API_BASE = "https://scope-bid.vercel.app";

export class ScopeApiClient {
  private apiBase: string;
  private apiToken: string;
  private orgSlug: string;

  constructor(config: ScopeApiConfig = {}) {
    this.apiBase = config.apiBase ?? process.env.SCOPE_API_BASE ?? DEFAULT_API_BASE;
    this.apiToken = config.apiToken ?? process.env.SCOPE_API_TOKEN ?? "";
    this.orgSlug = config.orgSlug ?? process.env.SCOPE_ORG_SLUG ?? "";
  }

  hasAuth(): boolean {
    return Boolean(this.apiToken);
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiToken) h["Authorization"] = `Bearer ${this.apiToken}`;
    return h;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  private async request<T>(
    method: "GET" | "POST" | "PATCH",
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.apiBase}${path}`;
    const res = await fetch(url, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Scope API ${method} ${path} -> ${res.status}: ${text.slice(0, 500)}`,
      );
    }
    return (await res.json()) as T;
  }

  /** Convenience getter for org slug, used by vertical packages. */
  getOrgSlug(): string {
    return this.orgSlug;
  }
}
