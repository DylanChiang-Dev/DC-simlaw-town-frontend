import { BuildVersionBadge } from '../components/BuildVersionBadge';
import { CaseTimeline } from '../components/CaseTimeline';
import { CommandHud } from '../components/CommandHud';
import { DialogueBox } from '../components/DialogueBox';
import { MarkdownText } from '../components/MarkdownText';
import { PlayerLawyerTaskPanel } from '../components/PlayerLawyerTaskPanel';
import { TaskWorkbenchShell } from '../components/TaskWorkbenchShell';
import { TechLedger } from '../components/TechLedger';
import { TownRadar } from '../components/TownRadar';
import { VisualNovelStage } from '../components/VisualNovelStage';
import type { FrontendDemoScene, FrontendDemoWorkbench } from './frontendDemoFixtures';
import {
  DEMO_USER,
  FRONTEND_DEMO_SCENES,
  getFrontendDemoSceneId,
} from './frontendDemoFixtures';

export function FrontendDemoApp() {
  const params = new URLSearchParams(window.location.search);
  const sceneId = getFrontendDemoSceneId(params.get('scene'));
  const demo = FRONTEND_DEMO_SCENES[sceneId];
  const taskRequest = demo.workbench.kind === 'reply' || demo.workbench.kind === 'document' || demo.workbench.kind === 'court'
    ? demo.workbench.request
    : null;

  return (
    <>
      <main className={`app-shell frontend-recording-demo scene-${demo.id}`} data-recording-scene={demo.id}>
        <CommandHud
          autoNextEnabled
          backendConfigured
          canOpenClosingSummary={demo.workbench.kind === 'closing'}
          loading={false}
          onAutoNextChange={() => undefined}
          onLogout={() => undefined}
          onOpenClosingSummary={() => undefined}
          onOpenDocuments={() => undefined}
          onOpenOnboardingGuide={() => undefined}
          onRestart={() => undefined}
          runtimeStatus={demo.runtimeStatus}
          simulation={demo.simulation}
          user={DEMO_USER}
          wsConnected
        />
        <div className="frontend-demo-scene-strip" aria-label="当前演示镜头">
          <span>Demo Scene</span>
          <strong>{demo.title}</strong>
          <b>{demo.scene.stageCode} · {demo.scene.stageName}</b>
        </div>
        <div className="vn-layout">
          <div className="side-rail">
            <PlayerLawyerTaskPanel
              activeRequest={taskRequest}
              error=""
              loading={false}
              onOpenRequest={() => undefined}
              simulation={demo.simulation}
              status={{ enabled: true, playerMode: 'plaintiff' }}
            />
            <TechLedger background={demo.history} scene={demo.scene} />
          </div>
          <div className="story-surface">
            <VisualNovelStage scene={demo.scene} />
            <div className="dialogue-dock">
              <DialogueBox
                backendMode
                caseClosed={demo.id === 'closing'}
                hasPendingUserTask={Boolean(taskRequest)}
                heldDialogueEntryId={demo.currentEntry.id}
                history={demo.history}
                lastAcknowledgedEntry={demo.history.length > 1 ? demo.history[demo.history.length - 2] : null}
                runtimeStatus={demo.runtimeStatus}
                scene={demo.scene}
                selectedCaseId={demo.scene.caseId}
                simulation={demo.simulation}
                wsConnected
              />
              <TownRadar radar={demo.radar} scene={demo.scene} />
            </div>
          </div>
        </div>
        <CaseTimeline
          activeCode={demo.scene.stageCode}
          activeEntry={demo.currentEntry}
          backendMode
          history={demo.history}
          playerPlaintiffPerspective
        />
        <DemoWorkbench workbench={demo.workbench} />
      </main>
      <BuildVersionBadge />
    </>
  );
}

function DemoWorkbench({ workbench }: { workbench: FrontendDemoWorkbench }) {
  if (workbench.kind === 'none') return null;
  if (workbench.kind === 'reply') {
    return (
      <TaskWorkbenchShell
        ariaLabel="当前角色输入"
        footer={<DemoReplyFooter />}
        kicker="User Turn"
        left={<DemoReplyAssist requestPrompt={workbench.request.prompt} contextSummary={workbench.request.contextSummary} />}
        meta={<DemoRequestMeta caseId={workbench.request.caseId} speaker={workbench.request.speakerLabel} stage={workbench.request.stage} />}
        onClose={() => undefined}
        right={<DemoReplyEditor draft={workbench.draft} polished={workbench.polished} />}
        title="轮到用户处理当前角色发言"
      />
    );
  }
  if (workbench.kind === 'document') {
    return (
      <TaskWorkbenchShell
        ariaLabel="当前角色输入"
        footer={<DemoDocumentFooter />}
        kicker="User Turn"
        left={<DemoDocumentAssist contextSummary={workbench.request.contextSummary} followups={workbench.followups} requestPrompt={workbench.request.prompt} />}
        meta={<DemoRequestMeta caseId={workbench.request.caseId} speaker={workbench.request.speakerLabel} stage={workbench.request.stage} />}
        onClose={() => undefined}
        right={<DemoDocumentEditor documentText={workbench.documentText} />}
        title="文书阶段任务"
      />
    );
  }
  if (workbench.kind === 'court') {
    return (
      <TaskWorkbenchShell
        ariaLabel="当前角色输入"
        footer={<DemoCourtFooter />}
        kicker="User Turn"
        left={<DemoReplyAssist requestPrompt={workbench.request.prompt} contextSummary={workbench.request.contextSummary} />}
        meta={<DemoRequestMeta caseId={workbench.request.caseId} speaker={workbench.request.speakerLabel} stage={workbench.request.stage} />}
        onClose={() => undefined}
        right={<DemoCourtEditor draft={workbench.draft} />}
        title="庭审发言任务"
      />
    );
  }
  return (
    <TaskWorkbenchShell
      ariaLabel="结案总结"
      closeLabel="关闭"
      footer={<DemoClosingFooter />}
      kicker="Case Closing Review"
      left={<DemoClosingSide documents={workbench.documents} playerTurnCount={workbench.playerTurnCount} />}
      meta={<><span>原告：张国明</span><span>被告：张晶俊</span><span>交通事故责任纠纷</span><span>难度：综合</span></>}
      onClose={() => undefined}
      right={<DemoClosingMain evaluation={workbench.evaluation} playerTurnCount={workbench.playerTurnCount} />}
      title={workbench.caseTitle}
    />
  );
}

function DemoRequestMeta({ caseId, speaker, stage }: { caseId: string; speaker: string; stage: string }) {
  return (
    <>
      <span>{caseId}</span>
      <span>{stage}</span>
      <span>{speaker}</span>
    </>
  );
}

function DemoReplyAssist({ contextSummary, requestPrompt }: { contextSummary: string; requestPrompt: string }) {
  const hints = [
    ['责任和赔偿范围', '说明责任承担、合理损失范围和例外。'],
    ['证据支持', '说明医疗、交警、鉴定等证据如何支撑主张。'],
    ['追问信息', '提示仍需核实金额、票据、收入证明。'],
  ];
  return (
    <div className="player-workbench-assist">
      <MarkdownText className="player-lawyer-context" text={contextSummary} />
      <MarkdownText className="player-lawyer-prompt" text={requestPrompt} />
      <div className="response-assist-explain" aria-label="回复辅助机制说明">
        <strong>回复辅助机制</strong>
        <p>提交前保留用户原文、AI 润色稿、提示方向和最终版本；结案评分会读取这些记录。</p>
      </div>
      <div className="response-hint-row" aria-label="回复提示">
        {hints.map(([label, description], index) => (
          <button className={`response-hint-chip ${index === 0 || index === 1 ? 'selected' : ''}`} key={label} type="button">
            {label}
            <span>{description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function DemoReplyEditor({ draft, polished }: { draft: string; polished: string }) {
  return (
    <form className="player-workbench-form">
      <textarea className="player-workbench-editor" readOnly value={draft} />
      <label className="polished-response-field">
        <span>润色稿，可继续修改</span>
        <textarea readOnly value={polished} />
      </label>
    </form>
  );
}

function DemoReplyFooter() {
  return (
    <>
      <button className="secondary-action" type="button">稍后处理</button>
      <button className="secondary-action" type="button">AI 润色</button>
      <button className="primary-action" type="button">提交回复</button>
    </>
  );
}

function DemoDocumentAssist({
  contextSummary,
  followups,
  requestPrompt,
}: {
  contextSummary: string;
  followups: Array<{ question: string; answer: string }>;
  requestPrompt: string;
}) {
  const hints = [
    ['关键事实', '事情发生的时间、地点、经过和在场人员。'],
    ['请求依据', '每项请求对应的事实、法律关系和金额基础。'],
    ['证据材料', '责任认定书、病历、票据、收入证明。'],
    ['诉讼目标', '法院最需要支持的请求和可接受底线。'],
  ];
  return (
    <div className="player-workbench-assist">
      <MarkdownText className="player-lawyer-context" text={contextSummary} />
      <MarkdownText className="player-lawyer-prompt" text={requestPrompt} />
      <section className="document-followup-panel" aria-label="追问当事人">
        <div className="document-followup-header">
          <strong>追问当事人</strong>
          <span>已完成 2/2 轮必需追问；可以开始起草，也可以继续追问。</span>
        </div>
        <div className="document-followup-hints" aria-label="追问提示">
          <span className="document-followup-hints-title">参考追问方向</span>
          <div className="document-followup-hints-grid">
            {hints.map(([label, example]) => (
              <div className="document-followup-hint-card" key={label}>
                <strong>{label}</strong>
                <span>{example}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="document-followup-history" aria-label="追问记录">
          {followups.map((item, index) => (
            <article key={item.question}>
              <strong>第 {index + 1} 问：{item.question}</strong>
              <span>答：{item.answer}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function DemoDocumentEditor({ documentText }: { documentText: string }) {
  return (
    <form className="player-workbench-form">
      <section className="document-template-reference" aria-label="参考模板">
        <div className="document-template-header">
          <div>
            <strong>参考模板</strong>
            <span>民事起诉状结构模板</span>
          </div>
          <div className="document-template-actions">
            <button className="secondary-action" type="button">套用模板</button>
            <button className="secondary-action" type="button">智能体润色</button>
          </div>
        </div>
        <pre>原告、被告基本信息；诉讼请求；事实与理由；证据目录；具状人。</pre>
        <ul>
          <li>不得新增无来源事实。</li>
          <li>诉讼请求必须和证据材料对应。</li>
        </ul>
      </section>
      <textarea className="player-workbench-editor" readOnly value={documentText} />
    </form>
  );
}

function DemoDocumentFooter() {
  return (
    <>
      <button className="secondary-action" type="button">稍后处理</button>
      <button className="secondary-action" type="button">智能体润色</button>
      <button className="primary-action" type="button">提交文书并继续</button>
    </>
  );
}

function DemoCourtEditor({ draft }: { draft: string }) {
  return (
    <form className="player-workbench-form">
      <textarea className="player-workbench-editor" readOnly value={draft} />
    </form>
  );
}

function DemoCourtFooter() {
  return (
    <>
      <button className="secondary-action" type="button">稍后处理</button>
      <button className="secondary-action" type="button">AI 润色</button>
      <button className="primary-action" type="button">提交庭审发言</button>
    </>
  );
}

function DemoClosingSide({
  documents,
  playerTurnCount,
}: {
  documents: Array<{ documentKey: string; fileName: string; stage: string; title: string }>;
  playerTurnCount: number;
}) {
  return (
    <div className="closing-workbench-side">
      <section className="closing-summary-section">
        <h3>本轮资料</h3>
        <div className="closing-stat-grid">
          <span><strong>{playerTurnCount}</strong>玩家提交</span>
          <span><strong>{documents.length}</strong>可下载文书</span>
          <span><strong>{documents.length}</strong>已生成 PDF</span>
        </div>
        <div className="closing-document-list">
          {documents.map((item) => (
            <article className="closing-document-item" key={item.documentKey}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.stage} / {item.fileName}</span>
              </div>
              <button className="secondary-action" type="button">下载</button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function DemoClosingMain({
  evaluation,
  playerTurnCount,
}: {
  evaluation: {
    dimensions: Array<{ label: string; maxScore: number; score: number }>;
    improvements: string[];
    overallScore: number;
    strengths: string[];
    summary: string;
  };
  playerTurnCount: number;
}) {
  return (
    <div className="closing-workbench-main">
      <section className="closing-summary-section">
        <h3>完整记录</h3>
        <div className="closing-report-note">
          <strong>{playerTurnCount}</strong>
          <span>条玩家提交已纳入评分。完整提交与对话请导出复盘 Markdown 查看。</span>
        </div>
      </section>
      <section className="closing-evaluation-section">
        <div className="closing-evaluation-header">
          <h3>玩家表现评价</h3>
        </div>
        <div className="closing-evaluation-content">
          <div className="closing-score">
            <strong>{evaluation.overallScore}</strong>
            <span>总分</span>
          </div>
          <MarkdownText text={evaluation.summary} />
          <div className="closing-dimension-grid">
            {evaluation.dimensions.map((item) => (
              <div className="closing-dimension" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.score}/{item.maxScore}</strong>
              </div>
            ))}
          </div>
          <div className="closing-feedback-grid">
            <DemoFeedbackList items={evaluation.strengths} title="亮点" />
            <DemoFeedbackList items={evaluation.improvements} title="改进建议" />
          </div>
        </div>
      </section>
    </div>
  );
}

function DemoFeedbackList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="closing-feedback-list">
      <strong>{title}</strong>
      <ul>
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function DemoClosingFooter() {
  return (
    <>
      <button className="secondary-action" type="button">导出复盘 Markdown</button>
      <button className="primary-action" type="button">关闭</button>
    </>
  );
}
