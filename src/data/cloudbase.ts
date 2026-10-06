import type {
  DataProvider,
  Collection,
  Item,
  BookingInput,
  Booking,
  FeedbackInput,
  Identity,
} from "../domain/models";
export class CloudBaseProvider implements DataProvider {
  readonly mode = "CLOUDBASE";
  constructor(env: string) {
    wx.cloud.init({ env, traceUser: false });
  }
  private async call<T>(action: string, payload: unknown = {}): Promise<T> {
    const r = await wx.cloud.callFunction({
      name: "factory",
      data: { action, payload },
    });
    const result = r.result as { data?: T; error?: string };
    if (result.error) throw new Error(result.error);
    return result.data as T;
  }
  list(collection: Collection) {
    return this.call<Item[]>("list", { collection });
  }
  identity() {
    return this.call<Identity>("identity");
  }
  book(x: BookingInput) {
    return this.call<Booking>("book", x);
  }
  bookings() {
    return this.call<Booking[]>("bookings");
  }
  cancel(id: string) {
    return this.call<void>("cancel", { id });
  }
  feedback(x: FeedbackInput) {
    return this.call<void>("feedback", x);
  }
  async upload(filePath: string) {
    const user = await this.identity();
    const r = await wx.cloud.uploadFile({
      cloudPath: "feedback/" + user.id + "/" + Date.now() + ".jpg",
      filePath,
    });
    return r.fileID;
  }
}
