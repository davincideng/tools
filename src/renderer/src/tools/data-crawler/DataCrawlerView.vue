<script setup>
import { computed, ref } from 'vue'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { crawlerModules } from './modules.js'

defineEmits(['back'])

const activeId = ref(null)
const activeModule = computed(() => crawlerModules.find((item) => item.id === activeId.value))

function openModule(id) {
  activeId.value = id
}

function backToList() {
  activeId.value = null
}
</script>

<template>
  <component
    :is="activeModule.component"
    v-if="activeModule"
    :key="activeModule.id"
    @back="backToList"
  />

  <section v-else class="tool-page">
    <header class="tool-topbar">
      <el-button text :icon="ArrowLeft" @click="$emit('back')">返回首页</el-button>
      <div class="tool-topbar-title">
        <h2>数据爬取</h2>
        <div class="tool-topbar-meta">按数据来源选择采集方式，每种方式使用独立的采集与整理规则</div>
      </div>
      <el-tag effect="plain">{{ crawlerModules.length }} 个采集方式</el-tag>
    </header>

    <div class="crawler-index">
      <div class="crawler-index-head">
        <h3>采集方式</h3>
        <p>点击方块进入对应的采集界面</p>
      </div>

      <div class="tool-grid">
        <article
          v-for="module in crawlerModules"
          :key="module.id"
          class="tool-card"
          :class="{ pending: module.pending }"
          @click="openModule(module.id)"
        >
          <div class="tool-card-head">
            <div class="tool-icon">
              <el-icon><component :is="module.icon" /></el-icon>
            </div>
            <div>
              <h2>{{ module.name }}</h2>
              <div class="tool-category">{{ module.category }}</div>
            </div>
          </div>

          <p>{{ module.description }}</p>

          <div class="module-tags">
            <el-tag v-for="tag in module.tags" :key="tag" size="small" effect="plain">{{ tag }}</el-tag>
          </div>

          <div class="tool-card-footer">
            <el-tag v-if="module.pending" type="warning" size="small" effect="light">待完善</el-tag>
            <el-tag v-else type="success" size="small" effect="light">可用</el-tag>
            <el-icon color="#6b7a89"><ArrowRight /></el-icon>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.crawler-index {
  width: min(1120px, 100%);
  margin: 0 auto;
  padding: 26px 30px 40px;
}

.crawler-index-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
}

.crawler-index-head h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 650;
}

.crawler-index-head p {
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
}

.module-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}

.tool-card.pending {
  border-style: dashed;
}

@media (max-width: 900px) {
  .crawler-index {
    padding: 20px 18px 32px;
  }
}

@media (max-width: 620px) {
  .crawler-index-head {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
