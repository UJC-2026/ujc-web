import {
  Briefcase,
  FileText,
  GraduationCap,
  Home,
  MessageCircle,
  MessagesSquare,
  type LucideIcon,
} from "lucide-react";

/**
 * Categories store an icon name as text so admins can pick one without a
 * deploy. Unknown names fall back to a generic bubble.
 */
const ICONS: Record<string, LucideIcon> = {
  "graduation-cap": GraduationCap,
  home: Home,
  briefcase: Briefcase,
  "file-text": FileText,
  "message-circle": MessageCircle,
};

export function categoryIcon(name: string | null): LucideIcon {
  return (name && ICONS[name]) || MessagesSquare;
}
