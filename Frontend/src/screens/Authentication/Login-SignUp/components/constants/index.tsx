import type { UserType, Feature } from "../types";

export const USER_TYPES: readonly UserType[] = [
  { value: "Admin", label: "Administrator" },
  { value: "User", label: "Standard User" },
  { value: "Analyst", label: "Risk Analyst" },
  { value: "Auditor", label: "Compliance Auditor" },
] as const;

export const FEATURES: readonly Feature[] = [
  {
    icon: "📊",
    title: "Real-Time Analytics",
    desc: "Instant risk scoring",
  },
  {
    icon: "🔒",
    title: "Bank-Level Security",
    desc: "256-bit encryption",
  },
  {
    icon: "🤖",
    title: "AI Predictions",
    desc: "Machine learning models",
  },
] as const;

export const ANIMATION_VARIANTS = {
  pageEnter: {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.6, ease: "easeOut" },
  },
  formSlide: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  errorShake: {
    animate: { x: [-10, 10, -10, 10, 0] },
    transition: { duration: 0.5 },
  },
} as const;
