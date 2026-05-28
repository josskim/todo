import webpush from "web-push";
import { prisma } from "@/lib/prisma";

function getVapidKeys() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

export function configureWebPush() {
  const keys = getVapidKeys();
  if (!keys) return false;
  webpush.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey);
  return true;
}

export async function sendPushToUser(userId: string, title: string, body: string, url = "/todos") {
  const keysReady = configureWebPush();
  if (!keysReady) return { success: false, skipped: true };

  const subscriptions = await prisma.todoPushSubscription.findMany({
    where: { userId, isActive: true },
  });

  const payload = JSON.stringify({
    title,
    body,
    url,
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };
      await webpush.sendNotification(pushSubscription, payload);
    }),
  );

  return {
    success: true,
    sent: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
  };
}

