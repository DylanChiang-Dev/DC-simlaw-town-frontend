import type { ReactNode } from "react";

type Props = {
  ariaLabel: string;
  closeLabel?: string;
  footer: ReactNode;
  kicker?: ReactNode;
  left: ReactNode;
  meta?: ReactNode;
  onClose: () => void;
  right: ReactNode;
  title: ReactNode;
};

export function TaskWorkbenchShell({
  ariaLabel,
  closeLabel = "关闭",
  footer,
  kicker,
  left,
  meta,
  onClose,
  right,
  title,
}: Props) {
  return (
    <div
      className="task-workbench-layer"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <section className="task-workbench-shell">
        <header className="task-workbench-header">
          <div className="task-workbench-title-block">
            {kicker ? <div className="panel-kicker">{kicker}</div> : null}
            <h2>{title}</h2>
            {meta ? <div className="task-workbench-meta">{meta}</div> : null}
          </div>
          <button
            className="close-button"
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
          >
            ×
          </button>
        </header>
        <div className="task-workbench-body">
          <aside className="task-workbench-side">{left}</aside>
          <main className="task-workbench-main">{right}</main>
        </div>
        <footer className="task-workbench-footer">{footer}</footer>
      </section>
    </div>
  );
}
