type Dosha = "Vata" | "Pitta" | "Kapha";

const DOSHA_STYLES: Record<Dosha, { bg: string; text: string; dot: string }> =
  {
    Vata: {
      bg: "bg-slate-100/80",
      text: "text-slate-600",
      dot: "bg-slate-400",
    },
    Pitta: {
      bg: "bg-brand-accent/10",
      text: "text-brand-accent",
      dot: "bg-brand-accent",
    },
    Kapha: {
      bg: "bg-brand-primary/8",
      text: "text-brand-primary",
      dot: "bg-brand-primary/70",
    },
  };

interface DoshaChipProps {
  dosha: Dosha;
}

export function DoshaChip({ dosha }: DoshaChipProps) {
  const styles = DOSHA_STYLES[dosha];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide ${styles.bg} ${styles.text}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${styles.dot}`} />
      {dosha}
    </span>
  );
}
