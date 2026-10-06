import { config } from "../../config/client.config";
import type { DataProvider } from "../domain/models";
import { MockProvider } from "./mock";
import { CloudBaseProvider } from "./cloudbase";
import { RestApiProvider } from "./rest";
let current: DataProvider;
export function provider(): DataProvider {
  if (current) return current;
  if (config.backendMode === "CLOUDBASE" && config.cloudbaseEnv)
    current = new CloudBaseProvider(config.cloudbaseEnv);
  else if (config.backendMode === "REST_API")
    current = new RestApiProvider(config.apiBaseUrl);
  else
    current = new MockProvider(
      {
        get: (k) => wx.getStorageSync(k),
        set: (k, v) => wx.setStorageSync(k, v),
      },
      config.clientId,
    );
  return current;
}
