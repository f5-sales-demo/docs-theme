export interface IconSetData {
  icons: Record<string, { body: string; width?: number; height?: number }>;
  width?: number;
  height?: number;
  info?: { palette?: boolean };
}
