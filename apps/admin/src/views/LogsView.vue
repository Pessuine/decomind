<template>
  <n-card title="请求日志" size="large">
    <n-space vertical>
      <n-form inline :model="filters">
        <n-form-item label="接口">
          <n-input v-model:value="filters.endpoint" placeholder="/v1/execute" />
        </n-form-item>
        <n-form-item label="状态">
          <n-select v-model:value="filters.status" :options="statusOptions" clearable />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" @click="fetchLogs">筛选</n-button>
        </n-form-item>
      </n-form>
      <n-data-table :columns="columns" :data="rows" :pagination="pagination" />
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';
import { DataTableColumns, useMessage, NCard, NSpace, NForm, NFormItem, NInput, NSelect, NButton, NDataTable } from 'naive-ui';

interface LogRow {
  id: number;
  endpoint: string;
  status: string;
  ts: string;
  latency_ms: number;
}

const message = useMessage();
const filters = reactive({ endpoint: '', status: '' });
const rows = ref<LogRow[]>([]);
const pagination = { pageSize: 10 };
const statusOptions = [
  { label: '成功', value: 'ok' },
  { label: '失败', value: 'error' }
];

const columns: DataTableColumns<LogRow> = [
  { title: '时间', key: 'ts' },
  { title: '接口', key: 'endpoint' },
  { title: '状态', key: 'status' },
  { title: '耗时(ms)', key: 'latency_ms' }
];

async function fetchLogs() {
  try {
    const { data } = await axios.get('/admin/logs', { params: filters });
    rows.value = data;
  } catch (err) {
    message.error('加载失败');
  }
}

onMounted(fetchLogs);
</script>
