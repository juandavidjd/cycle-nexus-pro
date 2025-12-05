import { cn } from "@/lib/utils";

interface SRMLogoProps {
  className?: string;
  variant?: "icon" | "full";
}

export const SRMLogo = ({ className = "w-14 h-14", variant = "icon" }: SRMLogoProps) => (
  <img
    src="/srm-icons/srm-icon-256.png"
    alt="SRM – Somos Repuestos Motos"
    className={cn("object-contain", className)}
  />
);

export const SRM_FAVICON = "/srm-icons/favicon-32x32.png";
