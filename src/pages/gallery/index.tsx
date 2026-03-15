import { useEffect, useMemo, useState } from 'react';
import { Clock3, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  postsApi,
  type ContentItem,
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
  const [posts, setPosts] = useState<ContentItem[]>([]);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadPosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const items = await postsApi.list();
        if (!isCancelled) {
          setPosts(items);
          setActivePostId(items[0]?.id ?? null);
        }
      } catch (err) {
        if (!isCancelled) {
          setPosts([]);
          setActivePostId(null);
          setError(err instanceof Error ? err.message : '加载图文展馆失败');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadPosts();

    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredPosts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return posts;
    return posts.filter((post) => {
      const haystack = `${post.title}\n${post.content ?? ''}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [posts, query]);

  const activePost =
    filteredPosts.find((post) => post.id === activePostId) ??
    filteredPosts[0] ??
    null;

  const timelineItems = useMemo(
    () =>
      filteredPosts.map((post) => ({
        id: post.id,
        label: formatDate(post.updatedAt).slice(0, 10),
      })),
    [filteredPosts],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索图文标题或正文..."
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="w-72 shrink-0 border-r border-border">
          <ScrollArea className="h-full">
            <div className="space-y-2 p-3">
              <div className="text-xs text-muted-foreground">图文序列</div>
              {isLoading ? (
                <p className="py-6 text-sm text-muted-foreground">加载中...</p>
              ) : error ? (
                <p className="py-6 text-sm text-destructive">{error}</p>
              ) : filteredPosts.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">暂无图文内容</p>
              ) : (
                filteredPosts.map((post) => {
                  const isActive = activePost?.id === post.id;
                  return (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => setActivePostId(post.id)}
                      className={`w-full rounded-md border px-3 py-3 text-left transition-colors ${
                        isActive
                          ? 'border-border bg-accent'
                          : 'border-border hover:bg-accent/50'
                      }`}
                    >
                      <div className="line-clamp-1 text-sm font-medium">{post.title}</div>
                      <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {post.content ?? '内容待解析'}
                      </div>
                      <div className="mt-2 text-[11px] text-muted-foreground">
                        {formatDate(post.updatedAt)}
                      </div>
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
              {activePost ? (
                <>
                  <div className="border border-border p-4">
                    <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      <span>{formatDate(activePost.updatedAt)}</span>
                      <span>|</span>
                      <span>{activePost.currentHash}</span>
                    </div>
                    <div className="flex aspect-[16/9] items-center justify-center border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
                      post 主视觉区
                    </div>
                  </div>

                  <section className="border border-border p-6">
                    <h1 className="text-xl font-semibold">
                      {activePost.title}
                    </h1>
                    <div className="mt-4 whitespace-pre-wrap text-sm leading-7">
                      {activePost.content ?? '内容解析中...'}
                    </div>
                  </section>
                </>
              ) : (
                <div className="p-6 text-sm text-muted-foreground">
                  请选择一篇 post 查看内容
                </div>
              )}
            </div>
          </ScrollArea>
        </main>

        <aside className="w-52 shrink-0 border-l border-border">
          <ScrollArea className="h-full">
            <div className="space-y-2 p-3">
              <div className="text-xs text-muted-foreground">时间索引</div>
              {timelineItems.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">暂无时间索引</p>
              ) : (
                timelineItems.map((item) => {
                  const isActive = item.id === activePost?.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActivePostId(item.id)}
                      className={`block w-full rounded-md border border-transparent px-3 py-2 text-left text-sm transition-colors ${
                        isActive
                          ? 'border-border bg-accent'
                          : 'hover:bg-accent/50'
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
