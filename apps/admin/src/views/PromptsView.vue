<template>
  <n-card title="Prompt 管理">
    <n-space vertical>
      <n-alert type="info">修改后点击保存即可热更新，历史版本保留在数据库。</n-alert>
      <n-select v-model:value="selected" :options="options" placeholder="选择 Prompt" />
      <n-input v-model:value="editor" type="textarea" :rows="14" />
      <n-button type="primary" :loading="saving" @click="save">保存</n-button>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import { useMessage, NCard, NSpace, NAlert, NSelect, NInput, NButton } from 'naive-ui';

const message = useMessage();
const options = ref<{ label: string; value: string }[]>([]);
const selected = ref('');
const editor = ref('');
const saving = ref(false);

async function fetchPrompts() {
  const { data } = await axios.get('/admin/prompts');
  options.value = data.map((item: any) => ({ label: `${item.name} v${item.version}`, value: item.name }));
}

async function loadContent() {
  if (!selected.value) return;
  const { data } = await axios.get(`/admin/prompts/${selected.value}`);
  editor.value = data.content;
}

async function save() {
  if (!selected.value) return;
  saving.value = true;
  try {
    await axios.post(`/admin/prompts/${selected.value}`, { content: editor.value });
    message.success('已保存并热更新');
    fetchPrompts();
  } catch (err) {
    message.error('保存失败');
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await fetchPrompts();
  selected.value = options.value[0]?.value || '';
  await loadContent();
});

watch(selected, loadContent);
</script>
