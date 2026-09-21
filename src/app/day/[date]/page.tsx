import { GameApp } from "@/components/GameApp";

export default async function ArchiveDayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <GameApp date={date} />
    </div>
  );
}
