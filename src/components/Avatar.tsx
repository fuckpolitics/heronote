interface Props {
  value?: string | null;
  name?: string;
  size?: number;
  ring?: string;
  className?: string;
}

function isImage(v: string): boolean {
  return v.startsWith("data:") || v.startsWith("http://") || v.startsWith("https://");
}

/** Универсальная аватарка: картинка (data/url), эмодзи или инициал имени. */
export function Avatar({ value, name = "", size = 40, ring, className = "" }: Props) {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    ...(ring ? { boxShadow: `0 0 0 2px ${ring}, 0 0 16px -4px ${ring}` } : {}),
  };

  if (value && isImage(value)) {
    return (
      <img
        src={value}
        alt={name}
        style={style}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  const content = value && value.trim() ? value : (name.trim()[0] || "?").toUpperCase();
  return (
    <div
      style={{ ...style, fontSize: size * 0.5 }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sys-blue/40 to-sys-purple/40 font-display font-black text-white ${className}`}
    >
      {content}
    </div>
  );
}
