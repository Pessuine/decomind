import { PrismaClient } from '@prisma/client';
import { encrypt } from 'config';

const prisma = new PrismaClient();

const seed = async (): Promise<void> => {
  const encryptionKey = process.env.CONFIG_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('CONFIG_ENCRYPTION_KEY is required for seeding');
  }

  const existingModel = await prisma.modelSetting.findFirst();
  if (!existingModel) {
    await prisma.modelSetting.create({
      data: {
        name: 'Default Qwen',
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        model: 'qwen-plus',
        temperature: 0.6,
        apiKeyEncrypted: encrypt('REPLACE_WITH_REAL_KEY', encryptionKey),
        isActive: true
      }
    });
  }

  const promptDefinitions = [
    {
      name: 'execute_step',
      description: 'Generate the next atomic execution step.',
      content: JSON.stringify({
        system:
          '你是分解力助手，擅长将目标分解为可以立即执行的最小行动。所有输出必须是 JSON。',
        user:
          '请基于以下信息给出下一步行动。任务: "{{task}}"，上下文: "{{context}}"，历史: {{history}}。确保只返回单个原子步骤，使用简短动词开头。'
      })
    },
    {
      name: 'help_strategy',
      description: 'Offer execution help strategies.',
      content: JSON.stringify({
        system:
          '你是分解力助手，在用户遇到困难时提供针对性的解决策略。所有输出必须是 JSON。',
        user:
          '用户在执行任务 "{{task}}" 的步骤 "{{step}}" 时请求 "{{helpType}}" 支持。请给出一个策略、建议和置信度。上下文: "{{context}}"。'
      })
    },
    {
      name: 'guide_outline',
      description: 'Produce a structured task outline.',
      content: JSON.stringify({
        system: '你是分解力助手，需要给出结构化的执行大纲，所有输出必须是 JSON。',
        user:
          '请根据任务 "{{task}}" 生成结构化执行大纲。上下文: "{{context}}"。请输出若干部分，每个部分包含标题、说明与原子步骤列表。'
      })
    }
  ];

  for (const prompt of promptDefinitions) {
    const existingPrompt = await prisma.prompt.findUnique({
      where: { name: prompt.name }
    });
    if (!existingPrompt) {
      const created = await prisma.prompt.create({
        data: {
          name: prompt.name,
          description: prompt.description,
          versions: {
            create: {
              content: prompt.content,
              createdBy: 'system'
            }
          }
        },
        include: { versions: true }
      });
      await prisma.prompt.update({
        where: { id: created.id },
        data: { activeVersionId: created.versions[0].id }
      });
    }
  }

  const hostConfig = await prisma.sysConfig.findUnique({ where: { key: 'allowed_hosts' } });
  if (!hostConfig) {
    await prisma.sysConfig.create({
      data: {
        key: 'allowed_hosts',
        value: JSON.stringify(['localhost', '127.0.0.1'])
      }
    });
  }

  const rateLimitConfig = await prisma.sysConfig.findUnique({ where: { key: 'rate_limit_per_minute' } });
  if (!rateLimitConfig) {
    await prisma.sysConfig.create({
      data: {
        key: 'rate_limit_per_minute',
        value: '60'
      }
    });
  }
};

seed()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('Database seeded');
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
