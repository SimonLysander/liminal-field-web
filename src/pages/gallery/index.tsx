import { useEffect, useMemo, useState } from 'react';
import { Clock3, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  contentItemsApi,
  type ContentDetail,
  type ContentListItem,
} from '@/services/content-items';

const formatDate = (value: string) =>
  new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const GalleryPage = () => {
  const [items, setItems] = useState<ContentListItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDetail, setActiveDetail] = useState<ContentDetail | null>(null);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadItems = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await contentItemsApi.list();
        if (!isCancelled) {
          setItems(result);
          setActiveId(result[0]?.id ?? null);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setItems([]);
          setActiveId(null);
          setError(loadError instanceof Error ? loadError.message : 'Failed to load gallery.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadItems();

    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) => `${item.title}\n${item.summary}`.toLowerCase().includes(keyword));
  }, [items, query]);

  useEffect(() => {
    const nextActiveId =
      filteredItems.find((item) => item.id === activeId)?.id ?? filteredItems[0]?.id ?? null;

    if (nextActiveId !== activeId) {
      setActiveId(nextActiveId);
    }
  }, [activeId, filteredItems]);

  useEffect(() => {
    if (!activeId) {
      setActiveDetail(null);
      return;
    }

    let isCancelled = false;

    const loadDetail = async () => {
      setIsDetailLoading(true);

      try {
        const detail = await contentItemsApi.getById(activeId);
        if (!isCancelled) {
          setActiveDetail(detail);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setActiveDetail(null);
          setError(loadError instanceof Error ? loadError.message : 'Failed to load content detail.');
        }
      } finally {
        if (!isCancelled) {
          setIsDetailLoading(false);
        }
      }
    };

    void loadDetail();

    return () => {
      isCancelled = true;
    };
  }, [activeId]);

  const timelineItems = useMemo(
    () =>
      filteredItems.map((item) => ({
        id: item.id,
        label: formatDate(item.updatedAt).slice(0, 10),
      })),
    [filteredItems],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title or summary..."
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="w-72 shrink-0 border-r border-border">
          <ScrollArea className="h-full">
            <div className="space-y-2 p-3">
              <div className="text-xs text-muted-foreground">Content Sequence</div>
              {isLoading ? (
                <p className="py-6 text-sm text-muted-foreground">Loading...</p>
              ) : error ? (
                <p className="py-6 text-sm text-destructive">{error}</p>
              ) : filteredItems.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">No content found.</p>
              ) : (
                filteredItems.map((item) => {
                  const isActive = activeDetail?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveId(item.id)}
                      className={`w-full rounded-md border px-3 py-3 text-left transition-colors ${
                        isActive ? 'border-border bg-accent' : 'border-border hover:bg-accent/50'
                      }`}
                    >
                      <div className="line-clamp-1 text-sm font-medium">{item.title}</div>
                      <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {item.summary}
                      </div>
                      <div className="mt-2 text-[11px] text-muted-foreground">{formatDate(item.updatedAt)}</div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </aside>

        <main className="min-w-0 flex-1">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-6">
              {isDetailLoading ? (
                <div className="p-6 text-sm text-muted-foreground">Loading detail...</div>
              ) : activeDetail ? (
                <>
                  <div className="border border-border p-4">
                    <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>{formatDate(activeDetail.updatedAt)}</span>
                      <span>|</span>
                      <span>{activeDetail.status}</span>
                    </div>
                    <div className="flex aspect-[16/9] items-center justify-center border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
                      gallery visual area
                    </div>
                  </div>

                  <section className="border border-border p-6">
                    <h1 className="text-xl font-semibold">{activeDetail.title}</h1>
                    <p className="mt-3 text-sm text-muted-foreground">{activeDetail.summary}</p>
                    <div className="mt-4 whitespace-pre-wrap text-sm leading-7">{activeDetail.bodyMarkdown}</div>
                  </section>
                </>
              ) : (
                <div className="p-6 text-sm text-muted-foreground">Select one item to inspect it.</div>
              )}
            </div>
          </ScrollArea>
        </main>

        <aside className="w-52 shrink-0 border-l border-border">
          <ScrollArea className="h-full">
            <div className="space-y-2 p-3">
              <div className="text-xs text-muted-foreground">Time Index</div>
              {timelineItems.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">No timeline yet.</p>
              ) : (
                timelineItems.map((item) => {
                  const isActive = item.id === activeDetail?.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveId(item.id)}
                      className={`block w-full rounded-md border border-transparent px-3 py-2 text-left text-sm transition-colors ${
                        isActive ? 'border-border bg-accent' : 'hover:bg-accent/50'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
};

export default GalleryPage;
