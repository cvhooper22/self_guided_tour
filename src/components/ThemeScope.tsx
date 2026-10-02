import type { CSSProperties, ReactNode } from "react";
import { googleFontsUrl, tokensToCssVars, type ThemeTokens } from "@/lib/themes";

/** Applies a resolved theme to its subtree as CSS variables (+ web fonts). Safe in server and client components. */
export function ThemeScope({ tokens, className = "", children }: { tokens: ThemeTokens; className?: string; children: ReactNode }) {
  const fonts = googleFontsUrl(tokens);
  return (
    <div className={`themed ${className}`} style={tokensToCssVars(tokens) as CSSProperties}>
      {fonts && (
        <link rel="stylesheet" href={fonts} />
      )}
      {children}
    </div>
  );
}
