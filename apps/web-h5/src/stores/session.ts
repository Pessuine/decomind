import { defineStore } from 'pinia';
import client from '../api/client';

interface TaskState {
  title: string;
  history: string[];
  progress?: { current: number; total: number; percent: number };
}

interface StepResult {
  type: string;
  text: string;
}

export const useSessionStore = defineStore('session', {
  state: () => ({
    mode: 'action' as 'action' | 'guide',
    consentImprove: false,
    currentTask: null as TaskState | null,
    lastStep: null as StepResult | null,
    menu: [] as { key: string; label: string }[],
    outline: [] as any[]
  }),
  actions: {
    setTask(title: string) {
      this.currentTask = { title, history: [] };
    },
    async setConsent(value: boolean) {
      this.consentImprove = value;
      try {
        await client.post('/v1/consent', { version: 1, consented: value });
      } catch (err) {
        // ignore
      }
    },
    async executeNext() {
      if (!this.currentTask) return;
      const { data } = await client.post('/v1/execute', {
        version: 1,
        mode: 'action',
        task: { title: this.currentTask.title, history: this.currentTask.history },
        prefs: {},
        consent_improve: this.consentImprove
      });
      this.lastStep = data.data.step;
      this.menu = data.data.menu || [];
      if (data.data.progress) {
        this.currentTask.progress = data.data.progress;
      }
      this.currentTask.history.push(this.lastStep.text);
    },
    async requestHelp(action: string) {
      if (!this.currentTask || !this.lastStep) return;
      const { data } = await client.post('/v1/help', {
        version: 1,
        mode: 'action',
        action,
        context: { current: this.lastStep.text, task: this.currentTask.title }
      });
      this.lastStep = data.data.step;
      this.currentTask.history.push(this.lastStep.text);
    },
    async skipStep() {
      if (!this.currentTask || !this.lastStep) return;
      const { data } = await client.post('/v1/skip', {
        version: 1,
        mode: 'action',
        context: { current: this.lastStep.text, task: this.currentTask.title }
      });
      this.lastStep = data.data.step;
      this.currentTask.history.push(this.lastStep.text);
    },
    async requestGuide(topic: string, depth: 'light' | 'normal' | 'deep') {
      const { data } = await client.post('/v1/guide', { version: 1, topic, depth });
      this.outline = data.data.outline;
      this.mode = 'guide';
    },
    reset() {
      this.currentTask = null;
      this.lastStep = null;
      this.menu = [];
      this.outline = [];
    }
  }
});
