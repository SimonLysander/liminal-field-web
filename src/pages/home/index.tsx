/** 首页：最近活动、精选文档、精选图片、站点全览 */
const HomePage = () => {
  return (
    <div className="space-y-6 p-6">
      <section className="space-y-2">
        <h1 className="text-xl font-semibold">首页</h1>
        <p className="text-sm text-muted-foreground">
          这里会逐步汇总文档、图文和整体导航入口。
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="border border-border p-4">
          <h2 className="text-sm font-medium">最近文档</h2>
          <p className="mt-2 text-sm text-muted-foreground">后续接 note 内容。</p>
        </div>
        <div className="border border-border p-4">
          <h2 className="text-sm font-medium">图文展馆</h2>
          <p className="mt-2 text-sm text-muted-foreground">后续接 post 内容。</p>
        </div>
        <div className="border border-border p-4">
          <h2 className="text-sm font-medium">站点概览</h2>
          <p className="mt-2 text-sm text-muted-foreground">保留基础入口说明。</p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
