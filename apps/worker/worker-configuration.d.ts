interface Env {
	ASSETS: Fetcher;
	ROOM_SERVER: DurableObjectNamespace<import('./src/room-do').RoomDurableObject>;
}
