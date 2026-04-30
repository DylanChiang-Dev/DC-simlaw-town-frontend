export const RUNTIME_TECH_DISPLAY_NAMES: Record<string, string> = {
  'load_client_memory': '读取当事人记忆',
  'load_lawyer_memory': '读取律师记忆',
  'save_client_memory': '写入当事人记忆',
  'save_lawyer_memory': '写入律师记忆',
  'client-memory-writing': '当事人记忆写入规则',
  'lawyer-memory-writing': '律师记忆写入规则',
};

export function formatRuntimeTechLabel(value: string): string {
  const displayName = RUNTIME_TECH_DISPLAY_NAMES[value.trim()];
  return displayName ? `${displayName}（${value}）` : value;
}
