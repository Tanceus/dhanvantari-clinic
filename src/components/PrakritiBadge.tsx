import { parsePrakritiDoshas } from "../lib/utils";
import { DoshaChip } from "./DoshaChip";

interface PrakritiBadgeProps {
  prakriti: string;
}

export function PrakritiBadge({ prakriti }: PrakritiBadgeProps) {
  const doshas = parsePrakritiDoshas(prakriti);

  return (
    <div className="flex flex-wrap gap-1.5">
      {doshas.map((dosha) => (
        <DoshaChip
          key={dosha}
          dosha={dosha as "Vata" | "Pitta" | "Kapha"}
        />
      ))}
    </div>
  );
}
