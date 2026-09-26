import { listComplaints, receiveComplaintEmail } from "@/lib/complaints";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    const complaints = await listComplaints();
    return Response.json({ complaints });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load complaints";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: { email?: string; subject?: string; text?: string };
  try {
    body = (await request.json()) as { email?: string; subject?: string; text?: string };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.email || !body.text?.trim()) {
    return Response.json({ error: "Missing email or message" }, { status: 400 });
  }

  try {
    const complaint = await receiveComplaintEmail({
      email: body.email,
      subject: body.subject,
      text: body.text,
    });
    return Response.json({ complaint });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not receive the email";
    return Response.json({ error: message }, { status: 500 });
  }
}
