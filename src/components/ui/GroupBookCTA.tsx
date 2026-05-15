"use client";

import { Users, Mail } from "lucide-react";

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
    `Hi TheWingsScan team,\n\nPlease send me a group-fare quote:\n\nRoute: ${origin} → ${destination}\nDate: ${date}\nPassengers: ${pax}\n\nThanks.`,
  );

  return (
    <div className="mb-4 p-4 rounded-[var(--radius-lg)] border border-[var(--accent-cta)]/30 bg-[var(--accent-cta)]/5">
      <div className="flex items-start gap-3">
        <Users className="w-5 h-5 text-[var(--accent-cta)] shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-[var(--accent-cta)]">
            Group booking — {pax} passengers
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
            For 9+ travellers, airlines offer negotiated group fares with
            flexible names and split payments. Public quotes won&apos;t reflect
            the best group price.
          </div>
          <a
            href={`mailto:groups@thewingsscan.com?subject=${subject}&body=${body}`}
            className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--accent-cta)] text-[var(--text-inverse)] hover:opacity-90 transition-opacity"
          >
            <Mail className="w-3.5 h-3.5" />
            Request group fare
          </a>
        </div>
      </div>
    </div>
  );
}
