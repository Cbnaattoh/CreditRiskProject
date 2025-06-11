export interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

export interface SecurityFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  toggle: () => void;
  color: string;
}

export interface ThemeOption {
  id: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
}
