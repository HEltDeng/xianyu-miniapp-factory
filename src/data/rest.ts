import type {
  DataProvider,
  Collection,
  Item,
  BookingInput,
  Booking,
  FeedbackInput,
  Identity,
} from "../domain/models";
export class RestApiProvider implements DataProvider {
  readonly mode = "REST_API";
  private token = "";
  constructor(private base: string) {
    if (!/^https:\/\//.test(base))
      throw new Error("REST_API 必须配置 HTTPS 地址");
    this.base = base.replace(/\/$/, "");
  }
  private request<T>(
    path: string,
    method: "GET" | "POST" = "GET",
    data: Record<string, unknown> = {},
  ): Promise<T> {
    return new Promise((resolve, reject) =>
      wx.request({
        url: this.base + path,
        method,
        data,
        timeout: 15000,
        header: { Authorization: this.token ? "Bearer " + this.token : "" },
        success: (r) => {
          if (r.statusCode >= 200 && r.statusCode < 300) resolve(r.data as T);
          else reject(new Error("服务请求失败 " + r.statusCode));
        },
        fail: () => reject(new Error("网络连接失败，请稍后重试")),
      }),
    );
  }
  async identity(): Promise<Identity> {
    const login =
      await new Promise<WechatMiniprogram.LoginSuccessCallbackResult>(
        (resolve, reject) => wx.login({ success: resolve, fail: reject }),
      );
    const r = await this.request<{ token: string; user: Identity }>(
      "/auth/wechat",
      "POST",
      { code: login.code },
    );
    this.token = r.token;
    return r.user;
  }
  list(c: Collection) {
    return this.request<Item[]>("/catalog/" + c);
  }
  async book(x: BookingInput) {
    if (!this.token) await this.identity();
    return this.request<Booking>("/bookings", "POST", { ...x });
  }
  async bookings() {
    if (!this.token) await this.identity();
    return this.request<Booking[]>("/bookings");
  }
  async cancel(id: string) {
    if (!this.token) await this.identity();
    await this.request(
      "/bookings/" + encodeURIComponent(id) + "/cancel",
      "POST",
    );
  }
  async feedback(x: FeedbackInput) {
    if (!this.token) await this.identity();
    await this.request("/feedback", "POST", { ...x });
  }
  async upload(_path: string): Promise<string> {
    void _path;
    throw new Error("REST 上传接口需按客户服务器适配");
  }
}
