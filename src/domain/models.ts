export interface Item {
  id: string;
  title: string;
  subtitle?: string;
  categoryId?: string;
  price?: number;
  duration?: string;
  description?: string;
  badge?: string;
  image?: string;
}
export type Collection = "banners" | "categories" | "services" | "cases";
export interface BookingInput {
  requestId: string;
  serviceId: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  note: string;
  consent: boolean;
}
export interface Booking extends BookingInput {
  id: string;
  status: string;
  createdAt: string;
  serviceTitle: string;
}
export interface FeedbackInput {
  requestId: string;
  message: string;
  consent: boolean;
}
export interface Feedback extends FeedbackInput {
  id: string;
  createdAt: string;
  status: string;
}
export interface Identity {
  id: string;
  mode: string;
}
export interface DataProvider {
  readonly mode: string;
  list(collection: Collection): Promise<Item[]>;
  identity(): Promise<Identity>;
  book(input: BookingInput): Promise<Booking>;
  bookings(): Promise<Booking[]>;
  cancel(id: string): Promise<void>;
  feedback(input: FeedbackInput): Promise<void>;
  upload(path: string): Promise<string>;
}
export interface PaymentProvider {
  pay(orderId: string): Promise<never>;
}
export class DisabledPaymentProvider implements PaymentProvider {
  async pay(_orderId: string): Promise<never> {
    void _orderId;
    throw new Error("真实支付未开通");
  }
}
export function validateBooking(x: BookingInput): void {
  if (!x.consent) throw new Error("请先阅读并同意隐私说明");
  if (!x.name.trim() || x.name.length > 40) throw new Error("请填写有效称呼");
  if (!/^1[3-9]\d{9}$/.test(x.phone)) throw new Error("请输入11位手机号");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(x.date) || !/^\d{2}:\d{2}$/.test(x.time))
    throw new Error("请选择日期和时间");
  const d = new Date(x.date + "T" + x.time + ":00+08:00");
  if (!Number.isFinite(d.getTime()) || d.getTime() < Date.now())
    throw new Error("请选择未来的预约时间");
  if (
    new Date(d.getTime() + 8 * 3600000).toISOString().slice(0, 10) !== x.date ||
    !["09:00", "10:30", "14:00", "15:30", "17:00"].includes(x.time)
  )
    throw new Error("日期或时间无效");
  if (x.note.length > 300) throw new Error("备注不能超过300字");
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(x.requestId))
    throw new Error("预约请求标识无效");
}
