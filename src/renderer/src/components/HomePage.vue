<script setup>
defineProps({
  tools: {
    type: Array,
    required: true
  }
})

defineEmits(['open'])
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>数据工具集</h1>
        <p>选择一个功能方块开始使用</p>
      </div>
      <div class="header-side">
        <el-tag type="success" effect="plain">可用 {{ tools.filter((tool) => tool.ready).length }}</el-tag>
        <el-tag effect="plain">工具位 {{ tools.length }}</el-tag>
      </div>
    </header>

    <div class="tool-grid">
      <article
        v-for="tool in tools"
        :key="tool.id"
        class="tool-card"
        :class="{ disabled: !tool.ready }"
        :style="tool.ready ? {} : { cursor: 'default' }"
        @click="tool.ready && $emit('open', tool.id)"
      >
        <div class="tool-card-head">
          <div class="tool-icon">
            <el-icon><component :is="tool.icon" /></el-icon>
          </div>
          <div>
            <h2>{{ tool.name }}</h2>
            <div class="tool-category">{{ tool.category }}</div>
          </div>
        </div>
        <p>{{ tool.description }}</p>
        <div class="tool-card-footer">
          <el-tag v-if="tool.ready" type="success" size="small" effect="light">可用</el-tag>
          <el-tag v-else size="small" effect="plain">待添加</el-tag>
          <el-icon v-if="tool.ready" color="#6b7a89"><ArrowRight /></el-icon>
        </div>
      </article>
    </div>
  </div>
</template>
