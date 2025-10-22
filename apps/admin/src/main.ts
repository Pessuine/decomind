import { createApp } from "vue";
import { createPinia } from "pinia";
import { create, NButton, NConfigProvider, NForm, NFormItem, NInput, NMessageProvider } from "naive-ui";
import App from "./App.vue";
import "./styles.css";

const naive = create({
  components: [NButton, NConfigProvider, NForm, NFormItem, NInput, NMessageProvider]
});

const app = createApp(App);
app.use(createPinia());
app.use(naive);
app.mount("#app");
