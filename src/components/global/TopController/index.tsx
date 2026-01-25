const TopController = () => {
  return (
    <div className="flex items-center flex-justify-between gap-12 h-16 sticky top-0 bg-white border-gray-200 shadow-md">
      <div className="flex items-center flex-justify-between gap-4">
        <div>Liminal-field</div>
        <div>loading...</div>
      </div>
      <div>搜索框</div>
      <div className="flex items-center flex-justify-between gap-4">
        <div>主题</div>
        <div>白噪</div>
        <div>专注</div>
      </div>
    </div>
  );
};

export default TopController;
