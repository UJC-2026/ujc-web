import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-caption font-medium [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        neutral: "bg-surface-muted text-primary",
        primary: "bg-primary text-primary-foreground",
        accent: "bg-accent-muted text-gold-600 dark:text-accent",
        outline: "border border-border text-muted-foreground",
        success: "bg-success/12 text-success",
        danger: "bg-danger/12 text-danger",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

const ROLE_VARIANT = {
  admin: "primary",
  moderator: "accent",
  member: "outline",
} as const;

const ROLE_LABEL = {
  admin: "Admin",
  moderator: "Moderator",
  member: "Anggota",
} as const;

export function RoleBadge({ role }: { role: keyof typeof ROLE_LABEL }) {
  return <Badge variant={ROLE_VARIANT[role]}>{ROLE_LABEL[role]}</Badge>;
}
