import { initWRPC } from "@vex-v5-override/wrpc/server";
import type { Network } from "@vex-v5-override/wrpc/server";
import type { RoomStoreData } from "./room-store";
import { buildHandshakeRoute } from "./routes/handshake";
import { buildRoomRoute } from "./routes/room";

export interface ServerContext {
  store: RoomStoreData;
  network: Network;
  roomId: string;
  persist: () => Promise<void>;
}

export const w = initWRPC.createServer<ServerContext>();

const serverRouter = w.router({
  handshake: buildHandshakeRoute(w),
  room: buildRoomRoute(w),
});

export { serverRouter };
export type ServerRouter = typeof serverRouter;
