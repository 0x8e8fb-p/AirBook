import { AlertCircle } from "lucide-react";

export function EnvWarningBanner() {
  const missingGoogle = !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET;
  const isDefaultDb = process.env.DATABASE_URL?.includes('your_project_id');

  if (!missingGoogle && !isDefaultDb) return null;

  return (
    <div className="bg-[var(--accent-red)] text-white px-4 py-3 text-sm z-[100] relative shadow-md">
      <div className="container-app flex items-start gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold block mb-1">Configuration Required!</strong>
          <p className="opacity-90">
            {missingGoogle && "Your Google Client ID and Secret are missing in .env.local. "}
            {isDefaultDb && "Your Supabase DATABASE_URL is using placeholder text. "}
            Authentication and Database features will <b>crash</b> until you paste your actual API keys into the <code>.env.local</code> file and restart the server.
          </p>
        </div>
      </div>
    </div>
  );
}