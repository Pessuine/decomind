<template>
  <n-space vertical size="large">
    <n-card title="模型配置">
      <n-form :model="model" label-placement="top">
        <n-form-item label="模型名称">
          <n-input v-model:value="model.model_name" />
        </n-form-item>
        <n-form-item label="API Base">
          <n-input v-model:value="model.api_base" />
        </n-form-item>
        <n-form-item label="API Key">
          <n-input v-model:value="model.api_key" type="password" />
        </n-form-item>
        <n-form-item label="Temperature">
          <n-input-number v-model:value="model.temperature" :min="0" :max="2" :step="0.1" />
        </n-form-item>
        <n-form-item label="Max Tokens">
          <n-input-number v-model:value="model.max_tokens" :min="64" :max="4096" />
        </n-form-item>
        <n-button type="primary" :loading="savingModel" @click="saveModel">保存模型配置</n-button>
      </n-form>
    </n-card>

    <n-card title="系统配置">
      <n-form :model="sys" label-placement="top">
        <n-grid cols="1 600:2" x-gap="16">
          <n-form-item-gi label="App Domain">
            <n-input v-model:value="sys.app_domain" />
          </n-form-item-gi>
          <n-form-item-gi label="API Domain">
            <n-input v-model:value="sys.api_domain" />
          </n-form-item-gi>
          <n-form-item-gi label="Admin Domain">
            <n-input v-model:value="sys.admin_domain" />
          </n-form-item-gi>
          <n-form-item-gi label="风险关键词">
            <n-input v-model:value="sys.risk_keywords" placeholder="逗号分隔" />
          </n-form-item-gi>
        </n-grid>
        <n-form-item label="体验改进采样">
          <n-switch v-model:value="sys.experience_sampling" />
        </n-form-item>
        <n-button type="primary" :loading="savingSys" @click="saveSys">保存系统配置</n-button>
      </n-form>
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
import { reactive, onMounted, ref } from 'vue';
import axios from 'axios';
import {
  NCard,
  NSpace,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NButton,
  NGrid,
  NFormItemGi,
  NSwitch,
  useMessage
} from 'naive-ui';

const message = useMessage();
const model = reactive({ model_name: '', api_base: '', api_key: '', temperature: 0.6, max_tokens: 256 });
const sys = reactive({ app_domain: '', api_domain: '', admin_domain: '', risk_keywords: '', experience_sampling: false });
const savingModel = ref(false);
const savingSys = ref(false);

async function loadConfig() {
  const { data } = await axios.get('/admin/config');
  Object.assign(model, data.model, { api_key: data.model.api_key || '' });
  Object.assign(sys, data.sys, { experience_sampling: data.sys.experience_sampling === 1 });
}

async function saveModel() {
  savingModel.value = true;
  try {
    await axios.put('/admin/config/model', model);
    message.success('已保存');
  } catch (err) {
    message.error('保存失败');
  } finally {
    savingModel.value = false;
  }
}

async function saveSys() {
  savingSys.value = true;
  try {
    await axios.put('/admin/config/sys', sys);
    message.success('已保存');
  } catch (err) {
    message.error('保存失败');
  } finally {
    savingSys.value = false;
  }
}

onMounted(loadConfig);
</script>
