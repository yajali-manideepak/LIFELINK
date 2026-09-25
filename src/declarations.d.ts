declare module 'canvas-confetti' {
  interface ConfettiOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    colors?: string[];
    shapes?: string[];
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }
  function confetti(options?: ConfettiOptions): Promise<null> | null;
  export default confetti;
}

declare module 'lucide-react' {
  import * as React from 'react';
  export interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
  }
  export const Activity: React.FC<IconProps>;
  export const HeartPulse: React.FC<IconProps>;
  export const Building2: React.FC<IconProps>;
  export const Users: React.FC<IconProps>;
  export const TestTubes: React.FC<IconProps>;
  export const PlayCircle: React.FC<IconProps>;
  export const FileText: React.FC<IconProps>;
  export const BarChart3: React.FC<IconProps>;
  export const WifiOff: React.FC<IconProps>;
  export const AlertTriangle: React.FC<IconProps>;
  export const UserCheck: React.FC<IconProps>;
  export const ChevronDown: React.FC<IconProps>;
  export const Search: React.FC<IconProps>;
  export const AlertOctagon: React.FC<IconProps>;
  export const Megaphone: React.FC<IconProps>;
  export const MapPin: React.FC<IconProps>;
  export const HeartHandshake: React.FC<IconProps>;
  export const Microscope: React.FC<IconProps>;
  export const CheckCircle2: React.FC<IconProps>;
  export const PackageCheck: React.FC<IconProps>;
  export const RotateCcw: React.FC<IconProps>;
  export const ArrowRight: React.FC<IconProps>;
  export const Play: React.FC<IconProps>;
  export const Info: React.FC<IconProps>;
  export const Clock: React.FC<IconProps>;
  export const Droplet: React.FC<IconProps>;
  export const Heart: React.FC<IconProps>;
  export const PlusCircle: React.FC<IconProps>;
  export const ShieldCheck: React.FC<IconProps>;
  export const CheckCircle: React.FC<IconProps>;
  export const XCircle: React.FC<IconProps>;
  export const Calendar: React.FC<IconProps>;
  export const Phone: React.FC<IconProps>;
  export const User: React.FC<IconProps>;
  export const RefreshCw: React.FC<IconProps>;
  export const Lock: React.FC<IconProps>;
  export const AlertCircle: React.FC<IconProps>;
  export const PhoneCall: React.FC<IconProps>;
  export const Navigation: React.FC<IconProps>;
  export const Award: React.FC<IconProps>;
  export const ToggleLeft: React.FC<IconProps>;
  export const ToggleRight: React.FC<IconProps>;
  export const Package: React.FC<IconProps>;
  export const Layers: React.FC<IconProps>;
  export const FileCheck: React.FC<IconProps>;
  export const Flame: React.FC<IconProps>;
  export const Truck: React.FC<IconProps>;
  export const Shield: React.FC<IconProps>;
  export const Filter: React.FC<IconProps>;
  export const Database: React.FC<IconProps>;
  export const Download: React.FC<IconProps>;
  export const Copy: React.FC<IconProps>;
  export const Check: React.FC<IconProps>;
  export const TrendingUp: React.FC<IconProps>;
  export const PieChart: React.FC<IconProps>;
  export const UserX: React.FC<IconProps>;
  export const HelpCircle: React.FC<IconProps>;
  export const X: React.FC<IconProps>;
}
