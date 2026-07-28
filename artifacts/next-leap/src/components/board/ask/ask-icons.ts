import {
  Award,
  BookOpen,
  Building2,
  Calendar,
  Camera,
  Car,
  ChefHat,
  Clock,
  Coffee,
  Croissant,
  Dumbbell,
  Globe,
  Handshake,
  Heart,
  Home,
  Laptop,
  ListChecks,
  Mail,
  Map,
  MessageSquare,
  Mic,
  Minus,
  Music,
  Package,
  Palette,
  PenLine,
  Phone,
  Plane,
  Scale,
  ShoppingBag,
  Star,
  Store,
  Sun,
  Moon,
  Truck,
  TrendingUp,
  User,
  Users,
  Wrench,
  Droplet,
  DollarSign,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';

/**
 * Concept keys an image ask may use.
 *
 * MUST stay identical to ASK_ICONS in
 * artifacts/api-server/src/routes/nextleap/engine.ts. The server validates the
 * model's icon name against its copy; a key the server allows but this map
 * can't draw falls back to a monogram tile rather than an empty square.
 *
 * Icons rather than photographs on purpose: there's no asset pipeline and no
 * CDN here, and an icon is a category marker instead of a claim about someone's
 * life — so it can't break the never-invent-data rule. The honest tradeoff is
 * that this is illustrated multiple choice, not imagery.
 */
export const ASK_ICONS: Record<string, LucideIcon> = {
  money: DollarSign,
  calendar: Calendar,
  clock: Clock,
  people: Users,
  oneperson: User,
  storefront: Store,
  home: Home,
  building: Building2,
  delivery: Truck,
  package: Package,
  shop: ShoppingBag,
  phone: Phone,
  laptop: Laptop,
  online: Globe,
  email: Mail,
  message: MessageSquare,
  camera: Camera,
  mic: Mic,
  music: Music,
  food: Croissant,
  kitchen: ChefHat,
  coffee: Coffee,
  water: Droplet,
  fitness: Dumbbell,
  art: Palette,
  writing: PenLine,
  list: ListChecks,
  award: Award,
  handshake: Handshake,
  teaching: GraduationCap,
  book: BookOpen,
  tools: Wrench,
  map: Map,
  car: Car,
  travel: Plane,
  morning: Sun,
  evening: Moon,
  up: TrendingUp,
  flat: Minus,
  legal: Scale,
  heart: Heart,
  star: Star,
};

/** Anything not in the registry degrades to a monogram, never a blank tile. */
export function askIcon(key: string | undefined): LucideIcon | null {
  if (!key) return null;
  return ASK_ICONS[key] ?? null;
}