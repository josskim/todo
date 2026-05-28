import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { sweepDueReminders } from "@/lib/reminders";

function getCronSecret(request: NextRequest) {
  return request.headers.get("x-todo-cron-secret") || request.nextUrl.searchParams.get("secret");
}

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.TODO_CRON_SECRET?.trim();
  const providedSecret = getCronSecret(request)?.trim();

  if (configuredSecret && providedSecret && configuredSecret === providedSecret) {
    const result = await sweepDueReminders();
    return NextResponse.json({ success: true, processed: result.processed, total: result.total });
  }

  const user = await requireUser();
  const result = await sweepDueReminders({ userId: user.id });
  return NextResponse.json({ success: true, processed: result.processed, total: result.total });
}
