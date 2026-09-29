import {
  Brush,
  Camera,
  Flag,
  Map,
  Music,
  Ruler,
  Search,
  Shield,
  Sparkles,
  Swords,
  Tag,
  Trophy,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { GameFeature } from "@/data/games";

/** Icon for each `GameFeature["icon"]` name — shared by the detail page and the home spotlight. */
export const FEATURE_ICONS: Record<GameFeature["icon"], LucideIcon> = {
  flag: Flag,
  brush: Brush,
  trophy: Trophy,
  swords: Swords,
  shield: Shield,
  zap: Zap,
  map: Map,
  users: Users,
  music: Music,
  sparkles: Sparkles,
  camera: Camera,
  wrench: Wrench,
  search: Search,
  tag: Tag,
  ruler: Ruler,
};
