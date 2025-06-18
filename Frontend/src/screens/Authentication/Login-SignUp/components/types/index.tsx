export interface MFASetupData {
  uri: string;
  secret: string;
  backup_codes: string[];
}

export type MFAStep = "login" | "setup" | "verify" | "backup";
export type FormStep = 1 | 2;
export type ActiveTab = "login" | "register";

export interface UserType {
  value: string;
  label: string;
}

export interface Feature {
  icon: string;
  title: string;
  desc: string;
}
