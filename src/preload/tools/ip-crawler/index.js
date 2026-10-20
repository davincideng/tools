export function createIpCrawlerApi(ipcRenderer) {
  return {
    run: (config) => ipcRenderer.invoke('ip-crawler:run', config)
  }
}
