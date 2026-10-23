import { getSettingsView } from "@/server/settings";
import { getDataDir } from "@/lib/env";
import { SettingsForm } from "@/components/settings/settings-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Settings — PRD Forge",
};

export default async function SettingsPage() {
  const settings = await getSettingsView();
  return <SettingsForm initial={settings} dataDir={getDataDir()} />;
}
