import { registerIpCrawlerIpc } from './ip-crawler/index.js'

export function registerToolIpcHandlers(ipcMain) {
  registerIpCrawlerIpc(ipcMain)
}
