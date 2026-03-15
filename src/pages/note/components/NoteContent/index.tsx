import { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  notesApi,
  type ContentItem,
} from '@/services/content-items';
import type { StructureNode } from '@/services/structure';

interface NoteContentProps {
  activeNode: StructureNode | null;
}

/** 中间：面包屑 + 文档正文 */
const NoteContent = ({ activeNode }: NoteContentProps) => {
  const contentItemId =
    activeNode?.type === 'DOC' ? activeNode.contentItemUUID ?? null : null;
  const [contentItem, setContentItem] = useState<ContentItem | null>(null);
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
        const item = await notesApi.getById(contentItemId);
        if (!isCancelled) {
          setContentItem(item);
        }
      } catch (err) {
        if (!isCancelled) {
          setContentItem(null);
          setError(err instanceof Error ? err.message : '加载内容失败');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadContentItem();

    return () => {
      isCancelled = true;
    };
  }, [contentItemId]);

  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <ScrollArea className="flex-1">
        <div className="max-w-none space-y-4 p-6">
          {isLoading ? (
            <p className="text-muted-foreground">
              文档内容加载中... (contentItemId: {contentItemId})
            </p>
          ) : error ? (
            <p className="text-destructive">{error}</p>
          ) : contentItem ? (
            <>
              <h1 className="text-xl font-semibold">{contentItem.title}</h1>
              <p className="text-xs text-muted-foreground">
                type: {contentItem.businessType} | hash: {contentItem.currentHash}
              </p>
              <div className="whitespace-pre-wrap text-sm leading-7">
                {contentItem.content ?? '内容解析中...'}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">从左侧选择文档查看内容</p>
          )}
        </div>
      </ScrollArea>
    </main>
  );
};

export default NoteContent;
