import { prisma } from 'database';

export const findPromptByName = async (name: string) => {
  return prisma.prompt.findUnique({
    where: { name },
    include: {
      activeVersion: true
    }
  });
};

export const listPrompts = async () => {
  return prisma.prompt.findMany({
    include: {
      activeVersion: true,
      versions: {
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const createPromptVersion = async (
  promptId: string,
  content: string,
  createdBy: string
) => {
  const version = await prisma.promptVersion.create({
    data: {
      promptId,
      content,
      createdBy
    }
  });
  await prisma.prompt.update({
    where: { id: promptId },
    data: {
      activeVersionId: version.id
    }
  });
  return version;
};

export const createPrompt = async (
  name: string,
  description: string,
  content: string,
  createdBy: string
) => {
  return prisma.prompt.create({
    data: {
      name,
      description,
      versions: {
        create: {
          content,
          createdBy
        }
      }
    },
    include: {
      versions: true
    }
  });
};

export const activatePromptVersion = async (promptId: string, versionId: string) => {
  return prisma.prompt.update({
    where: { id: promptId },
    data: { activeVersionId: versionId }
  });
};

export const rollbackPrompt = async (promptId: string, versionId: string) => {
  return activatePromptVersion(promptId, versionId);
};
