# IP 数据工具集

一个基于 Electron + Vue 3 + Element Plus 的本地小工具集合。首页以功能方块的形式展示工具，点击方块进入具体功能。

当前有一个可用功能：**数据爬取**。点进去后按方块选择具体的采集方式，目前包含：

- **IP 数据爬取**：根据 IP、域名或完整 URL，向目标接口或网页发起 HTTP/HTTPS 请求，并展示返回的数据。
- **UaExpert 点位爬取**：根据设备 IP 连接 OPC UA 服务批量读取点位，目前只有界面骨架，采集与数据整理规则待补充。

## 技术栈

- Electron 33 + electron-vite
- Vue 3（`<script setup>`）+ Element Plus
- Node.js 内置 `http` / `https` 模块

## 开发

```bash
npm install
npm run dev
```

> 注：Windows 下 `electron.vite.config.mjs` 默认设置 `NO_SANDBOX=1`（Chromium 沙箱初始化失败时，Electron 会在 `start electron app...` 之后静默退出）。如需恢复沙箱，运行前设置 `NO_SANDBOX=0`。

VSCode 打开项目后，安装工作区推荐的 Vue 相关扩展即可。

## 常用命令

```bash
npm run dev          # 开发模式
npm run build        # 构建 out/ 产物
npm run start        # 预览构建产物
```

## 目录结构

```text
src/
  main/
    index.js                    # Electron 主进程入口
    tools/
      index.js                  # 主进程工具 IPC 汇总
      ip-crawler/
        index.js                # IP 爬取工具 IPC 注册
        service.js              # HTTP/HTTPS 采集逻辑
  preload/
    index.js                    # preload 入口
    tools/
      index.js                  # 工具 API 汇总
      ip-crawler/
        index.js                # IP 爬取工具桥接 API
  renderer/
    src/
      App.vue                   # 侧边栏 + 首页/功能切换
      components/
        HomePage.vue            # 功能方块列表
      styles/
        theme.css               # 全局布局与主题
      tools/
        registry.js                 # 顶层工具清单
        data-crawler/
          index.js                  # 数据爬取（顶层工具）
          DataCrawlerView.vue       # 采集方式方块列表 + 子界面切换
          modules.js                # 采集方式清单
          ip-crawler/
            index.js                # IP 数据爬取注册清单
            IpCrawlerView.vue       # IP 数据爬取界面
          ua-expert/
            index.js                # UaExpert 点位爬取注册清单
            UaExpertView.vue        # UaExpert 点位爬取界面（骨架）
```

顶层工具放在 `tools/<tool>/` 下；如果一个工具内部还要按数据来源细分，就在该目录里继续建同名子目录，并在 `modules.js` 里挂载，界面用 `DataCrawlerView.vue` 这样的方块列表做二级入口。

## IP 数据爬取

入口：数据爬取 → IP 数据爬取。支持以下能力：

- 目标地址：IP、域名、`IP:端口/路径` 或完整 URL
- 协议：HTTP / HTTPS
- 请求方法：GET、POST、PUT、PATCH、DELETE
- 自定义端口、路径、请求头和请求体
- 请求超时、自动重定向、忽略 HTTPS 证书错误
- 返回状态码、耗时、响应大小、内容编码、响应头
- JSON 自动格式化展示，HTML 自动提取标题和页面描述
- 响应内容最多展示 5 MB，超过后会显示截断提示

请求逻辑全部在主进程执行，渲染进程保持 `nodeIntegration: false`，通过 preload 提供的 `window.tools.ipCrawler.run()` 调用。

## UaExpert 点位爬取

入口：数据爬取 → UaExpert 点位爬取。

目前只有界面骨架：设备 IP、端口、Endpoint 路径、采集间隔等连接配置已就位，采集按钮暂不可用。待补充的规则：

- 点位清单来源（浏览地址空间 / 导入 NodeId 列表 / 按命名空间前缀匹配）
- NodeId 解析与数据类型映射
- 批量读取的分批大小、并发数与重试策略
- 结果整理方式（表格字段、单位换算、时间戳处理）与导出格式

规则确定后，按 `ip-crawler` 的分层方式补 `src/main/tools/ua-expert/` 与 `src/preload/tools/ua-expert/`，再把按钮接到 `window.tools.uaExpert.run()`。

## 添加新功能

### 在数据爬取里新增采集方式

1. 在 `src/renderer/src/tools/data-crawler/<module>/` 下创建界面组件和 `index.js`，导出一个带 `id`、`name`、`category`、`description`、`icon`、`component` 的模块对象。
2. 在 `src/renderer/src/tools/data-crawler/modules.js` 的 `crawlerModules` 里加进去，方块列表会自动出现。
3. 需要主进程能力时，再按下面的分层方式补主进程和 preload。

### 新增顶层工具

以新增 `demo-tool` 为例：

1. 在 `src/renderer/src/tools/demo-tool/` 中创建界面组件和 `index.js` 注册清单。
2. 在 `src/main/tools/demo-tool/` 中创建主进程服务和 IPC 注册。
3. 在 `src/preload/tools/demo-tool/` 中创建桥接 API。
4. 分别在前端 `registry.js`、主进程 `tools/index.js` 和 preload `tools/index.js` 中挂载新工具。

前端工具清单示例：

```js
import DemoView from './DemoView.vue'

export const demoTool = {
  id: 'demo-tool',
  name: '你的功能',
  category: '功能分类',
  description: '一句话说明这个功能做什么。',
  icon: 'Tools',
  component: DemoView,
  ready: true
}
```

需要访问文件、网络、数据库或其他系统能力时，按 `ip-crawler` 的分层方式放到主进程，再通过 preload 暴露给渲染进程。
