import { characterArt } from "../constants/scape";

type Props = {
  district: string;
  size?: number;
  className?: string;
  rounded?: boolean;
  glow?: boolean;
};

/** 角色 IP 头像：按 district 取 CHARACTER_ART 头像（public/characters/<slug>.png）。 */
export function CharacterAvatar({ district, size, className = "", rounded = true, glow = false }: Props) {
  const ca = characterArt(district);
  const style = size ? { width: size, height: size } : undefined;
  return (
    <img
      src={`${import.meta.env.BASE_URL}${ca.art.replace(/^\//, "")}`}
      alt={`${ca.name} — ${ca.district} character`}
      className={`character-avatar ${rounded ? "rounded" : ""} ${glow ? "glow" : ""} ${className}`.trim()}
      width={size}
      height={size}
      loading="lazy"
      style={style}
    />
  );
}
