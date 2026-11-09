import { friendlyMessage } from "../../lib/errors";
import { getIssPosition } from "../../lib/iss";

export async function GET() {
  try {
    return Response.json(await getIssPosition());
  } catch (error) {
    return Response.json({ error: friendlyMessage(error, "The ISS tracker") }, { status: 502 });
  }
}