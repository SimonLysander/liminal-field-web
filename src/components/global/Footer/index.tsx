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
    <footer className="lf-breadcrumb mx-auto mb-1 mt-auto w-full justify-between text-[0.74rem]">
      <span>Liminal Field · public shell</span>
      <span className="truncate text-[hsl(var(--ink-faded))]">
        Build {buildTime} · {buildHash}
      </span>
    </footer>
  );
};

export default Footer;
