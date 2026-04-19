import { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
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
        if (!isCancelled) {
          setContentItem(item);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setContentItem(null);
          setError(loadError instanceof Error ? loadError.message : 'Failed to load content');
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
            <p className="text-muted-foreground">Loading content...</p>
          ) : error ? (
            <p className="text-destructive">{error}</p>
          ) : contentItem ? (
            <>
              <div className="space-y-2">
                <h1 className="text-xl font-semibold">{contentItem.title}</h1>
                <p className="text-sm text-muted-foreground">{contentItem.summary}</p>
                <p className="text-xs text-muted-foreground">
                  status: {contentItem.status} · updated: {new Date(contentItem.updatedAt).toLocaleString('zh-CN')}
                </p>
              </div>

              <div className="whitespace-pre-wrap text-sm leading-7">{contentItem.bodyMarkdown}</div>
            </>
          ) : (
            <p className="text-muted-foreground">Select a document from the left navigator.</p>
          )}
        </div>
      </ScrollArea>
    </main>
  );
};

export default NoteContent;
