# 配置驱动架构
config/client.json 是唯一客户参数源；config/client.config.ts 提供类型。
原生 WXML/WXSS + 小型页面控制器 → domain/models.ts → DataProvider → Mock / CloudBase / REST。
业务校验独立于页面；Mock 的 Storage 可在微信、本地测试和预览中替换。真实支付由 DisabledPaymentProvider 拒绝。
设计体系在 design-tokens；green / blue / pink / orange / blackgold 五种主题，原创资产可重生成。

build 根据 features 生成 app.json、tabBar 及页面目录。关闭模块的页面不会进入 dist；共享 Provider 接口保留跨模式契约。未实现功能不可启用。home 与 settings 为最低交付底线。service 关联 category/search/booking。profile 独立于付费会员 member。

Web Admin 与 miniprogram 分目录。Admin 默认本机持久化、会话请求令牌、Host/Origin 检查，仅监听127.0.0.1；不能直接公网部署。本地种子与设备本地记录不自动同步。云模式由本机 SDK 管理独立环境。
preview 是读取同一 dist 代码与 WXML 的浏览器辅助渲染器，非微信运行时；不作为微信编译/真机证据。

