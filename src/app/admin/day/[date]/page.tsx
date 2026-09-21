import { GameApp } from "@/components/GameApp";
import { getAdminUserId } from "@/lib/adminAuth";

export default async function AdminDayPreviewPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const adminUserId = await getAdminUserId();

  if (!adminUserId) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center px-6 text-center">
        <p className="text-indigo-dim">
          Admin access required. Sign in with an approved Google account to continue.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <p className="mx-auto mt-4 w-fit rounded-full border border-dashed border-stone px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-stone-dark">
        🛠 Admin preview — {date}
      </p>
      <GameApp date={date} adminPreview />
    </div>
  );
}
