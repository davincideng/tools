<script setup>
import { computed, ref } from 'vue'
import HomePage from './components/HomePage.vue'
import { tools } from './tools/registry'

const currentToolId = ref(null)

const currentTool = computed(() => tools.find((tool) => tool.id === currentToolId.value))

function openTool(id) {
  if (currentToolId.value === id) return
  currentToolId.value = id
}

function goHome() {
  currentToolId.value = null
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand" @click="goHome">
        <div class="brand-mark">
          <el-icon><Grid /></el-icon>
        </div>
        <div>
          <div class="brand-name">IP 数据工具集</div>
          <div class="brand-sub">Data Tools</div>
        </div>
      </div>

      <nav class="nav">
        <div class="nav-label">工具</div>
        <button
          v-for="tool in tools"
          :key="tool.id"
          class="nav-item"
          :class="{ active: currentToolId === tool.id, disabled: !tool.ready }"
          :disabled="!tool.ready"
          @click="openTool(tool.id)"
        >
          <el-icon :size="16"><component :is="tool.icon" /></el-icon>
          <span>{{ tool.name }}</span>
        </button>
      </nav>

      <div class="sidebar-footer">Electron · Vue 3</div>
    </aside>

    <main class="main">
      <HomePage v-if="!currentTool" :tools="tools" @open="openTool" />
      <component :is="currentTool.component" v-else :key="currentTool.id" @back="goHome" />
    </main>
  </div>
</template>
