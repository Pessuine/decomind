import { createApp } from './app.js';
import { appConfig } from './config/env.js';

const bootstrap = async () => {
  const app = await createApp();
  app.listen(appConfig.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on port ${appConfig.port}`);
  });
};

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start API', error);
  process.exit(1);
});
