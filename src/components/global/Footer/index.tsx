/** 页脚：最后一次构建时间 + Hash ID */
const Footer = () => {
  const buildTime =
    typeof import.meta.env.VITE_BUILD_TIME !== 'undefined'
      ? import.meta.env.VITE_BUILD_TIME
      : new Date().toISOString().slice(0, 10);
  const buildHash =
    typeof import.meta.env.VITE_BUILD_HASH !== 'undefined'
      ? import.meta.env.VITE_BUILD_HASH
      : 'dev';

  return (
    <footer className="flex items-center justify-center gap-4 border-t border-border px-4 py-2 text-xs text-muted-foreground">
      <span>Build: {buildTime}</span>
      <span>Hash: {buildHash}</span>
    </footer>
  );
};

export default Footer;
