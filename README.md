# Mini Program Factory · 闲鱼小程序定制工厂
独立、配置驱动的微信原生服务预约母版。当前稳定范围为本地演示与生产工具链；云端、微信工具和真实主体流程按 RELEASE_READINESS 标记，不能视为已上线。
## 快速运行
需要 Node.js 22+ 与 pnpm。
```powershell
pnpm install --frozen-lockfile --ignore-scripts
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm test
pnpm run check
pnpm run admin
```
后台 http://127.0.0.1:4173/；辅助预览 http://127.0.0.1:4173/preview。预览不代替微信编译器。
微信开发者工具导入 dist 目录。默认 touristappid 开发模式；真实能力须客户 AppID，工具不允许游客模式时使用客户测试 AppID。
## 客户生成与报价
```powershell
node scripts/new-client.mjs --name "ABC美容" --theme pink --backend cloudbase --modules home,service,booking,profile --admin true
node scripts/quote.mjs --config config/client.json --output .runtime/客户报价单.md
```
客户输出到本项目 04_Client-Projects；禁止同名覆盖及路径穿越。生成后在客户目录安装依赖、构建和验收。母版不因客户生成而变更。
客户 logo、AppID、电话、微信号在 config/client.json 修改；Logo 需放入 assets。主题值支持 green / blue / pink / orange / blackgold。
## 内容维护
本机后台可管理 Banner、分类、服务、案例；查看预约与反馈并处理状态。Mock后台和微信设备本地记录独立，不冒充同步。后台导出目录后运行：
```powershell
node scripts/import-catalog.mjs --file path/to/catalog.json
pnpm run build
```
云模式见 docs/CLOUDBASE.md。REST契约见 docs/REST_API.md。销售范围见 docs/SALES_SCOPE.md。
## 页面与边界
首页、分类、服务列表、详情、案例、预约、记录、搜索、反馈、个人中心、设置隐私，共11页。
微信支付关闭；无真实推送消息、排班锁位、订单、商城或会员积分功能。未实现模块启用时构建拒绝。
仅配置云环境为空时回退 Mock；配置后故障直接显示错误。
## 目录
config 配置与报价；src 业务与Provider；miniprogram 原生页面；design-tokens 设计体系；assets 原创示意图；cloudfunctions 云函数；admin 本机后台；scripts 构建/生成/报价；tests 自动验证；docs 长期文档。
不提交 node_modules、dist、.runtime、凭据、私钥、生产数据。本仓库不属于任何已有正式项目。


## GitHub / Mac 恢复

私有仓库：`HEltDeng/xianyu-miniapp-factory`，恢复分支 `migration/source-baseline`。
在 Mac 安装 Node.js 22+、pnpm 后，按上面的 `pnpm install --frozen-lockfile --ignore-scripts`、typecheck、lint、build、test、check 顺序恢复；这些命令可直接在终端运行。不要复制 Windows 的 node_modules 或 dist。
`config/client.json` 是无私密值的演示配置，`assets/` 为应用实际使用的 UI 资源；云函数源码在 `cloudfunctions/factory`。构建脚本生成微信项目配置，微信开发者工具导入生成的 dist。实际客户 AppID/云环境在本地配置；AppSecret/私钥只由外部受限配置提供，不能写入前端。微信真机验收、云部署与发布独立进行。
