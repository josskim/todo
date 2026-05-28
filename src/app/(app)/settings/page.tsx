import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { SettingsClient } from "@/components/settings-client";

export default async function SettingsPage() {
  const user = await requireUser();
  const [categories, tags, subscriptions] = await Promise.all([
    prisma.todoCategory.findMany({ where: { userId: user.id }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.todoTag.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.todoPushSubscription.findMany({ where: { userId: user.id, isActive: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return <SettingsClient categories={categories} tags={tags} subscriptions={subscriptions} />;
}

