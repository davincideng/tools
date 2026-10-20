import { dataCrawlerTool } from './data-crawler/index.js'

export const tools = [
  dataCrawlerTool,
  {
    id: 'slot-2',
    name: '后续功能',
    category: '扩展工具位',
    description: '新的数据工具可以在工具注册表中直接挂载。',
    icon: 'Tools',
    component: null,
    ready: false
  },
  {
    id: 'slot-3',
    name: '后续功能',
    category: '扩展工具位',
    description: '新功能会继续以功能方块的形式出现在首页。',
    icon: 'Box',
    component: null,
    ready: false
  }
]
