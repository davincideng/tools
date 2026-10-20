import IpCrawlerView from './IpCrawlerView.vue'

export const ipCrawlerModule = {
  id: 'ip-crawler',
  name: 'IP 数据爬取',
  category: '接口 / 网页',
  description: '输入 IP、域名或完整 URL，请求目标接口或网页并提取返回数据。',
  icon: 'DataLine',
  tags: ['HTTP', 'HTTPS'],
  component: IpCrawlerView,
  pending: false
}
