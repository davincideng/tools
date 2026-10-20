import DataCrawlerView from './DataCrawlerView.vue'

export const dataCrawlerTool = {
  id: 'data-crawler',
  name: '数据爬取',
  category: '网络采集',
  description: '按数据类型选择采集方式：IP 数据爬取、UaExpert 点位爬取。',
  icon: 'DataLine',
  component: DataCrawlerView,
  ready: true
}
