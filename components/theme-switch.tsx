"use client"

import { Switch, type SwitchProps } from "@/components/ui/switch"

type ThemeSwitchProps = Omit<SwitchProps, "size" | "showThemeLabels">

export default function ThemeSwitch(props: ThemeSwitchProps) {
  return <Switch {...props} size="theme" showThemeLabels />
}
