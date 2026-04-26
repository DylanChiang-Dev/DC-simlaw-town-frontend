import { useEffect, useState } from 'react';
import { downloadCaseDocument, fetchCaseDocuments } from '../services/caseDocumentsApi';
import type { CaseDocumentEntry } from '../services/types';

type Props = {
  caseId: string;
  open: boolean;
  onClose: () => void;
};

export function CaseDocumentsPanel({ caseId, onClose, open }: Props) {
  const [documents, setDocuments] = useState<CaseDocumentEntry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function refreshDocuments(): Promise<void> {
    if (!caseId) return;
    setLoading(true);
    setError('');
    try {
      setDocuments(await fetchCaseDocuments(caseId));
    } catch (err) {
      setError(err instanceof Error ? err.message : '读取案件文书失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) void refreshDocuments();
    // Refresh only when the modal opens or case changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, open]);

  if (!open) return null;

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label="案件文书">
      <section className="case-documents-panel">
        <button className="close-button" type="button" onClick={onClose} aria-label="关闭">×</button>
        <div className="panel-kicker">Case Documents</div>
        <h2>案件 PDF 文书</h2>
        <p>这里显示后端已经生成并可下载的案件文书。确认当前文书后可以刷新列表查看导出结果。</p>
        <div className="case-documents-actions">
          <span>{caseId || '未选择案件'}</span>
          <button className="secondary-action" disabled={loading || !caseId} onClick={() => void refreshDocuments()} type="button">
            {loading ? '刷新中' : '刷新列表'}
          </button>
        </div>
        {error && <div className="document-error" role="alert">{error}</div>}
        <div className="case-documents-list">
          {documents.map((item) => (
            <article className="case-document-card" key={item.documentKey}>
              <div>
                <strong>{item.title || item.fileName}</strong>
                <span>{item.stage} / {item.documentType}</span>
                <small>{item.fileName}</small>
              </div>
              <button
                className="primary-action"
                disabled={loading || !item.available}
                onClick={() => void downloadCaseDocument(item)}
                type="button"
              >
                下载
              </button>
            </article>
          ))}
          {!documents.length && !loading && <div className="empty-case">当前案件暂无可下载文书。</div>}
        </div>
      </section>
    </div>
  );
}
