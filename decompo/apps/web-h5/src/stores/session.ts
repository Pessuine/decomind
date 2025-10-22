import { defineStore } from "pinia";
import api from "@/api/client";

interface ExecuteState {
  step?: { type: string; text: string };
  progress?: { current: number; total: number; percent: number };
  menu?: Array<{ key: string; label: string }>;
  history: string[];
  currentTask?: string;
  consentImprove: boolean;
}

export const useSessionStore = defineStore("session", {
  state: (): ExecuteState => ({
    step: undefined,
    progress: undefined,
    menu: undefined,
    history: [],
    currentTask: undefined,
    consentImprove: false,
  }),
  actions: {
    setConsent(val: boolean) {
      this.consentImprove = val;
      return api.post("/v1/consent", { version: 1, consented: val });
    },
    async startAction(task: string) {
      this.currentTask = task;
      this.history = [];
      const res = await api.post("/v1/execute", {
        version: 1,
        mode: "action",
        task: { title: task, history: this.history },
        consent_improve: this.consentImprove,
      });
      this.step = res.data.data.step;
      this.progress = res.data.data.progress;
      this.menu = res.data.data.menu;
      this.history.push(this.step?.text || "");
    },
    async nextStep() {
      if (!this.currentTask) return;
      const res = await api.post("/v1/execute", {
        version: 1,
        mode: "action",
        task: { title: this.currentTask, history: this.history },
        consent_improve: this.consentImprove,
      });
      this.step = res.data.data.step;
      this.progress = res.data.data.progress;
      this.menu = res.data.data.menu;
      this.history.push(this.step?.text || "");
    },
    async help(action: "simpler" | "alt" | "hint" | "split") {
      if (!this.step || !this.currentTask) return;
      const res = await api.post("/v1/help", {
        version: 1,
        mode: "action",
        action,
        context: { current: this.step.text, task: this.currentTask },
      });
      this.step = res.data.data.step;
    },
    async skip() {
      if (!this.step || !this.currentTask) return;
      const res = await api.post("/v1/skip", {
        version: 1,
        mode: "action",
        context: { current: this.step.text, task: this.currentTask },
      });
      this.step = res.data.data.step;
    },
    async guide(topic: string, depth: string) {
      const res = await api.post("/v1/guide", {
        version: 1,
        topic,
        depth,
      });
      return res.data.data.outline as Array<{ title: string; steps?: string[] }>;
    },
    async feedback(taskUuid: string, rating: "good" | "bad" | "neutral", note?: string) {
      await api.post("/v1/feedback", {
        version: 1,
        task_uuid: taskUuid,
        mode: "action",
        rating,
        note: note || "",
      });
    },
  },
});
