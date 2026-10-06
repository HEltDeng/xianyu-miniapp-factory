import raw from "./client.json";
export type BackendMode = "MOCK" | "CLOUDBASE" | "REST_API";
export interface ClientConfig {
  clientId: string;
  appName: string;
  shortName: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  contactPhone: string;
  wechat: string;
  companyName: string;
  copyright: string;
  backendMode: BackendMode;
  cloudbaseEnv: string;
  apiBaseUrl: string;
  appId: string;
  theme: string;
  features: Record<string, boolean>;
  navigation: string[];
  pageCount: number;
  admin: boolean;
  extraRevisions: number;
}
export const config = raw as ClientConfig;
