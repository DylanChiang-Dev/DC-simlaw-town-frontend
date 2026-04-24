type Props = {
  open: boolean;
  onClose: () => void;
};

export function DocumentWorkbench({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label="文书起草工作台">
      <section className="document-workbench">
        <button className="close-button" type="button" onClick={onClose} aria-label="关闭">×</button>
        <img src="/art/document-workbench.png" alt="文书起草工作台插图" />
        <div className="document-copy">
          <div className="panel-kicker">Document Assist</div>
          <h2>起诉状模板化输入</h2>
          <p>玩家不需要从零写法律文书。系统把案件事实、争议焦点、证据目录和诉讼请求拆成可填写字段，再由 Skill 约束文书格式。</p>
          <div className="document-fields">
            <span>诉讼请求</span>
            <span>事实与理由</span>
            <span>证据目录</span>
            <span>法院与案由</span>
          </div>
          <button className="primary-action wide" type="button" onClick={onClose}>确认演示文书</button>
        </div>
      </section>
    </div>
  );
}
