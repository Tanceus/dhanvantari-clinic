import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import {
  ACTIVE_CLINIC_ID,
  getClinicConfig,
} from "./clinics";
import type { ClinicConfig } from "../types";

interface ClinicConfigContextValue {
  config: ClinicConfig;
  clinicId: string;
}

const ClinicConfigContext = createContext<ClinicConfigContextValue | null>(
  null,
);

interface ClinicConfigProviderProps {
  children: ReactNode;
  clinicId?: string;
}

export function ClinicConfigProvider({
  children,
  clinicId = ACTIVE_CLINIC_ID,
}: ClinicConfigProviderProps) {
  const config = useMemo(() => getClinicConfig(clinicId), [clinicId]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--brand-primary", config.branding.primaryColor);
    root.style.setProperty("--brand-accent", config.branding.accentColor);
    document.title = `${config.name} — ${config.tagline}`;
  }, [config]);

  const value = useMemo(
    () => ({ config, clinicId: config.clinicId }),
    [config],
  );

  return (
    <ClinicConfigContext.Provider value={value}>
      {children}
    </ClinicConfigContext.Provider>
  );
}

export function useClinicConfig(): ClinicConfigContextValue {
  const context = useContext(ClinicConfigContext);
  if (!context) {
    throw new Error("useClinicConfig must be used within ClinicConfigProvider");
  }
  return context;
}
