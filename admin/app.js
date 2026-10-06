const names = {
  banners: "首页 Banner",
  categories: "服务分类",
  services: "服务项目",
  cases: "案例展示",
  bookings: "预约管理",
  feedback: "用户反馈",
};
let collection = "services",
  rows = [],
  token = "";
const el = (id) => document.getElementById(id);
const safe = (v) => {
  const e = document.createElement("span");
  e.textContent = String(v ?? "");
  return e.innerHTML
    .replaceAll(String.fromCharCode(34), "&quot;")
    .replaceAll(String.fromCharCode(39), "&#39;");
};
async function api(p, method = "GET", data) {
  const r = await fetch("/api/" + p, {
    method,
    headers: { "Content-Type": "application/json", "X-Factory-Token": token },
    body: data ? JSON.stringify(data) : undefined,
  });
  const x = await r.json();
  if (!r.ok) throw Error(x.error);
  return x;
}
async function load() {
  try {
    el("error").textContent = "";
    rows = await api(collection);
    el("heading").textContent = names[collection];
    el("count").textContent = rows.length;
    el("new").hidden = ["bookings", "feedback"].includes(collection);
    el("thead").innerHTML =
      "<tr><th>内容 / 编号</th><th>信息</th><th>操作</th></tr>";
    el("rows").innerHTML = rows.length
      ? rows
          .map(
            (r) =>
              "<tr><td>" +
              (r.image ? '<img alt="" src="' + safe(r.image) + '">' : "") +
              safe(r.title || r.serviceTitle || r.id) +
              "</td><td>" +
              safe(r.status || r.subtitle || "—") +
              '</td><td><button data-edit="' +
              safe(r.id) +
              '">编辑</button><button data-delete="' +
              safe(r.id) +
              '">删除</button></td></tr>',
          )
          .join("")
      : '<tr><td colspan="3">暂无记录。云端预约需要真实环境联调；本地演示数据不会自动同步。</td></tr>';
    document
      .querySelectorAll("[data-edit]")
      .forEach(
        (b) =>
          (b.onclick = () => edit(rows.find((r) => r.id === b.dataset.edit))),
      );
    document.querySelectorAll("[data-delete]").forEach(
      (b) =>
        (b.onclick = async () => {
          if (confirm("确认删除这条记录？"))
            try {
              await api(collection, "DELETE", { id: b.dataset.delete });
              await load();
            } catch (e) {
              el("error").textContent = e.message;
            }
        }),
    );
  } catch (e) {
    el("error").textContent = e.message;
  }
}
function edit(row = { id: "item-" + Date.now() }) {
  const privateRow = ["bookings", "feedback"].includes(collection);
  const fields = privateRow
    ? ["id", "status"]
    : [
        "id",
        "title",
        "subtitle",
        ...(collection === "services"
          ? ["categoryId", "price", "duration", "badge"]
          : []),
        "image",
        "description",
      ];
  el("fields").innerHTML = fields
    .map(
      (k) =>
        "<label>" +
        safe(
          {
            id: "编号",
            title: "标题",
            subtitle: "副标题",
            categoryId: "分类编号",
            price: "价格（元）",
            duration: "服务时长",
            badge: "标签",
            image: "图片路径 /assets/space.png",
            description: "详细说明",
            status: "处理状态",
          }[k],
        ) +
        (k === "status"
          ? '<select name="status">' +
            (collection === "bookings"
              ? ["待确认", "已确认", "已完成", "已取消"]
              : ["待处理", "已处理"]
            )
              .map(
                (s) =>
                  "<option " +
                  (row.status === s ? "selected" : "") +
                  ">" +
                  s +
                  "</option>",
              )
              .join("") +
            "</select>"
          : '<input name="' +
            k +
            '" value="' +
            safe(row[k] ?? "") +
            '" ' +
            (k === "id" ? "readonly" : "") +
            " " +
            (k === "price" ? 'type="number" min="0" step="0.01"' : "") +
            ">") +
        "</label>",
    )
    .join("");
  if (privateRow) {
    const detail = document.createElement("pre");
    detail.textContent = JSON.stringify(row, null, 2);
    el("fields").prepend(detail);
  }
  el("editor").showModal();
}
el("form").onsubmit = async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  if ("price" in data) data.price = Number(data.price);
  try {
    await api(collection, "POST", data);
    el("editor").close();
    await load();
  } catch (err) {
    el("error").textContent = err.message;
    el("editor").close();
  }
};
el("close").onclick = () => el("editor").close();
el("new").onclick = () => edit();
el("export").onclick = async () => {
  try {
    const data = await api("export");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    a.download = "catalog.json";
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) {
    el("error").textContent = e.message;
  }
};
for (const [k, name] of Object.entries(names)) {
  const b = document.createElement("button");
  b.textContent = name;
  b.className = k === collection ? "active" : "";
  b.onclick = () => {
    collection = k;
    document.querySelectorAll("nav button").forEach((x) => (x.className = ""));
    b.className = "active";
    load();
  };
  el("nav").append(b);
}
try {
  const s = await api("session");
  token = s.token;
  el("mode").textContent = s.mode === "MOCK" ? "● 本地演示数据" : "● CloudBase";
  await load();
} catch (e) {
  el("error").textContent = e.message;
}
