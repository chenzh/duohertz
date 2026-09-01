import { characterArt, characterArtWebp } from "../constants/scape";

type Props = {
  district: string;
  size?: number;
  className?: string;
  rounded?: boolean;
  glow?: boolean;
};

/**
 * 角色 IP 头像：按 district 取头像。原图是 640–832px 的 PNG（首屏白烧 ~6 MB），
 * 这里改吃预生成的 WebP（128w / 512w 两档），用 srcset 让浏览器按显示尺寸挑档。
 * 全部现代浏览器都支持 WebP，旧内核（<2021）会回退到 PNG（public/characters/<slug>.png 仍保留）。
 */
export function CharacterAvatar({ district, size, className = "", rounded = true, glow = false }: Props) {
  const ca = characterArt(district);
  const base = import.meta.env.BASE_URL;
  const webp128 = `${base}${characterArtWebp(district, 128)}`;
  const webp512 = `${base}${characterArtWebp(district, 512)}`;
  // .character-avatar 用 object-fit: cover，框决定显示比例，这里给图片本征尺寸（512×748）防 CLS。
  const style = size ? { width: size, height: size } : undefined;
  const sizes = size ? `${size}px` : "(max-width: 640px) 50vw, 240px";
  return (
    <img
      src={webp512}
      srcSet={`${webp128} 128w, ${webp512} 512w`}
      sizes={sizes}
      alt={`${ca.name} — ${ca.district} character`}
      className={`character-avatar ${rounded ? "rounded" : ""} ${glow ? "glow" : ""} ${className}`.trim()}
      width={512}
      height={748}
      loading="lazy"
      decoding="async"
      style={style}
    />
  );
}
