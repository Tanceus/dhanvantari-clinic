interface TreatmentTagProps {
  treatment: string;
}

export function TreatmentTag({ treatment }: TreatmentTagProps) {
  return (
    <span className="inline-flex items-center rounded-md border border-gold/25 bg-gold/10 px-2 py-0.5 text-[11px] font-medium tracking-wide text-gold">
      {treatment}
    </span>
  );
}
