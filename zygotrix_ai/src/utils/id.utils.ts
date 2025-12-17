export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const generateConversationId = (): string => {
  return `conv-${generateId()}`;
};

export const generateMessageId = (): string => {
  return `msg-${generateId()}`;
};
