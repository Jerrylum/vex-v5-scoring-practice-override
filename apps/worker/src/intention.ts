import {
  ConnectionIntentionSchema,
  type ConnectionIntention,
} from "@vex-v5-override/protocol";

export function parseConnectionIntentionFromRequest(
  request: Request,
): ConnectionIntention | null {
  const url = new URL(request.url);
  const displayName =
    url.searchParams.get("deviceName") ?? url.searchParams.get("displayName");

  const result = ConnectionIntentionSchema.safeParse({
    roomId: url.searchParams.get("roomId"),
    clientId: url.searchParams.get("clientId"),
    deviceId: url.searchParams.get("deviceId"),
    displayName,
    action: url.searchParams.get("action"),
  });

  return result.success ? result.data : null;
}
