"use client";

import * as LucideIcons from "lucide-react";
import React from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Icons = LucideIcons as unknown as Record<string, React.ComponentType<any>>;

interface IconProps {
  name: string;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

export function Icon({ name, className, size, style }: IconProps) {
  const LucideIcon = Icons[name];
  if (!LucideIcon) {
    return <Icons.HelpCircle className={className} size={size} style={style} />;
  }
  return <LucideIcon className={className} size={size} style={style} />;
}
