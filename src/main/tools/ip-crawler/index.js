import { crawl } from './service.js'

export function registerIpCrawlerIpc(ipcMain) {
  ipcMain.handle('ip-crawler:run', async (_event, config) => {
    try {
      return {
        success: true,
        data: await crawl(config)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  })
}
