<script setup>
import { reactive } from 'vue'
import { ArrowLeft, Search } from '@element-plus/icons-vue'

defineEmits(['back'])

const form = reactive({
  ip: '',
  port: '4840',
  endpoint: '',
  interval: '5000'
})

const pendingItems = [
  '点位清单来源：浏览地址空间、导入 NodeId 列表或按命名空间前缀批量匹配',
  'NodeId 解析与数据类型映射（Int16 / Float / Bool / String 等）',
  '批量读取的分批大小、并发数与失败重试策略',
  '采集结果整理方式：表格字段、单位换算、时间戳与时区处理',
  '导出格式（CSV / JSON）与历史采集记录对比'
]
</script>

<template>
  <section class="tool-page">
    <header class="tool-topbar">
      <el-button text :icon="ArrowLeft" @click="$emit('back')">返回数据爬取</el-button>
      <div class="tool-topbar-title">
        <h2>UaExpert 点位爬取</h2>
        <div class="tool-topbar-meta">按设备 IP 连接 OPC UA 服务并批量读取点位</div>
      </div>
      <el-tag type="warning" effect="plain">待完善</el-tag>
    </header>

    <div class="ua-content">
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="当前只搭建了界面骨架"
        description="连接配置与点位采集规则还在整理中，确定后会按 IP 建立连接并批量读取点位。"
      />

      <section class="ua-card">
        <div class="ua-card-head">
          <div>
            <h3>连接配置</h3>
            <p>先按 IP 建立连接，点位清单与整理规则后续补充。</p>
          </div>
          <div class="ua-card-state">
            <span class="state-dot"></span>
            未连接
          </div>
        </div>

        <div class="ua-form-grid">
          <label class="form-field">
            <span>设备 IP</span>
            <el-input v-model="form.ip" placeholder="例如 192.168.1.20" />
          </label>
          <label class="form-field">
            <span>端口</span>
            <el-input v-model="form.port" placeholder="4840" inputmode="numeric" />
          </label>
          <label class="form-field">
            <span>Endpoint 路径</span>
            <el-input v-model="form.endpoint" placeholder="默认 /" />
          </label>
          <label class="form-field">
            <span>采集间隔（毫秒）</span>
            <el-input v-model="form.interval" placeholder="5000" inputmode="numeric" />
          </label>
        </div>

        <div class="ua-actions">
          <el-button type="primary" disabled>
            <el-icon><Search /></el-icon>
            开始采集
          </el-button>
          <span class="ua-hint">采集规则未确定，按钮暂不可用</span>
        </div>
      </section>

      <section class="ua-card">
        <div class="ua-card-head">
          <div>
            <h3>待补充的细节</h3>
            <p>下面这些确定后，这个采集方式就可以真正跑起来。</p>
          </div>
        </div>
        <ul class="ua-list">
          <li v-for="item in pendingItems" :key="item">{{ item }}</li>
        </ul>
      </section>
    </div>
  </section>
</template>

<style scoped>
.ua-content {
  display: flex;
  width: min(1120px, 100%);
  flex-direction: column;
  gap: 16px;
  margin: 0 auto;
  padding: 26px 30px 40px;
}

.ua-card {
  padding: 18px 20px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
}

.ua-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.ua-card-head h3 {
  margin: 0 0 5px;
  font-size: 17px;
  font-weight: 650;
}

.ua-card-head p {
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
}

.ua-card-state {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 7px;
  padding-top: 3px;
  color: var(--text-muted);
  font-size: 12px;
}

.state-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #a8b3bf;
}

.ua-form-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field > span {
  color: var(--text-muted);
  font-size: 12px;
}

.ua-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
}

.ua-hint {
  color: var(--text-muted);
  font-size: 12px;
}

.ua-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 20px;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 900px) {
  .ua-content {
    padding: 20px 18px 32px;
  }

  .ua-form-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 620px) {
  .ua-form-grid {
    grid-template-columns: 1fr;
  }

  .ua-actions {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
