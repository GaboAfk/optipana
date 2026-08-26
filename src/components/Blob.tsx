type BlobProps = {
  className?: string;
  color: string;
  opacity?: number;
};

export function Blob({ className = "", color, opacity = 0.15 }: BlobProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} style={{ opacity }} aria-hidden="true">
      <path
        fill={color}
        d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.5,90,-15.5,88.4,-0.3C86.8,14.9,81,29.8,72.6,43.4C64.2,57,53.2,69.3,39.6,75.8C26,82.3,9.8,83,-6.8,81.8C-23.4,80.7,-40.4,77.7,-52.8,69.3C-65.2,60.9,-73,47.1,-79.2,32.7C-85.4,18.3,-90,3.3,-88.1,-11.2C-86.2,-25.7,-77.8,-39.7,-66.6,-50.4C-55.4,-61.1,-41.4,-68.5,-27.5,-75.8C-13.6,-83.1,0.2,-90.3,14.2,-88.8C28.2,-87.3,30.6,-83.7,44.7,-76.4Z"
        transform="translate(100 100)"
      />
    </svg>
  );
}
