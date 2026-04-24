import { useEffect, useMemo, useState } from 'react';
import { contentItemsApi, type ContentDetail } from '@/services/content-items';
import type { StructureNode } from '@/services/structure';

interface NoteContentProps {
  activeNode: StructureNode | null;
}

const NoteContent = ({ activeNode }: NoteContentProps) => {
  const contentItemId = activeNode?.type === 'DOC' ? activeNode.contentItemId ?? null : null;
  const [contentItem, setContentItem] = useState<ContentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contentItemId) {
      setContentItem(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isCancelled = false;

    const loadContentItem = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const item = await contentItemsApi.getById(contentItemId);
        if (!isCancelled) setContentItem(item);
      } catch (loadError) {
        if (!isCancelled) {
          setContentItem(null);
          setError(loadError instanceof Error ? loadError.message : 'Failed to load content');
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    void loadContentItem();
    return () => {
      isCancelled = true;
    };
  }, [contentItemId]);

  const paragraphs = useMemo(() => {
    if (!contentItem?.bodyMarkdown) return [];
    return contentItem.bodyMarkdown.split(/\n{2,}/).filter(Boolean);
  }, [contentItem?.bodyMarkdown]);

  if (isLoading) {
    return (
      <div className="notes-center flex flex-1 flex-col rounded-[1.375rem] px-[1.75rem] py-[1.5rem]">
        <div className="article-title">Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="notes-center flex flex-1 flex-col rounded-[1.375rem] px-[1.75rem] py-[1.5rem]">
        <div className="article-title">Error</div>
        <div className="article-body mt-[1rem]">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!contentItem) {
    return (
      <div className="notes-center flex flex-1 flex-col rounded-[1.375rem] px-[1.75rem] py-[1.5rem]">
        <div className="article-meta-row flex items-center justify-between gap-[1rem]">
          <span className="article-date">Published room</span>
          <span className="article-reading">formal reading only</span>
        </div>
        <div className="article-title mt-[1rem]">从左侧书架选择一篇已发布文稿。</div>
        <div className="article-body mt-[1rem]">
          <p>这里不负责草稿、不负责编辑，也不负责发布控制。它只负责安静地展示当前公开版本。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notes-center paper-texture flex flex-1 flex-col rounded-[1.375rem] px-[1.75rem] py-[1.5rem]">
      <div className="article-meta-row flex items-center justify-between gap-[1rem]">
        <span className="article-date">{new Date(contentItem.updatedAt).toLocaleString('zh-CN')}</span>
        <span className="article-reading">published · {contentItem.bodyMarkdown.length} chars</span>
      </div>
      <div className="article-title mt-[1rem]">{contentItem.publishedVersion?.title ?? contentItem.latestVersion.title}</div>
      <div className="article-body mt-[1rem]">
        {(contentItem.publishedVersion?.summary ?? contentItem.latestVersion.summary) ? (
          <p>{contentItem.publishedVersion?.summary ?? contentItem.latestVersion.summary}</p>
        ) : null}
        {paragraphs.map((paragraph, index) => (
          <p key={`${index}-${paragraph.slice(0, 12)}`}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
};

export default NoteContent;
