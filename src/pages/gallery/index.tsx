import { useEffect, useMemo, useState } from 'react';
import { contentItemsApi, type ContentDetail, type ContentListItem } from '@/services/content-items';

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
        if (!isCancelled) setIsLoading(false);
      }
    };

    void loadItems();
    return () => {
      isCancelled = true;
    };
  }, []);

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
        if (!isCancelled) setActiveDetail(detail);
      } catch (loadError) {
        if (!isCancelled) {
          setActiveDetail(null);
          setError(loadError instanceof Error ? loadError.message : 'Failed to load content detail.');
        }
      } finally {
        if (!isCancelled) setIsDetailLoading(false);
      }
    };

    void loadDetail();
    return () => {
      isCancelled = true;
    };
  }, [activeId]);

  const tagGroups = useMemo(() => {
    const latestTitles = items.slice(0, 5).map((item, index) => ({ name: item.title, count: index + 1, active: item.id === activeId }));
    const statuses = [
      { name: 'published', count: items.filter((item) => item.status === 'published').length, active: !!activeDetail?.publishedVersion },
      { name: 'committed', count: items.filter((item) => item.status === 'committed').length, active: activeDetail?.status === 'committed' },
    ];
    const assets = [
      { name: 'with assets', count: items.filter((item) => item.latestChange?.changeType === 'major').length || 0, active: false },
      { name: 'latest', count: items.length, active: false },
    ];

    return [
      { label: 'Document', tags: latestTitles },
      { label: 'Status', tags: statuses },
      { label: 'Archive', tags: assets },
    ];
  }, [activeDetail?.publishedVersion, activeDetail?.status, activeId, items]);

  const timeline = useMemo(() => {
    const groups = new Map<string, { name: string; count: number; active: boolean }[]>();
    items.forEach((item) => {
      const date = new Date(item.updatedAt);
      const year = String(date.getFullYear());
      const month = `${date.getMonth() + 1}ÔÂ`;
      const current = groups.get(year) ?? [];
      current.push({ name: month, count: 1, active: item.id === activeId });
      groups.set(year, current);
    });
    return [...groups.entries()].map(([year, months]) => ({ year, months }));
  }, [activeId, items]);

  const navigate = (dir: -1 | 1) => {
    if (items.length === 0) return;
    const index = items.findIndex((item) => item.id === activeId);
    const next = dir > 0 ? (index >= items.length - 1 ? 0 : index + 1) : index <= 0 ? items.length - 1 : index - 1;
    setActiveId(items[next]?.id ?? null);
  };

  const detailTitle = activeDetail ? activeDetail.publishedVersion?.title ?? activeDetail.latestVersion.title : null;
  const detailSummary = activeDetail
    ? (activeDetail.publishedVersion?.summary ?? activeDetail.latestVersion.summary) || 'No summary yet.'
    : null;

  return (
    <div className="gallery-view flex h-full flex-1 gap-[1.25rem] overflow-hidden px-[1.5rem] pb-[1.5rem] pt-[1rem]">
      <div className="gallery-left flex w-[15.5rem] shrink-0 flex-col rounded-[1.125rem] px-[1.25rem] py-[1.125rem]">
        <div className="panel-label">Tag Filter</div>
        <div className="mt-[0.75rem] flex flex-col gap-[0.875rem]">
          {tagGroups.map((group) => (
            <div key={group.label}>
              <div className="tag-group-label">{group.label}</div>
              <div className="tag-group mt-[0.375rem]">
                {group.tags.map((tag) => (
                  <span key={`${group.label}-${tag.name}`} className={`tag-item ${tag.active ? 'active' : ''}`}>
                    {tag.name} <span className="tag-num">{tag.count}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        {isLoading ? <div className="ai-hint mt-[1rem]">Loading gallery¡­</div> : null}
        {error ? <div className="ai-hint mt-[1rem]">{error}</div> : null}
      </div>

      <div className="gallery-center flex min-w-0 flex-1 flex-col items-center gap-[1rem] rounded-[1.375rem] px-[1.5rem] py-[1.25rem]">
        {isDetailLoading ? (
          <div className="gallery-polaroid">
            <div className="gallery-display">
              <div className="gallery-display-placeholder">Loading¡­</div>
            </div>
            <div className="gallery-polaroid-caption">Loading detail</div>
          </div>
        ) : activeDetail ? (
          <>
            <div className="gallery-polaroid">
              <div className="gallery-display">
                <div className="gallery-display-placeholder">{detailTitle}</div>
                <div className="gallery-nav prev" onClick={() => navigate(-1)}>
                  ¡÷
                </div>
                <div className="gallery-nav next" onClick={() => navigate(1)}>
                  ¨Œ
                </div>
              </div>
              <div className="gallery-polaroid-caption">{detailTitle}</div>
            </div>
            <div className="gallery-info w-full max-w-[32rem]">
              <div className="gallery-info-meta">
                <span>{formatDate(activeDetail.updatedAt)}</span>
                <span>{activeDetail.status}</span>
                <span>{activeDetail.assetRefs.length} assets</span>
              </div>
              <div className="gallery-info-desc">{detailSummary}</div>
            </div>
          </>
        ) : (
          <div className="gallery-polaroid">
            <div className="gallery-display">
              <div className="gallery-display-placeholder">Select a gallery item</div>
            </div>
            <div className="gallery-polaroid-caption">No active item</div>
          </div>
        )}
      </div>

      <div className="gallery-right flex w-[11rem] shrink-0 flex-col rounded-[1.125rem] px-[1.25rem] py-[1.125rem]">
        <div className="panel-label">Timeline</div>
        <div className="timeline-track mt-[0.75rem] flex-1">
          {timeline.map((group) => (
            <div key={group.year}>
              <div className="timeline-year">{group.year}</div>
              {group.months.map((month, index) => (
                <div key={`${group.year}-${month.name}-${index}`} className={`tl-entry ${month.active ? 'active' : ''}`}>
                  <span className="tl-dot" />
                  {month.name}
                  <span className="tl-count">{month.count}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GalleryPage;
