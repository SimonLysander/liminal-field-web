/*
 * AdminPage — Content management workspace
 *
 * Layout: three-column design mirroring the display page pattern.
 *   - LEFT (200px):  TreePanel — floating grey card sidebar (Apple Books style).
 *   - CENTER:        Content preview — AnimatePresence cross-fade between
 *                    folder detail, document version view, or empty state.
 *   - RIGHT (240px): Contextual side panel — draft status, version timeline,
 *                    and asset list for the selected document.
 *
 * The outer container uses background: var(--paper) (white #FFFFFF) so the
 * TreePanel card lifts off visually while the main content area stays flat.
 *
 * All font sizes use the CSS type scale system (--text-2xs through --text-5xl)
 * defined in index.css, ensuring consistency with display pages.
 *
 * VersionTimeline: vertical connector with dot nodes — active preview uses
 * mark-blue highlight, published version uses mark-green, latest uses ink.
 * Selected version gets radius-sm (6px) rounded background.
 */

import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { smoothBounce } from '@/lib/motion';
import Topbar from '@/components/global/Topbar';
import { contentItemsApi } from '@/services/content-items';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ContentVersionView } from './components/ContentVersionView';
import { FolderDetailPanel } from './components/FolderDetailPanel';
import { NodeFormModal } from './components/NodeFormModal';
import { TreePanel } from './components/TreePanel';
import { useAdminWorkspace } from './hooks/useAdminWorkspace';
import type { DraftPresence } from './types';
import type { ContentHistoryEntry, ListedAsset } from '@/services/content-items';

const AdminPage = () => {
  const workspace = useAdminWorkspace();
  const navigate = useNavigate();

  const editUrl = workspace.selectedNode?.contentItemId
    ? `/admin/edit/${workspace.selectedNode.contentItemId}`
    : null;

  const handleOverwriteDraft = async () => {
    if (!workspace.selectedNode?.contentItemId) return;
    const confirmed = window.confirm('是否覆盖已有草稿？将从正式版本重新创建。');
    if (!confirmed) return;
    await contentItemsApi.deleteDraft(workspace.selectedNode.contentItemId);
    navigate(`/admin/edit/${workspace.selectedNode.contentItemId}`);
  };

  return (
    <div className="flex h-screen" style={{ background: 'var(--paper)' }}>
      {/* Left — structure tree (acts as admin sidebar) */}
      <TreePanel
        tree={workspace.tree}
        loading={workspace.loading}
        error={workspace.error}
        selectedNodeId={workspace.selectedNode?.id ?? null}
        totalNodes={workspace.totalNodes}
        onReload={workspace.loadRoots}
        onSelect={workspace.setSelectedNode}
        onExpand={workspace.handleExpand}
        onAddChild={workspace.openCreate}
        onEdit={workspace.openEdit}
        onDelete={workspace.setDeleteTarget}
        onMoveNode={workspace.handleMoveNode}
      />

      {/* Right — main content area */}
      <main
        className="relative z-0 flex flex-1 flex-col overflow-hidden"
        style={{ background: 'var(--paper)' }}
      >
        <Topbar />

        <div className="flex flex-1 overflow-hidden">
          {/* Center — content preview */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-10 py-9">
              <AnimatePresence mode="wait">
                <motion.div
                  key={workspace.selectedNode?.id ?? 'empty'}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -2 }}
                  transition={{ duration: 0.2, ease: smoothBounce }}
                >
                  {!workspace.selectedNode ? (
                    <EmptyState title="未选择节点" subtitle="从左侧树中选择一个文件夹或文档开始。" />
                  ) : workspace.selectedNode.type === 'FOLDER' ? (
                    <FolderDetailPanel node={workspace.selectedNode} />
                  ) : workspace.selectedNode.contentItemId ? (
                    <ContentVersionView
                      node={workspace.selectedNode}
                      content={workspace.formalContent}
                      loading={workspace.contentLoading}
                      error={workspace.contentError}
                      actionMessage={workspace.actionMessage}
                      preview={workspace.preview}
                      previewLoading={workspace.previewLoading}
                      onReload={() => workspace.loadFormalContent(workspace.selectedNode!.contentItemId!)}
                      onPublish={workspace.publishContent}
                      onUnpublish={workspace.unpublishContent}
                      onExitPreview={workspace.exitPreview}
                      onPublishPreview={workspace.publishPreview}
                    />
                  ) : (
                    <EmptyState title="DOC 绑定异常" subtitle="该 DOC 节点没有关联的内容项，请重新创建。" />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Right — contextual side panel */}
          <aside
            className="flex w-[240px] shrink-0 flex-col overflow-y-auto px-5 py-7"
            style={{ borderLeft: '0.5px solid var(--separator)' }}
          >
            {workspace.selectedNode?.contentItemId ? (
              <FormalSidePanel
                draftPresence={workspace.draftPresence}
                assets={workspace.assets}
                assetsLoading={workspace.assetsLoading}
                history={workspace.history}
                historyLoading={workspace.historyLoading}
                publishedHash={workspace.formalContent.publishedVersion?.commitHash ?? null}
                activePreviewHash={workspace.preview?.commitHash ?? null}
                onEditDraft={() => editUrl && navigate(editUrl)}
                onOverwriteDraft={handleOverwriteDraft}
                onSelectVersion={workspace.previewVersion}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <p style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-sm)' }}>
                  选择文档查看详情
                </p>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Modals */}
      {workspace.modal.open && (
        <NodeFormModal
          modal={workspace.modal}
          onClose={workspace.closeModal}
          onSubmit={workspace.handleCreateOrEdit}
        />
      )}
      {workspace.deleteTarget && (
        <ConfirmDialog
          node={workspace.deleteTarget}
          onConfirm={workspace.handleDelete}
          onCancel={() => workspace.setDeleteTarget(null)}
        />
      )}
    </div>
  );
};

/* ---------- Side panel sections ---------- */

function FormalSidePanel({
  draftPresence,
  assets,
  assetsLoading,
  history,
  historyLoading,
  publishedHash,
  activePreviewHash,
  onEditDraft,
  onOverwriteDraft,
  onSelectVersion,
}: {
  draftPresence: DraftPresence;
  assets: ListedAsset[];
  assetsLoading: boolean;
  history: ContentHistoryEntry[];
  historyLoading: boolean;
  publishedHash: string | null;
  activePreviewHash: string | null;
  onEditDraft: () => void;
  onOverwriteDraft: () => Promise<void>;
  onSelectVersion: (commitHash: string) => Promise<void>;
}) {
  return (
    <>
      {/* Draft / edit entry */}
      <SideSection title="编辑">
        <div
          className="rounded-[10px] p-4"
          style={{ border: '1px solid var(--box-border)', background: 'var(--shelf)' }}
        >
          {draftPresence.exists ? (
            <div className="space-y-2">
              <InfoRow label="已有草稿" value="是" />
              <InfoRow
                label="上次保存"
                value={draftPresence.savedAt ? new Date(draftPresence.savedAt).toLocaleString('zh-CN') : '--'}
              />
              <div className="flex gap-4 pt-2">
                <SideLink label="继续编辑 →" primary onClick={onEditDraft} />
                <SideLink label="覆盖重建" danger onClick={() => void onOverwriteDraft()} />
              </div>
            </div>
          ) : (
            <>
              <p className="mb-3.5 leading-relaxed" style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-xs)' }}>
                进入编辑器创建草稿
              </p>
              <SideLink label="开始编辑 →" primary onClick={onEditDraft} />
            </>
          )}
        </div>
      </SideSection>

      <SideSection title="版本">
        {historyLoading ? (
          <p style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-xs)' }}>加载中...</p>
        ) : history.length === 0 ? (
          <p style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-xs)' }}>暂无版本</p>
        ) : (
          <VersionTimeline
            history={history}
            publishedHash={publishedHash}
            activePreviewHash={activePreviewHash}
            onSelect={(hash) => void onSelectVersion(hash)}
          />
        )}
      </SideSection>

      <SideSection title="附件">
        <AssetList assets={assets} loading={assetsLoading} />
      </SideSection>
    </>
  );
}

function VersionTimeline({
  history,
  publishedHash,
  activePreviewHash,
  onSelect,
}: {
  history: ContentHistoryEntry[];
  publishedHash: string | null;
  activePreviewHash?: string | null;
  onSelect?: (commitHash: string) => void;
}) {
  return (
    <div className="relative" style={{ paddingLeft: 16 }}>
      {/* Vertical line */}
      <div
        className="absolute"
        style={{
          left: 5,
          top: 8,
          bottom: 8,
          width: 1,
          background: 'var(--box-border)',
        }}
      />
      {history.map((entry, i) => {
        const isPublished = publishedHash === entry.commitHash;
        const isFirst = i === 0;
        const isActive = activePreviewHash === entry.commitHash;
        const title = entry.message.split(' | ')[1]?.trim()
          || (entry.action === 'commit' ? '正式版本提交' : '版本更新');

        return (
          <div
            key={entry.commitHash}
            className="relative cursor-pointer transition-all duration-150 hover:opacity-80"
            style={{
              padding: '8px 0 8px 12px',
              background: isActive ? 'var(--accent-soft)' : 'transparent',
              borderRadius: isActive ? 'var(--radius-sm)' : 0,
            }}
            onClick={() => onSelect?.(entry.commitHash)}
          >
            {/* Node dot */}
            <span
              className="absolute rounded-full"
              style={{
                left: -12,
                top: 12,
                width: 7,
                height: 7,
                background: isActive
                  ? 'var(--mark-blue)'
                  : isPublished
                    ? 'var(--mark-green)'
                    : isFirst
                      ? 'var(--ink)'
                      : 'var(--ink-ghost)',
                border: '1.5px solid var(--paper-dark)',
                boxShadow: isActive
                  ? '0 0 6px rgba(10,132,255,0.4)'
                  : isPublished
                    ? '0 0 6px rgba(48,209,88,0.3)'
                    : 'none',
              }}
            />
            <div
              className="font-medium"
              style={{ color: isFirst ? 'var(--ink)' : 'var(--ink-light)', fontSize: 'var(--text-xs)', marginBottom: 3 }}
            >
              {title}
            </div>
            <div
              className="flex items-center gap-1.5"
              style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-2xs)' }}
            >
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {entry.commitHash.slice(0, 8)}
              </span>
              <span>· {new Date(entry.committedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
              {isPublished && (
                <span
                  className="rounded px-1.5 py-[1px] font-semibold"
                  style={{ background: 'rgba(48,209,88,0.12)', color: 'var(--mark-green)', fontSize: '0.5625rem' }}
                >
                  已发布
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Shared primitives ---------- */

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="font-medium" style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-base)' }}>{title}</div>
      <p className="mt-2" style={{ color: 'var(--ink-ghost)', opacity: 0.6, fontSize: 'var(--text-sm)' }}>{subtitle}</p>
    </div>
  );
}

function SideSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <div
        className="mb-3.5 font-semibold uppercase"
        style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-2xs)', letterSpacing: '0.06em' }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span style={{ color: 'var(--ink-faded)', fontSize: 'var(--text-xs)' }}>{label}</span>
      <span className="font-medium" style={{ color: 'var(--ink)', fontSize: 'var(--text-xs)' }}>{value}</span>
    </div>
  );
}

function SideLink({
  label,
  primary,
  danger,
  onClick,
}: {
  label: string;
  primary?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="transition-colors duration-150"
      style={{
        color: danger ? 'var(--mark-red)' : primary ? 'var(--ink)' : 'var(--ink-faded)',
        fontWeight: primary ? 600 : 400,
        fontSize: 'var(--text-xs)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        padding: '4px 0',
      }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function AssetList({
  assets,
  loading,
}: {
  assets: ListedAsset[];
  loading: boolean;
}) {
  if (loading) return <p style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-xs)' }}>加载中...</p>;
  if (assets.length === 0) return <p style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-xs)' }}>暂无附件</p>;

  return (
    <div className="space-y-2">
      {assets.map((asset) => (
        <div
          key={asset.path}
          className="rounded-[10px] px-3.5 py-3"
          style={{ border: '1px solid var(--box-border)', background: 'var(--shelf)' }}
        >
          <div className="font-medium" style={{ color: 'var(--ink-light)', fontSize: 'var(--text-xs)' }}>{asset.fileName}</div>
          <div className="mt-0.5 font-mono" style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-2xs)' }}>{asset.path}</div>
          <div className="mt-1">
            <span style={{ color: 'var(--ink-ghost)', fontSize: 'var(--text-2xs)' }}>
              {asset.type} · {asset.size} bytes
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminPage;
