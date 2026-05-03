export const RUNTIME_TECH_DISPLAY_NAMES: Record<string, string> = {
  'search_laws': '法条检索',
  'search_cases': '类案检索',
  'check_citations': '法条引用校验',
  'compare_documents': '文书差异比较',
  'run_case_benchmark_evaluation': '单案评测',
  'read_case_artifact': '读取案件产物',
  'load_skill': '加载专业技能',
  'load_client_memory': '读取当事人记忆',
  'load_lawyer_memory': '读取律师记忆',
  'save_client_memory': '写入当事人记忆',
  'save_lawyer_memory': '写入律师记忆',
  'draft_complaint_document': '生成民事起诉状',
  'draft_defense_document': '生成民事答辩状',
  'draft_appeal_document': '生成民事上诉状',
  'draft_appeal_response_document': '生成上诉答辩状',
  'draft_first_instance_judgment_document': '生成一审判决书',
  'draft_second_instance_judgment_document': '生成二审判决书',
  'lawyer-complaint-drafting': '起诉状起草规则',
  'lawyer-defense-drafting': '答辩状起草规则',
  'lawyer-appeal-drafting': '上诉状起草规则',
  'lawyer-appeal-response-drafting': '上诉答辩状起草规则',
  'client-memory-writing': '当事人记忆写入规则',
  'lawyer-memory-writing': '律师记忆写入规则',
};

export function formatRuntimeTechLabel(value: string): string {
  const displayName = RUNTIME_TECH_DISPLAY_NAMES[value.trim()];
  return displayName ? `${displayName}（${value}）` : value;
}

export function getRuntimeTechDisplayName(value: string): string {
  return RUNTIME_TECH_DISPLAY_NAMES[value.trim()] || value;
}
