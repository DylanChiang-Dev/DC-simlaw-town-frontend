import type { CaseClosingEvaluation, CaseDocumentEntry } from '../services/types';
import type { DemoCase, DemoStage, DemoStageCode } from './demoTypes';

const NOW = '2026-05-20T10:00:00.000+08:00';
const STAGE_TITLES: Record<DemoStageCode, string> = {
  PLC: '原告咨询',
  CD: '起诉状起草',
  DLC: '被告咨询',
  DD: '答辩状起草',
  CI: '一审庭审',
  AD: '上诉状起草',
  AR: '上诉答辩状起草',
  CIA: '二审庭审',
};

const TOOL_SETS: Record<DemoStageCode, string[]> = {
  PLC: ['load_client_memory', 'search_laws'],
  CD: ['draft_complaint_document', 'check_citations'],
  DLC: ['search_cases', 'load_client_memory'],
  DD: ['draft_defense_document', 'compare_documents'],
  CI: ['read_case_artifact', 'search_cases', 'check_citations'],
  AD: ['draft_appeal_document', 'read_case_artifact'],
  AR: ['draft_appeal_response_document', 'compare_documents'],
  CIA: ['run_case_benchmark_evaluation', 'read_case_artifact'],
};

const SKILL_SETS: Record<DemoStageCode, string[]> = {
  PLC: ['client-memory-writing', 'lawyer-memory-writing'],
  CD: ['lawyer-complaint-drafting'],
  DLC: ['client-memory-writing'],
  DD: ['lawyer-defense-drafting'],
  CI: ['lawyer-memory-writing'],
  AD: ['lawyer-appeal-drafting'],
  AR: ['lawyer-appeal-response-drafting'],
  CIA: ['lawyer-memory-writing', 'case-closing-evaluation'],
};

const CASE_BLUEPRINTS = [
  {
    caseId: 'case_1',
    title: '尚东国际小区借款返还纠纷',
    plaintiffName: '马忠民',
    defendantName: '青海三兴房地产开发有限公司',
    trainingCategory: '民间借贷纠纷',
    difficulty: '综合',
    summary: '名为合作开发、实为借贷的房地产项目出资纠纷，争点集中在本金返还、利息标准和诉讼时效。',
    plaintiffKey: 'case1Plaintiff',
    defendantKey: 'case1Defendant',
    fact: '2012 年投入 1000 万元参与房地产项目，银行附言写明“借款”，多年未参与经营分红，对方仅退还 200 万元。',
    plaintiffConcern: '剩余 800 万本金和资金占用利息能否追回。',
    defensePoint: '被告主张款项具有项目合作背景，利息约定不明，不应按高息支持。',
    firstJudgment: '一审确认双方构成民间借贷关系，支持返还 800 万本金，并按法定上限调整资金占用利息。',
    appealFocus: '上诉围绕月息约定、历史付息流水和律师费保全费承担展开。',
    finalJudgment: '二审维持本金返还结论，对利息起算和部分费用承担作出调整，确认高于法定保护上限的部分不予支持。',
    complaintClaim: '判令被告偿还借款本金 800 万元，并支付自 2018 年 2 月起至实际清偿日止的资金占用利息。',
    appealClaim: '请求二审改判支持更早期间的利息和合理维权费用。',
    score: 91,
  },
  {
    caseId: 'case_3',
    title: '三方代偿协议借款纠纷',
    plaintiffName: '杨英沛',
    defendantName: '王伟、陈琪',
    trainingCategory: '民间借贷纠纷',
    difficulty: '复杂',
    summary: '三方协议下的债务代偿纠纷，核心是原债务人是否免责、代偿人配偶是否承担共同债务。',
    plaintiffKey: 'case3Plaintiff',
    defendantKey: 'case3Defendant',
    fact: '李某、王伟与杨英沛签署三方协议，约定 1800 万债务由王伟代偿，但王伟未按约履行。',
    plaintiffConcern: '能否同时追究原债务人、代偿人及其配偶责任。',
    defensePoint: '被告称协议仅约束王伟个人，陈琪未共同签字，也未用于夫妻共同生活。',
    firstJudgment: '一审支持王伟承担还款责任，但对陈琪共同债务责任采谨慎态度。',
    appealFocus: '上诉强调夫妻共同购房投资、抵押文件签字和债务利益共享。',
    finalJudgment: '二审综合房产投资、签字文件和资金用途，对夫妻共同债务责任作出更严格的证据评价。',
    complaintClaim: '判令王伟偿还 1800 万本金及利息，并请求陈琪对夫妻共同债务承担责任。',
    appealClaim: '请求撤销一审部分判项，改判陈琪承担共同清偿责任或发回重审。',
    score: 88,
  },
  {
    caseId: 'case_5',
    title: '多笔借款与以房抵债纠纷',
    plaintiffName: '苗海民',
    defendantName: '薛海山、河北金博园房地产开发有限公司',
    trainingCategory: '民间借贷纠纷',
    difficulty: '复杂',
    summary: '多笔高额借款、以房抵债和公司连带责任交织，争点集中在抵债效力、利息计算和公司责任。',
    plaintiffKey: 'case5Plaintiff',
    defendantKey: 'case5Defendant',
    fact: '薛海山前后四次借款两千余万元，存在借条、转账记录和录音，双方曾讨论 50 套房产抵债。',
    plaintiffConcern: '剩余本金、利息和公司是否一起承担责任。',
    defensePoint: '被告主张 50 套房产已抵债，且部分款项来源和公司责任不应纳入本案。',
    firstJudgment: '一审对借款本金和主要利息予以支持，对以房抵债抗辩未全部采纳。',
    appealFocus: '二审重点回应以房抵债是否成立、公司是否承担连带责任及配偶责任。',
    finalJudgment: '二审认为以房抵债缺乏完成交付和权属变更基础，维持主要还款责任，对部分利息和责任范围作出调整。',
    complaintClaim: '判令薛海山偿还借款本金及利息，并请求金博园公司承担连带清偿责任。',
    appealClaim: '请求驳回对方关于以房抵债和免责的上诉理由，维持一审核心判项。',
    score: 90,
  },
  {
    caseId: 'case_6',
    title: '破产企业待岗工龄确认纠纷',
    plaintiffName: '杨志华',
    defendantName: '山东永泰照明电器股份有限公司',
    trainingCategory: '劳动争议',
    difficulty: '综合',
    summary: '企业破产背景下的待岗职工劳动关系确认，争点是“两不找”期间是否中止劳动关系。',
    plaintiffKey: 'case6Plaintiff',
    defendantKey: 'case6Defendant',
    fact: '1987 年入职灯泡厂，2012 年后未再上班，但公司持续缴纳医保，破产管理人认定部分期间“两不找”。',
    plaintiffConcern: '连续工龄、经济补偿金、待岗生活费和失业保险损失是否应重新计算。',
    defensePoint: '公司主张长期未提供劳动、未主张权利，双方处于劳动关系中止状态。',
    firstJudgment: '一审确认部分劳动关系和经济补偿，对待岗期间生活费和损失赔偿支持有限。',
    appealFocus: '上诉强调医保缴纳、企业待岗安排和破产管理人认定错误。',
    finalJudgment: '二审结合社保缴纳和待岗事实，对劳动关系存续作进一步确认，但对部分长期未主张费用仍作限制。',
    complaintClaim: '确认劳动关系连续存续，并支付待岗生活费、经济补偿金和失业保险损失。',
    appealClaim: '请求改判连续工龄和待岗期间权益，纠正“两不找”认定。',
    score: 87,
  },
  {
    caseId: 'case_7',
    title: '保安加班费与解除补偿纠纷',
    plaintiffName: '胡廷友',
    defendantName: '新疆亚中集团伊犁投资有限公司',
    trainingCategory: '劳动争议',
    difficulty: '基础',
    summary: '保安岗位解除劳动关系后的加班工资、社保补缴和经济补偿争议。',
    plaintiffKey: 'case7Plaintiff',
    defendantKey: 'case7Defendant',
    fact: '2015 年至 2018 年担任保安，有劳动合同、银行流水、防火巡查记录和解除证明。',
    plaintiffConcern: '社保未缴、长期加班未足额支付和被解除后的经济补偿。',
    defensePoint: '公司认为工资表已经包含加班费，解除属于协商一致，不应再支付额外补偿。',
    firstJudgment: '一审支持部分经济补偿和年休假工资，对高额加班费诉求采谨慎态度。',
    appealFocus: '上诉围绕工资表证明力、巡查记录和工作年限计算展开。',
    finalJudgment: '二审重新审查考勤和工资证据，对经济补偿计算作适度调整，对超出证明范围的加班费不全部支持。',
    complaintClaim: '判令公司支付加班工资、经济补偿、年休假工资及社保相关损失。',
    appealClaim: '请求二审纠正加班费举证责任和经济补偿年限计算。',
    score: 86,
  },
  {
    caseId: 'case_9',
    title: '破产企业保安劳动关系确认纠纷',
    plaintiffName: '徐海峰',
    defendantName: '山东永泰照明电器股份有限公司',
    trainingCategory: '劳动争议',
    difficulty: '综合',
    summary: '长期待岗、社保缴纳和破产债权认定交织，重点展示全生命周期案件推进。',
    plaintiffKey: 'client',
    defendantKey: 'defendant',
    fact: '1994 年入厂担任保安，2006 年后被动待岗，公司仍缴医保并代收养老保险，破产后管理人仅部分承认工龄。',
    plaintiffConcern: '工龄、经济补偿金、待岗生活费和失业保险待遇均受影响。',
    defensePoint: '管理人认为 2006 年后双方“两不找”，原告长期未提供劳动且请求超过时效。',
    firstJudgment: '一审对劳动关系存续和部分补偿作限制性支持，未完全采纳原告连续工龄主张。',
    appealFocus: '上诉强调工资存折、奖状、医保连续缴纳和养老保险收据形成完整证据链。',
    finalJudgment: '二审确认社保缴纳对劳动关系存续具有重要证明力，对工龄和补偿范围作出调整，但对超过证明范围的待岗生活费不全部支持。',
    complaintClaim: '确认 1994 年至破产受理日劳动关系连续存续，并支付相应补偿和损失。',
    appealClaim: '请求撤销一审部分判项，按实际工龄重新计算经济补偿和相关损失。',
    score: 92,
  },
] as const;

export const DEMO_CASES: DemoCase[] = CASE_BLUEPRINTS.map((item) => {
  const stages = buildStages(item);
  return {
    caseId: item.caseId,
    closing: {
      evaluation: buildEvaluation(item),
      finalJudgment: buildFinalJudgment(item),
      playerTurnCount: 4,
    },
    defendantName: item.defendantName,
    defendantKey: item.defendantKey,
    difficulty: item.difficulty,
    documents: buildDocuments(item),
    plaintiffKey: item.plaintiffKey,
    plaintiffName: item.plaintiffName,
    stages,
    summary: item.summary,
    title: item.title,
    trainingCategory: item.trainingCategory,
  };
});

export const DEMO_CASE_IDS = DEMO_CASES.map((item) => item.caseId);

export function findDemoCase(caseId: string): DemoCase | null {
  return DEMO_CASES.find((item) => item.caseId === caseId) || null;
}

function buildStages(item: typeof CASE_BLUEPRINTS[number]): DemoStage[] {
  return [
    stage(item, 'PLC', {
      speaker: item.plaintiffKey,
      speakerName: item.plaintiffName,
      sceneText: `律师你好，我是${item.plaintiffName}。${item.fact}我最关心的是：${item.plaintiffConcern}`,
      entries: [
        { speaker: 'system', speakerName: '系统', text: `案件已进入离线演示沙盒：${item.title}。` },
        { speaker: item.plaintiffKey, speakerName: item.plaintiffName, text: `律师你好，我想咨询这个案子。${item.fact}现在我最担心的是${item.plaintiffConcern}` },
        { speaker: 'playerLawyer', speakerName: '李婷', text: `我先把案件拆成三个问题：法律关系如何定性、关键证据是否能闭合、下一步诉讼请求如何组织。当前材料里，${item.fact}，这会成为后续文书和庭审的主线。`, playerResponsibility: true },
      ],
      task: {
        kind: 'reply',
        contextSummary: `${item.plaintiffName}陈述：${item.fact}`,
        prompt: `请以原告律师身份回应当事人，说明下一步要补齐哪些证据，并给出清晰推进路径。`,
        presetText: `我们会先固定三类材料：第一，证明基础事实的原始凭证；第二，能够支撑${item.plaintiffConcern}的金额和时间线；第三，能反驳对方可能提出的“${item.defensePoint}”的证据。接下来我会把这些事实写入起诉状，并在庭审中围绕争点逐项回应。`,
        polishedText: `从现有材料看，本案可以围绕“事实链条、证据链条、请求金额”三条线推进。请优先补齐原始凭证、付款或社保记录、沟通记录和金额明细；我会据此组织起诉状，并提前准备对方可能提出的抗辩。`,
      },
    }),
    stage(item, 'CD', {
      speaker: 'playerLawyer',
      speakerName: '李婷',
      sceneText: `起诉状草稿已围绕“${item.complaintClaim}”形成。`,
      entries: [
        { speaker: 'system', speakerName: '系统', text: '进入起诉状起草阶段，系统读取咨询记录和案件事实。' },
        { speaker: 'playerLawyer', speakerName: '李婷', text: `起诉状不能只写结论。我们要把事实经过、证据来源、诉讼请求和法律依据对应起来，重点落在：${item.complaintClaim}`, playerResponsibility: true },
      ],
      document: {
        fileName: `${item.caseId}-complaint-demo.pdf`,
        text: buildComplaint(item),
        title: '民事起诉状',
      },
      task: {
        kind: 'document',
        contextSummary: `已完成原告咨询。核心事实：${item.fact}`,
        followups: [
          { question: '最能直接证明核心事实的材料是什么？', answer: `现有材料包括原始凭证、沟通记录及能够印证“${item.fact}”的辅助证据。` },
          { question: '诉讼请求的金额或权益范围是否能拆分？', answer: `可以按本金/补偿、利息或损失、程序费用三个层次拆分，并保留法院调整空间。` },
        ],
        prompt: '请根据咨询事实确认起诉状正文，保证请求、事实和证据能够相互对应。',
        presetText: buildComplaint(item),
      },
    }),
    stage(item, 'DLC', {
      speaker: item.defendantKey,
      speakerName: item.defendantName,
      sceneText: `被告方收到材料，主要抗辩为：${item.defensePoint}`,
      entries: [
        { speaker: 'system', speakerName: '系统', text: '起诉状已提交法院，被告方进入咨询阶段。' },
        { speaker: item.defendantKey, speakerName: item.defendantName, text: `我们不同意原告的全部说法。${item.defensePoint}，希望律师帮我们判断如何应诉。` },
        { speaker: 'opponentLawyer', speakerName: '赵雪', text: '我会先核对原告证据是否能够证明请求基础，再决定答辩重点和是否提出反证。' },
      ],
    }),
    stage(item, 'DD', {
      speaker: 'opponentLawyer',
      speakerName: '赵雪',
      sceneText: '被告答辩状形成，案件准备进入一审。',
      entries: [
        { speaker: 'system', speakerName: '系统', text: '答辩状起草阶段开始。' },
        { speaker: 'opponentLawyer', speakerName: '赵雪', text: `答辩意见将围绕原告举证不足、金额计算和责任范围展开。核心抗辩是：${item.defensePoint}` },
      ],
      document: {
        fileName: `${item.caseId}-defense-demo.pdf`,
        text: buildDefense(item),
        title: '民事答辩状',
      },
    }),
    stage(item, 'CI', {
      speaker: 'judge',
      speakerName: '刘正',
      sceneText: '一审庭审围绕核心争点展开。',
      entries: [
        { speaker: 'system', speakerName: '系统', text: '一审正式开庭。' },
        { speaker: 'judge', speakerName: '刘正', text: `原告方，请围绕本案事实基础、证据链条以及对“${item.defensePoint}”的回应发表意见。` },
      ],
      task: {
        kind: 'court',
        contextSummary: `一审争点：${item.defensePoint}`,
        prompt: '请代表原告方完成庭审陈述，回应被告主要抗辩。',
        presetText: `原告方认为，现有证据能够证明${item.fact}。被告关于“${item.defensePoint}”的抗辩不能推翻核心事实。请求法院结合原始凭证、履行行为和双方陈述，支持我方关于“${item.complaintClaim}”的诉讼请求。`,
      },
    }),
    stage(item, 'AD', {
      speaker: 'playerLawyer',
      speakerName: '李婷',
      sceneText: `一审结果：${item.firstJudgment}`,
      entries: [
        { speaker: 'system', speakerName: '系统', text: `一审判决已生成：${item.firstJudgment}` },
        { speaker: 'playerLawyer', speakerName: '李婷', text: `当事人决定上诉。上诉重点不是重复一审，而是抓住二审能改判的事实和法律适用错误：${item.appealFocus}`, playerResponsibility: true },
      ],
      document: {
        fileName: `${item.caseId}-appeal-demo.pdf`,
        text: buildAppeal(item),
        title: '民事上诉状',
      },
      task: {
        kind: 'document',
        contextSummary: `一审结果：${item.firstJudgment}`,
        followups: [
          { question: '一审最需要纠正的部分是什么？', answer: item.appealFocus },
          { question: '二审希望达到的最低目标是什么？', answer: item.appealClaim },
        ],
        prompt: '请确认上诉状的请求和理由，突出一审判决可改判的部分。',
        presetText: buildAppeal(item),
      },
    }),
    stage(item, 'AR', {
      speaker: 'opponentLawyer',
      speakerName: '赵雪',
      sceneText: '被上诉方提交答辩意见。',
      entries: [
        { speaker: 'system', speakerName: '系统', text: '上诉状已递交，被上诉方进入答辩阶段。' },
        { speaker: 'opponentLawyer', speakerName: '赵雪', text: `答辩意见将请求二审维持一审核心认定，并逐项回应上诉理由：${item.appealFocus}` },
      ],
      document: {
        fileName: `${item.caseId}-appeal-response-demo.pdf`,
        text: buildAppealResponse(item),
        title: '民事上诉答辩状',
      },
    }),
    stage(item, 'CIA', {
      speaker: 'appealJudge',
      speakerName: '海瑞',
      sceneText: `终审结果：${item.finalJudgment}`,
      entries: [
        { speaker: 'system', speakerName: '系统', text: '二审正式开庭，合议庭围绕上诉争点进行审查。' },
        { speaker: 'appealJudge', speakerName: '海瑞', text: `本院围绕上诉请求、答辩意见和一审查明事实进行审查。${item.finalJudgment}` },
        { speaker: 'system', speakerName: '系统', text: '本案已完成二审庭审并生成终审结果，进入结案评分与复盘。' },
      ],
    }),
  ];
}

function stage(
  item: typeof CASE_BLUEPRINTS[number],
  code: DemoStageCode,
  patch: Omit<DemoStage, 'code' | 'title' | 'activeTools' | 'activeSkills' | 'memory' | 'pipeline'>,
): DemoStage {
  return {
    activeSkills: SKILL_SETS[code],
    activeTools: TOOL_SETS[code],
    code,
    memory: `已沉淀${item.plaintiffName}案 ${STAGE_TITLES[code]} 的事实、证据和争点。`,
    pipeline: `法律全生命周期：原告咨询 -> 起诉状 -> 被告答辩 -> 一审 -> 上诉 -> 二审 -> 评分`,
    title: STAGE_TITLES[code],
    ...patch,
  };
}

function buildComplaint(item: typeof CASE_BLUEPRINTS[number]): string {
  return `民事起诉状

原告：${item.plaintiffName}
被告：${item.defendantName}

诉讼请求：
1. ${item.complaintClaim}
2. 判令被告承担本案诉讼费用及合理维权费用。

事实与理由：
${item.fact}。原告已经提供能够证明基础事实和履行过程的材料。被告长期未按法律关系履行相应义务，已经影响原告的合法权益。

本案起诉状围绕事实、证据、请求三项展开，后续庭审将重点回应被告可能提出的抗辩：${item.defensePoint}`;
}

function buildDefense(item: typeof CASE_BLUEPRINTS[number]): string {
  return `民事答辩状

答辩人：${item.defendantName}

答辩意见：
1. 原告对部分事实和金额的主张缺乏充分证据支持。
2. ${item.defensePoint}
3. 即使法院认定答辩人应承担责任，也应依法审查责任范围、期间和计算标准。

答辩人请求法院依法驳回原告超出证据证明范围的诉讼请求。`;
}

function buildAppeal(item: typeof CASE_BLUEPRINTS[number]): string {
  return `民事上诉状

上诉人：${item.plaintiffName}
被上诉人：${item.defendantName}

上诉请求：
${item.appealClaim}

事实与理由：
一审判决虽然处理了部分争议，但仍存在事实认定或法律适用需要纠正之处。二审应重点审查：${item.appealFocus}。上述问题直接影响本案责任范围和权益实现，应依法予以改判。`;
}

function buildAppealResponse(item: typeof CASE_BLUEPRINTS[number]): string {
  return `民事上诉答辩状

答辩人：${item.defendantName}

答辩意见：
一审判决对主要事实和证据已经作出审查，上诉人的理由不能当然推翻原审认定。关于“${item.appealFocus}”，答辩人认为仍应结合原审证据、举证责任和法律保护边界综合判断。

请求二审法院依法驳回上诉或在法定范围内作出处理。`;
}

function buildFinalJudgment(item: typeof CASE_BLUEPRINTS[number]): string {
  return `终审判决摘要

本院经审理认为，${item.fact} 是判断本案法律关系和责任范围的基础。对一审处理结果，二审重点审查了：${item.appealFocus}。

裁判结果：
${item.finalJudgment}

本判决为终审判决。系统已同步生成文书清单、玩家提交记录和表现评分。`;
}

function buildDocuments(item: typeof CASE_BLUEPRINTS[number]): CaseDocumentEntry[] {
  return [
    documentItem(item.caseId, 'CD', 'complaint', '民事起诉状'),
    documentItem(item.caseId, 'DD', 'defense', '民事答辩状'),
    documentItem(item.caseId, 'AD', 'appeal', '民事上诉状'),
    documentItem(item.caseId, 'AR', 'appeal-response', '民事上诉答辩状'),
    documentItem(item.caseId, 'CIA', 'final-judgment', '二审民事判决书'),
  ];
}

function documentItem(caseId: string, stage: string, key: string, title: string): CaseDocumentEntry {
  return {
    available: true,
    caseId,
    documentKey: key,
    documentType: stage,
    downloadUrl: '#demo',
    fileName: `${caseId}-${key}.pdf`,
    stage,
    title,
  };
}

function buildEvaluation(item: typeof CASE_BLUEPRINTS[number]): CaseClosingEvaluation {
  const base = item.score;
  return {
    dimensions: [
      { label: '事实把握', maxScore: 25, score: Math.min(25, Math.round(base * 0.25)) },
      { label: '法律论证', maxScore: 25, score: Math.min(25, Math.round(base * 0.24)) },
      { label: '程序/任务完成', maxScore: 25, score: Math.min(25, Math.round(base * 0.26)) },
      { label: '表达与职业沟通', maxScore: 25, score: Math.min(25, Math.round(base * 0.25)) },
    ],
    generatedAt: NOW,
    improvements: [
      `庭审中可以更早把对方抗辩“${item.defensePoint}”拆成事实、证据和法律三层回应。`,
      '文书金额或权益范围可以进一步表格化，便于法官快速核对。',
    ],
    overallScore: base,
    strengths: [
      `能够抓住本案核心事实：${item.fact}`,
      `上诉阶段能够围绕“${item.appealFocus}”继续推进，而不是重复一审意见。`,
    ],
    summary: `本轮演示完成了${item.title}从咨询到终审的全流程。玩家关键提交覆盖咨询回复、文书确认和庭审陈述，系统据此生成结案评分。`,
  };
}
