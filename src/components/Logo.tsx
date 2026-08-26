import Image from "next/image";

type LogoProps = {
  light?: boolean;
  className?: string;
};

/**
 * Logo OptiPana (LogoOptipanaLineal.png) tomado del proyecto de Stitch.
 */
export function Logo({ light = false, className = "" }: LogoProps) {
  return (
    <a
      href="#inicio"
      aria-label="OptiPana — inicio"
      className={`inline-flex items-center ${className}`}
    >
      <Image
        src="/logo-optipana.png"
        alt="OptiPana"
        width={180}
        height={48}
        priority
        className={`h-10 w-auto object-contain ${light ? "brightness-0 invert" : ""}`}
      />
    </a>
  );
}
