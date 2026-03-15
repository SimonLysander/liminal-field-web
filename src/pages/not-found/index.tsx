import { Link } from 'react-router-dom';

/** 404：You have reached the void. */
const NotFoundPage = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-2 text-2xl font-semibold">页面不存在</h1>
      <p className="mb-6 text-sm text-muted-foreground">此路不通，返回首页吧。</p>
      <Link
        to="/home"
        className="text-sm text-foreground underline underline-offset-4"
      >
        返回首页
      </Link>
    </div>
  );
};

export default NotFoundPage;
