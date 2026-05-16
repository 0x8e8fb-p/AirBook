import { AlertCircle } from "lucide-react";

export function EnvWarningBanner() {
  const missingGoogle = !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET;
  const isDefaultDb = process.env.DATABASE_URL?.includes('your_project_id');

  if (!missingGoogle && !isDefaultDb) return null;

  const impactedFeatures = [
    missingGoogle ? "sign-in" : null,
    isDefaultDb ? "saved data" : null,
  ].filter(Boolean);

  const impactedLabel = impactedFeatures.length > 0 ? impactedFeatures.join(" and ") : "some account features";

  return (
    <div className="bg-[var(--accent-red)] text-white px-4 py-3 text-sm z-[100] relative shadow-md">
      <div className="container-app flex items-start gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold block mb-1">Limited setup</strong>
          <p className="opacity-90">
            This environment is still missing a few setup steps, so {impactedLabel} may be unavailable until configuration is completed.
          </p>
        </div>
      </div>
    </div>
  );
}
