import { DurableObject } from "cloudflare:workers";
import { createWebSocketHandler } from "@vex-v5-override/wrpc/server";
import type { RoomMeta, RoomState } from "@vex-v5-override/protocol";
import type { RoomStoreData } from "./room-store";
import { removeClient } from "./room-store";
import { serverRouter, type ServerContext } from "./server-router";
import { broadcastRoomState } from "./routes/broadcast";

const ROOM_META_KEY = "room-meta";
const ROOM_STATE_KEY = "room-state";

export class RoomDurableObject extends DurableObject<Env> {
  private store: RoomStoreData = { meta: null, state: null };
  private activeRoomId: string | null = null;

  private wsHandler = createWebSocketHandler({
    router: serverRouter,
    loadData: () => this.ctx.storage.get("wrpc-data"),
    saveData: (data) => this.ctx.storage.put("wrpc-data", data),
    destroy: () => this.ctx.storage.deleteAll(),
    getWebSocket: (clientId) => this.ctx.getWebSockets(clientId)[0] ?? null,
    getClientIdByWebSocket: (ws) => this.ctx.getTags(ws)[0] ?? null,
    onError: (opts) => {
      console.error("WRPC Error:", opts.error.message, opts.error);
    },
  });

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      await this.wsHandler.initialize();
      await this.loadStore();
    });
  }

  private async loadStore(): Promise<void> {
    const [meta, state] = await Promise.all([
      this.ctx.storage.get<RoomMeta>(ROOM_META_KEY),
      this.ctx.storage.get<RoomState>(ROOM_STATE_KEY),
    ]);
    this.store = { meta: meta ?? null, state: state ?? null };
    if (meta?.roomId) {
      this.activeRoomId = meta.roomId;
    }
  }

  private async persistStore(): Promise<void> {
    if (this.store.meta) {
      await this.ctx.storage.put(ROOM_META_KEY, this.store.meta);
    }
    if (this.store.state) {
      await this.ctx.storage.put(ROOM_STATE_KEY, this.store.state);
    }
  }

  private createContext(roomId: string): ServerContext {
    return {
      store: this.store,
      network: this.wsHandler.connectionManager,
      roomId,
      persist: () => this.persistStore(),
    };
  }

  async getMetadata(): Promise<RoomMeta | null> {
    await this.loadStore();
    return this.store.meta;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const roomId = url.searchParams.get("roomId");
    if (!roomId) {
      return new Response("Missing roomId", { status: 400 });
    }

    this.activeRoomId = roomId;
    await this.loadStore();

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    if (!client || !server) {
      return new Response("Failed to create WebSocket pair", { status: 500 });
    }

    const clientId = url.searchParams.get("clientId");
    if (!clientId) {
      return new Response("Missing clientId", { status: 400 });
    }

    this.ctx.acceptWebSocket(server, [clientId]);

    const deviceId = url.searchParams.get("deviceId") ?? crypto.randomUUID();
    const deviceName =
      url.searchParams.get("deviceName") ??
      url.searchParams.get("displayName") ??
      "Anonymous";

    await this.wsHandler.handleConnection(server, {
      roomId,
      clientId,
      deviceId,
      deviceName,
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(
    ws: WebSocket,
    rawMessage: string | ArrayBuffer,
  ): Promise<void> {
    const messageStr =
      typeof rawMessage === "string"
        ? rawMessage
        : new TextDecoder().decode(rawMessage);
    const roomId =
      this.activeRoomId ?? this.wsHandler.connectionManager.getRoomId();
    if (!roomId) return;

    // Room meta/state live outside wrpc-data; reload after DO hibernation wake.
    await this.loadStore();

    await this.wsHandler.handleMessage(
      ws,
      messageStr,
      this.createContext(roomId),
    );
  }

  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
  ): Promise<void> {
    const clientId = await this.wsHandler.handleClose(ws, code, reason);
    if (!clientId || !this.activeRoomId) return;

    await this.loadStore();
    const next = removeClient(this.store, clientId);
    if (next && next !== this.store.state) {
      this.store.state = next;
      await this.persistStore();
      broadcastRoomState(this.wsHandler.connectionManager, next);
    }
  }

  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    this.wsHandler.handleError(
      ws,
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}
