/** Responsive Cloudflare Stream player (16:9) for a server-signed iframe URL. */
export function StreamPlayer({ src, title }: { src: string; title: string }) {
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}
