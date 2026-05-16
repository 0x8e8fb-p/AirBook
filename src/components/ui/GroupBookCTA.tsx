"use client";

import { Mail, Users } from "lucide-react";

interface Props {
  pax: number;
  origin: string;
  destination: string;
  date: string;
}

export function GroupBookCTA({ pax, origin, destination, date }: Props) {
  if (pax < 9) return null;

  const subject = encodeURIComponent(
    `Group booking request: ${origin} → ${destination} on ${date} (${pax} pax)`,
  );
  const body = encodeURIComponent(
    `Hi TheWingScan team,\n\nPlease send me a group-fare quote:\n\nRoute: ${origin} → ${destination}\nDate: ${date}\nPassengers: ${pax}\n\nThanks.`,
  );

  return (
    <div className="surface-card rounded-[28px] p-5">
      <div className="flex items-start gap-3">
        <Users className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-cta)]" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[var(--text-primary)]">
            Group booking — {pax} passengers
          </div>
          <div className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
            For 9+ travellers, group fares can unlock better coordination, flexible names, and payment structures that rarely appear in public fare listings.
          </div>
          <a
            href={`mailto:groups@thewingsscan.com?subject=${subject}&body=${body}`}
            className="mt-3 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--accent-cta)] px-3 py-1.5 text-[13px] font-medium text-[var(--text-inverse)] transition-opacity hover:opacity-90"
          >
            <Mail className="h-3.5 w-3.5" />
            Request group fare
          </a>
        </div>
      </div>
    </div>
  );
}
