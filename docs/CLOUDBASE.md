# CloudBase 接入与隔离
状态：Provider、云函数、后台适配已实现；真实账号/环境联调 BLOCKED。不得以单元测试代替云环境验收。

1. 客户主体注册小程序并提供 AppID，由管理员授权开发者。每客户独立 CloudBase 环境，禁止复用其他正式项目环境。
2. 主体在控制台自行开通已有授权的环境；本项目不购买资源。将非秘密的 AppID、cloudbaseEnv 写入 config/client.json，并选择 CLOUDBASE。
3. pnpm run build 后，以微信开发者工具导入 dist。上传部署 dist/cloudfunctions/factory，并安装其 package.json 中的依赖。此操作属于未来客户部署，本次未执行。
4. 创建 banners / categories / services / cases / bookings / feedback 六个集合。所有集合均设为“仅管理端可读写”，或使用 cloudfunctions/database.rules.json。小程序所有业务经 factory 云函数。
5. 导入 src/data/seed.json 的四组目录数据，每条记录 id 必须转换为数据库文档 _id。使用本机 Admin 的 CloudBase 模式维护后续内容。
6. 参考 cloudfunctions/function.rules.json 配置函数调用规则；factory 内仍必须从 getWXContext 取 OPENID，并限制预约读取/取消的归属。云函数运行时可绕过数据库规则，故不能删除这些校验。
7. 云存储必须在控制台配置仅创建者可读写并核验规则，确认 feedback/{openid}/ 路径隔离。此处细粒度规则官方页本次访问失败，实际规则与越权测试仍 BLOCKED；核验前不要开启正式用户上传。
8. 本机后台：设置 FACTORY_ADMIN_MODE=CLOUDBASE 与 CLOUDBASE_ENV_ID，使用 SDK 支持的本机环境身份/临时凭据（不写入仓库）。pnpm run admin。后台只绑定 127.0.0.1；没有云凭据会失败，不会冒充云模式写本地。
9. 必测：两微信用户交叉查询和取消均不能越权；同一 requestId 重试仅产生一条预约；反馈和上传归属；管理端修改目录可在小程序刷新；拒绝隐私授权；断网错误；恢复网络后重试。
10. 环境为空时自动 Mock 并展示提示；环境非空但调用失败时显示错误，不回退到本地接单。

当前限制：目录及预约列表上限100条；大量真实业务上线前补分页、审计、保留期限及删除申请、业务限流。预约是意向登记，不含排班锁位。上传为独立基础能力，不自动附加到反馈。后台是本机管理工具，不是可公网开放的多用户后台。

