import { parseConnectionIntentionFromRequest } from './intention';
import { RoomDurableObject } from './room-do';

export { RoomDurableObject };

export default {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);

		if (request.headers.get('Upgrade') === 'websocket' || url.pathname === '/ws') {
			const intention = parseConnectionIntentionFromRequest(request);
			if (!intention) {
				return new Response('Invalid request', { status: 400 });
			}

			const id = env.ROOM_SERVER.idFromName(intention.roomId);
			const stub = env.ROOM_SERVER.get(id);
			return stub.fetch(request);
		}

		if (url.pathname === '/join') {
			const roomId = url.searchParams.get('roomId');
			const assetResponse = await env.ASSETS.fetch(request);

			if (!roomId) {
				return assetResponse;
			}

			const id = env.ROOM_SERVER.idFromName(roomId);
			const stub = env.ROOM_SERVER.get(id);
			const metadata = await stub.getMetadata();

			if (!metadata) {
				return assetResponse;
			}

			const description = `Join VEX V5 Scoring Practice room ${roomId.slice(0, 8)}…`;

			return new HTMLRewriter()
				.on("meta[name='description']", {
					element(element) {
						element.setAttribute('content', description);
					}
				})
				.transform(assetResponse);
		}

		return env.ASSETS.fetch(request);
	}
} satisfies ExportedHandler<Env>;
