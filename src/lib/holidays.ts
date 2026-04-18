export interface Holiday {
  date: string;
  name: string;
  nameHi?: string;
  type: "national" | "regional";
}

const HOLIDAYS_BY_YEAR: Record<number, Holiday[]> = {
  2026: [
    { date: "2026-01-26", name: "Republic Day", nameHi: "गणतंत्र दिवस", type: "national" },
    { date: "2026-03-10", name: "Holi", nameHi: "होली", type: "national" },
    { date: "2026-03-30", name: "Id-ul-Fitr", nameHi: "ईद-उल-फ़ित्र", type: "national" },
    { date: "2026-04-02", name: "Ram Navami", nameHi: "राम नवमी", type: "national" },
    { date: "2026-04-03", name: "Good Friday", nameHi: "गुड फ्राइडे", type: "national" },
    { date: "2026-04-14", name: "Ambedkar Jayanti", nameHi: "अंबेडकर जयंती", type: "national" },
    { date: "2026-05-01", name: "May Day", nameHi: "मई दिवस", type: "national" },
    { date: "2026-06-06", name: "Id-ul-Zuha", nameHi: "ईद-उल-अज़हा", type: "national" },
    { date: "2026-07-06", name: "Muharram", nameHi: "मुहर्रम", type: "national" },
    { date: "2026-08-15", name: "Independence Day", nameHi: "स्वतंत्रता दिवस", type: "national" },
    { date: "2026-08-25", name: "Janmashtami", nameHi: "जन्माष्टमी", type: "national" },
    { date: "2026-09-04", name: "Milad-un-Nabi", nameHi: "मिलाद-उन-नबी", type: "national" },
    { date: "2026-10-02", name: "Gandhi Jayanti", nameHi: "गांधी जयंती", type: "national" },
    { date: "2026-10-12", name: "Dussehra", nameHi: "दशहरा", type: "national" },
    { date: "2026-10-31", name: "Diwali", nameHi: "दिवाली", type: "national" },
    { date: "2026-11-01", name: "Diwali (Day 2)", nameHi: "दिवाली", type: "national" },
    { date: "2026-11-14", name: "Children's Day", nameHi: "बाल दिवस", type: "national" },
    { date: "2026-11-30", name: "Guru Nanak Jayanti", nameHi: "गुरु नानक जयंती", type: "national" },
    { date: "2026-12-25", name: "Christmas", nameHi: "क्रिसमस", type: "national" },
  ],
  2027: [
    { date: "2027-01-26", name: "Republic Day", type: "national" },
    { date: "2027-02-27", name: "Holi", type: "national" },
    { date: "2027-03-19", name: "Id-ul-Fitr", type: "national" },
    { date: "2027-03-26", name: "Good Friday", type: "national" },
    { date: "2027-04-14", name: "Ambedkar Jayanti", type: "national" },
    { date: "2027-05-01", name: "May Day", type: "national" },
    { date: "2027-05-26", name: "Id-ul-Zuha", type: "national" },
    { date: "2027-06-25", name: "Muharram", type: "national" },
    { date: "2027-08-15", name: "Independence Day", type: "national" },
    { date: "2027-08-25", name: "Janmashtami", type: "national" },
    { date: "2027-08-24", name: "Milad-un-Nabi", type: "national" },
    { date: "2027-10-02", name: "Gandhi Jayanti", type: "national" },
    { date: "2027-10-09", name: "Dussehra", type: "national" },
    { date: "2027-11-07", name: "Diwali", type: "national" },
    { date: "2027-11-14", name: "Children's Day", type: "national" },
    { date: "2027-12-25", name: "Christmas", type: "national" },
  ],
};

export function getHolidays(year: number): Holiday[] {
  return HOLIDAYS_BY_YEAR[year] ?? [];
}

export function getHoliday(date: string): Holiday | undefined {
  const year = parseInt(date.slice(0, 4), 10);
  return getHolidays(year).find((h) => h.date === date);
}
