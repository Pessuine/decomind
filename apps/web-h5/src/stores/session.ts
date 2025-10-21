import { defineStore } from 'pinia';
import api from '../lib/api';

export interface ActionStep {
  step: { type: 'action'; text: string };
  progress?: { current: number; total: number; percent: number };
  menu?: Array<{ key: string; label: string }>;
}

interface ApiEnvelope<T> {
  version: number;
  status: 'ok' | 'error';
  meta: { request_id: string; latency_ms: number };
  data: T;
  error: null | { code: string; message: string };
}

export const useSessionStore = defineStore('session', {
  state: () => ({
    loading: false,
    error: '',
    step: null as ActionStep | null,
    progress: { current: 0, total: 0 },
    consentImprove: false,
    topic: '',
    outline: [] as Array<{ title: string; steps?: string[] }>,
    history: [] as string[],
  }),
  actions: {
    async execute(task: { title: string; history: string[] }) {
      this.loading = true;
      this.error = '';
      this.history = task.history.slice();
      try {
        const res = await api.post<ApiEnvelope<{ step: ActionStep['step']; progress?: ActionStep['progress']; menu?: ActionStep['menu'] }>>(
          '/v1/execute',
          {
            version: 1,
            mode: 'action',
            task,
            consent_improve: this.consentImprove,
          },
        );
        this.step = { step: res.data.data.step, progress: res.data.data.progress, menu: res.data.data.menu };
        if (res.data.data.progress) {
          this.progress.current = res.data.data.progress.current;
          this.progress.total = res.data.data.progress.total;
        }
        if (res.data.data.step?.text) {
          this.history = task.history.slice();
        }
      } catch (err) {
        this.error = '加载失败，请重试';
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async completeCurrent(taskTitle: string) {
      if (!this.step) return;
      const updatedHistory = [...this.history, this.step.step.text];
      await this.execute({ title: taskTitle, history: updatedHistory });
    },
    async help(action: string, context: { current: string; task: string }) {
      this.loading = true;
      this.error = '';
      try {
        const res = await api.post<ApiEnvelope<{ step: ActionStep['step'] }>>('/v1/help', {
          version: 1,
          mode: 'action',
          action,
          context,
        });
        this.step = {
          step: res.data.data.step,
          progress: this.step?.progress,
          menu: this.step?.menu,
        } as ActionStep;
      } catch (err) {
        this.error = '加载失败，请重试';
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async skip(context: { current: string; task: string }) {
      this.loading = true;
      this.error = '';
      try {
        const res = await api.post<ApiEnvelope<{ step: ActionStep['step'] }>>('/v1/skip', {
          version: 1,
          mode: 'action',
          context,
        });
        this.step = {
          step: res.data.data.step,
          progress: this.step?.progress,
          menu: this.step?.menu,
        } as ActionStep;
      } catch (err) {
        this.error = '加载失败，请重试';
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async guide(topic: string, depth: 'light' | 'normal' | 'deep' = 'normal') {
      this.loading = true;
      this.error = '';
      try {
        const res = await api.post<ApiEnvelope<{ outline: Array<{ title: string; steps?: string[] }> }>>('/v1/guide', {
          version: 1,
          topic,
          depth,
        });
        this.outline = res.data.data.outline;
        this.topic = topic;
      } catch (err) {
        this.error = '加载失败，请重试';
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
