const cloud = require("wx-server-sdk");
const crypto = require("node:crypto");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const collections = ["banners", "categories", "services", "cases"];
function text(v, max) {
  if (typeof v !== "string" || !v.trim() || v.length > max)
    throw Error("输入内容无效");
  return v.trim();
}
exports.main = async (event) => {
  try {
    const { OPENID: openid } = cloud.getWXContext();
    if (!openid) throw Error("缺少可信微信身份");
    const { action, payload: p = {} } = event;
    const key = (prefix) =>
      prefix +
      "_" +
      crypto
        .createHash("sha256")
        .update(openid + ":" + text(p.requestId, 80))
        .digest("hex");
    if (action === "identity")
      return { data: { id: openid, mode: "CLOUDBASE" } };
    if (action === "list") {
      if (!collections.includes(p.collection)) throw Error("不允许的集合");
      return {
        data: (await db.collection(p.collection).limit(100).get()).data.map(
          (x) => ({ ...x, id: x._id }),
        ),
      };
    }
    if (action === "bookings")
      return {
        data: (
          await db
            .collection("bookings")
            .where({ _openid: openid })
            .orderBy("createdAt", "desc")
            .limit(100)
            .get()
        ).data.map((x) => ({ ...x, id: x._id })),
      };
    if (action === "book") {
      if (p.consent !== true) throw Error("请同意隐私说明");
      const name = text(p.name, 40),
        phone = text(p.phone, 11);
      if (!/^1[3-9]\d{9}$/.test(phone)) throw Error("手机号无效");
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(p.date) ||
        !["09:00", "10:30", "14:00", "15:30", "17:00"].includes(p.time)
      )
        throw Error("时间无效");
      const time = new Date(p.date + "T" + p.time + ":00+08:00").getTime();
      if (!Number.isFinite(time) || time < Date.now())
        throw Error("请选择未来时间");
      if (new Date(time + 8 * 3600000).toISOString().slice(0, 10) !== p.date)
        throw Error("日期无效");
      if (typeof p.note !== "string" || p.note.length > 300)
        throw Error("备注过长");
      const id = key("booking");
      const data = await db.runTransaction(async (tx) => {
        const existing = await tx.collection("bookings").doc(id).get();
        if (existing.data) return existing.data;
        const service = await tx
          .collection("services")
          .doc(text(p.serviceId, 80))
          .get();
        if (!service.data) throw Error("服务不存在");
        const row = {
          _openid: openid,
          requestId: p.requestId,
          serviceId: p.serviceId,
          serviceTitle: service.data.title,
          name,
          phone,
          date: p.date,
          time: p.time,
          note: p.note,
          consent: true,
          status: "待确认",
          createdAt: new Date().toISOString(),
        };
        await tx.collection("bookings").doc(id).set({ data: row });
        return row;
      });
      return { data: { ...data, id } };
    }
    if (action === "cancel") {
      const id = text(p.id, 90);
      await db.runTransaction(async (tx) => {
        const r = await tx.collection("bookings").doc(id).get();
        if (r.data._openid !== openid) throw Error("无权操作");
        if (r.data.status === "已完成") throw Error("已完成预约不可取消");
        await tx
          .collection("bookings")
          .doc(id)
          .update({ data: { status: "已取消" } });
      });
      return { data: null };
    }
    if (action === "feedback") {
      if (p.consent !== true) throw Error("请同意隐私说明");
      const message = text(p.message, 1000);
      await db
        .collection("feedback")
        .doc(key("feedback"))
        .set({
          data: {
            _openid: openid,
            message,
            consent: true,
            status: "待处理",
            createdAt: new Date().toISOString(),
          },
        });
      return { data: null };
    }
    throw Error("未知操作");
  } catch (e) {
    return { error: e.message || "服务暂不可用" };
  }
};
