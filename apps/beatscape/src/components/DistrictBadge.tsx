import { districtColor } from "../constants/scape";

type Props = {
  district: string;
  className?: string;
};

export function DistrictBadge({ district, className = "" }: Props) {
  const color = districtColor(district);
  return (
    <span
      className={`district-badge ${className}`.trim()}
      style={{ ["--district-color" as string]: color }}
    >
      {district}
    </span>
  );
}
