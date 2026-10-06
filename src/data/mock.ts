import seed from "./seed.json";
import {
  validateBooking,
  type DataProvider,
  type Collection,
  type Item,
  type BookingInput,
  type Booking,
  type FeedbackInput,
} from "../domain/models";
export interface Storage {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
}
export class MockProvider implements DataProvider {
  readonly mode = "MOCK";
  constructor(
    private storage: Storage,
    private namespace: string,
  ) {}
  private key(s: string) {
    return this.namespace + ":" + s;
  }
  async list(c: Collection): Promise<Item[]> {
    const custom = this.storage.get(this.key("catalog"));
    return ((custom || seed) as typeof seed)[c];
  }
  async identity() {
    return { id: "local-demo", mode: this.mode };
  }
  async bookings(): Promise<Booking[]> {
    return (this.storage.get(this.key("bookings")) || []) as Booking[];
  }
  async book(x: BookingInput) {
    validateBooking(x);
    const rows = await this.bookings();
    const previous = rows.find((y) => y.requestId === x.requestId);
    if (previous) return previous;
    const s = (await this.list("services")).find((y) => y.id === x.serviceId);
    if (!s) throw new Error("服务不存在");
    const row = {
      ...x,
      id: "demo-" + x.requestId,
      createdAt: new Date().toISOString(),
      status: "待确认（本地演示）",
      serviceTitle: s.title,
    };
    this.storage.set(this.key("bookings"), [row, ...rows]);
    return row;
  }
  async cancel(id: string) {
    this.storage.set(
      this.key("bookings"),
      (await this.bookings()).map((x) =>
        x.id === id ? { ...x, status: "已取消" } : x,
      ),
    );
  }
  async feedback(x: FeedbackInput) {
    if (!x.consent || !x.message.trim() || x.message.length > 1000)
      throw new Error("请填写1至1000字反馈并同意隐私说明");
    const key = this.key("feedback");
    const rows = (this.storage.get(key) || []) as FeedbackInput[];
    if (!rows.some((r) => r.requestId === x.requestId))
      this.storage.set(key, [{ ...x }, ...rows]);
  }
  async upload(_path: string): Promise<string> {
    void _path;
    throw new Error("本地模式不上传文件，请配置云环境");
  }
}
