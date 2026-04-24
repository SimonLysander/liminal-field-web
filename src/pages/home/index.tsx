const activities = [
  { date: 'Apr 23, 2026', text: '重写了公开阅读与图库壳体，让页面回到 Archive 的秩序里。', type: '站点 · 改版' },
  { date: 'Apr 22, 2026', text: '完成了一次新的正式版本提交，并保持当前公开版本不被直接替换。', type: '文稿 · 提交' },
  { date: 'Apr 21, 2026', text: '草稿工作区与正式内容页彻底分离，编辑不再污染公开阅读。', type: '工作流 · 重构' },
  { date: 'Apr 20, 2026', text: '接入 Git 版本历史，并明确 latestVersion 与 publishedVersion 的职责。', type: '版本 · 接通' },
  { date: 'Apr 18, 2026', text: '确定 Archive 为唯一视觉参考，不再额外发明新的前端语言。', type: '设计 · 对齐' },
];

const features = [
  {
    label: '精选文稿',
    title: 'Published Notes',
    body: '公开阅读只承载已发布版本，正式内容与草稿编辑都从这个房间撤出。',
    thumb: '阅读桌面',
  },
  {
    label: '精选图像',
    title: 'Gallery Sequence',
    body: '标签、时间线与中心相片架重新变成辅助关系，而不是泛化的后台布局。',
    thumb: '图像序列',
  },
  {
    label: '系统状态',
    title: 'Versioned Archive',
    body: 'Commit 负责形成正式版本，Publish 只负责切换公开指针，页面语义终于干净。',
    thumb: '版本指针',
  },
];

const HomePage = () => {
  return (
    <div className="home-view flex flex-1 flex-col gap-[1.5rem] overflow-y-auto px-[1.5rem] pb-[1.5rem] pt-[1rem]">
      <div className="home-activity paper-texture flex flex-col rounded-[1.125rem] px-[1.5rem] py-[1.25rem]">
        <div className="home-activity-title mb-[0.875rem]">最近活动</div>
        <div className="activity-timeline flex flex-col gap-[0.625rem]">
          {activities.map((activity) => (
            <div key={`${activity.date}-${activity.type}`} className="activity-item">
              <div className="activity-date">{activity.date}</div>
              <div className="activity-text">{activity.text}</div>
              <div className="activity-type">{activity.type}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="home-features grid min-h-0 grid-cols-3 gap-[1.5rem]">
        {features.map((feature) => (
          <div key={feature.title} className="feature-card paper-texture flex min-h-[17.5rem] flex-col rounded-[1.375rem] px-[1.375rem] py-[1.25rem]">
            <div className="feature-label">{feature.label}</div>
            <div className="card-title mt-[0.625rem]">{feature.title}</div>
            <div className="card-body mt-[0.75rem] flex-1">{feature.body}</div>
            <div className="feature-thumb mt-[1rem]">{feature.thumb}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
