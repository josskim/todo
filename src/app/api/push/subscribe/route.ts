import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

type PushSubscriptionBody = {
  subscription?: {
    endpoint?: string;
    keys?: {
      p256dh?: string;
      auth?: string;
    };
  };
  deviceName?: string;
  endpoint?: string;
};

export async function POST(request: NextRequest) {
  const user = await requireUser();
  const body = (await request.json().catch(() => null)) as PushSubscriptionBody | null;
  const subscription = body?.subscription;

  if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    return NextResponse.json({ message: "유효한 구독 정보가 필요합니다." }, { status: 400 });
  }

  await prisma.todoPushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      userId: user.id,
      deviceName: body?.deviceName?.trim() || null,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      isActive: true,
    },
    create: {
      userId: user.id,
      endpoint: subscription.endpoint,
      deviceName: body?.deviceName?.trim() || null,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      isActive: true,
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const user = await requireUser();
  const body = (await request.json().catch(() => null)) as PushSubscriptionBody | null;
  const endpoint = body?.endpoint;

  if (!endpoint) {
    return NextResponse.json({ message: "endpoint가 필요합니다." }, { status: 400 });
  }

  await prisma.todoPushSubscription.updateMany({
    where: { endpoint, userId: user.id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
