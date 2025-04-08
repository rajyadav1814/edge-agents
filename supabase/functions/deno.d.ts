// Type definitions for Deno
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    toObject(): { [key: string]: string };
  }

  export const env: Env;

  export interface WebSocketUpgrade {
    response: Response;
    socket: WebSocket;
  }

  export function upgradeWebSocket(request: Request): WebSocketUpgrade;

  export interface SystemMemoryInfo {
    total: number;
    available: number;
    used: number;
    free: number;
  }

  export function systemMemoryInfo(): SystemMemoryInfo;
}