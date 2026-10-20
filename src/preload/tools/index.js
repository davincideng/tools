import { createIpCrawlerApi } from './ip-crawler/index.js'

export function createToolApis(ipcRenderer) {
  return {
    ipCrawler: createIpCrawlerApi(ipcRenderer)
  }
}
