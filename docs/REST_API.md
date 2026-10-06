# REST API 契约
客户端 baseUrl 来自配置，必须 HTTPS。所有响应为 JSON，非2xx进入错误状态，超时15秒。
|方法|路径|行为|
|---|---|---|
|POST|/auth/wechat|输入 code，服务端调用官方 code2Session，返回 {token,user:{id,mode}}；AppSecret只留服务端|
|GET|/catalog/{banners,categories,services,cases}|返回 Item[]，不含私密字段|
|POST|/bookings|BookingInput，服务端校验身份/同意/字段/未来日期及服务，requestId幂等，返回Booking|
|GET|/bookings|Bearer token，仅本人记录|
|POST|/bookings/{id}/cancel|Bearer token，校验归属及状态|
|POST|/feedback|FeedbackInput，服务端校验并持久化|

此版实现客户端适配，未提供客户 Node/Java/Python 生产服务；REST 基础文件上传尚未适配，明确报错。不得把端点契约写成已部署。CVM 可通过 HTTPS 域名/反向代理接入；域名、TLS、备案、合法域名、监控、鉴权和支付回调须按客户场景实施。本次没有连接任何生产服务器。

