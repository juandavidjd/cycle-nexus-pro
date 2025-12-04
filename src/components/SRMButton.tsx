import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";

interface SRMButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'brand';
  size?: 'sm' | 'md' | 'lg';
  to?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  brandColor?: string;
  external?: boolean;
}

const variantStyles = {
  primary: "bg-primary text-primary-foreground hover:bg-srm-red-dark glow-red",
  secondary: "bg-secondary text-secondary-foreground hover:bg-srm-blue-dark glow-blue",
  outline: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
  ghost: "text-foreground hover:bg-steel-700 hover:text-foreground",
  brand: "text-white font-semibold",
};

const sizeStyles = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export function SRMButton({
  children,
  variant = 'primary',
  size = 'md',
  to,
  href,
  onClick,
  className,
  brandColor,
  external = false,
}: SRMButtonProps) {
  const baseStyles = cn(
    "inline-flex items-center justify-center gap-2 font-display font-bold rounded-lg",
    "transition-all duration-300 hover-lift",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
    variantStyles[variant],
    sizeStyles[size],
    className
  );

  const brandStyles = brandColor
    ? { backgroundColor: brandColor, boxShadow: `0 0 30px ${brandColor}40` }
    : undefined;

  const content = (
    <>
      {children}
      {external && <ExternalLink className="w-4 h-4" />}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={baseStyles}
        style={variant === 'brand' ? brandStyles : undefined}
      >
        {content}
      </a>
    );
  }

  if (to) {
    return (
      <Link to={to} className={baseStyles} style={variant === 'brand' ? brandStyles : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={baseStyles}
      style={variant === 'brand' ? brandStyles : undefined}
    >
      {content}
    </button>
  );
}
