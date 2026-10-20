import UaExpertView from './UaExpertView.vue'

export const uaExpertModule = {
  id: 'ua-expert',
  name: 'UaExpert 点位爬取',
  category: 'OPC UA 点位',
  description: '根据设备 IP 连接 OPC UA 服务，批量读取点位数据；采集与整理规则待补充。',
  icon: 'Connection',
  tags: ['OPC UA', '待完善'],
  component: UaExpertView,
  pending: true
}
