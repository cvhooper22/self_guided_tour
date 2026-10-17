"use client";
import { useEffect } from "react";
import { themeAttrs, tokensToCssVars, type ThemeTokens } from "@/lib/themes";

/**
 * Lets a tour theme restyle the site header above it. The header lives in the root layout (outside any ThemeScope),
 * so a page that knows its tour theme renders this to apply the theme's variables and data-* switches to #site-nav,
 * and removes them again on the way out.
 */
export default function NavTheme({ tokens }: { tokens: ThemeTokens }) {
  useEffect(() => {
    const el = document.getElementById("site-nav");
    if (!el) return;
    const vars = tokensToCssVars(tokens);
    const attrs = themeAttrs(tokens);
    for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    el.classList.add("themed");
    return () => {
      for (const k of Object.keys(vars)) el.style.removeProperty(k);
      for (const k of Object.keys(attrs)) el.removeAttribute(k);
      el.classList.remove("themed");
    };
  }, [tokens]);
  return null;
}
