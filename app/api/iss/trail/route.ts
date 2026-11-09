import { friendlyMessage } from "../../../lib/errors";
import { getIssTrail } from "../../../lib/iss";

export async function GET() {
  try {
    const result = await getIssTrail();
    if (result.ok) return Response.json(result.data);
    return Response.json({ error: friendlyMessage(result.failure, "The ISS tracker") }, { status: 502 });
  } catch (error) {
    return Response.json({ error: friendlyMessage(error, "The ISS tracker") }, { status: 502 });
  }
}
