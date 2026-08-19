import * as LucideIcons from 'lucide-react';
import { LucideIcon, Box } from 'lucide-react';

export interface IconItem {
  name: string;
  label: string;
  category: string;
  icon: LucideIcon;
}

// 1. Curated list for quick category browsing
export const CURATED_ICON_LIST: IconItem[] = [
  // General & Tech
  { name: 'Box', label: 'Box / Block', category: 'General', icon: LucideIcons.Box },
  { name: 'Cpu', label: 'CPU / Processor', category: 'General', icon: LucideIcons.Cpu },
  { name: 'Server', label: 'Server', category: 'General', icon: LucideIcons.Server },
  { name: 'Cloud', label: 'Cloud', category: 'General', icon: LucideIcons.Cloud },
  { name: 'Terminal', label: 'Terminal / CLI', category: 'General', icon: LucideIcons.Terminal },
  { name: 'Code2', label: 'Code', category: 'General', icon: LucideIcons.Code2 },
  { name: 'Bot', label: 'AI / Bot', category: 'General', icon: LucideIcons.Bot },
  { name: 'Microchip', label: 'Hardware', category: 'General', icon: LucideIcons.Microchip },
  { name: 'Laptop', label: 'Client / Laptop', category: 'General', icon: LucideIcons.Laptop },
  { name: 'Smartphone', label: 'Mobile Device', category: 'General', icon: LucideIcons.Smartphone },
  { name: 'Monitor', label: 'Web Frontend', category: 'General', icon: LucideIcons.Monitor },

  // Data & Storage
  { name: 'Database', label: 'SQL Database', category: 'Data & Storage', icon: LucideIcons.Database },
  { name: 'HardDrive', label: 'Disk / Volume', category: 'Data & Storage', icon: LucideIcons.HardDrive },
  { name: 'Flame', label: 'Cache (Redis)', category: 'Data & Storage', icon: LucideIcons.Flame },
  { name: 'Layers', label: 'Multi-tier / Stack', category: 'Data & Storage', icon: LucideIcons.Layers },
  { name: 'Boxes', label: 'NoSQL Storage', category: 'Data & Storage', icon: LucideIcons.Boxes },
  { name: 'Table', label: 'Data Table', category: 'Data & Storage', icon: LucideIcons.Table },
  { name: 'FolderArchive', label: 'Object Storage (S3)', category: 'Data & Storage', icon: LucideIcons.FolderArchive },
  { name: 'Archive', label: 'Archive / Backup', category: 'Data & Storage', icon: LucideIcons.Archive },
  { name: 'FileCode', label: 'Scripts / Config', category: 'Data & Storage', icon: LucideIcons.FileCode },

  // Networking & Cloud
  { name: 'Globe', label: 'Web / Internet', category: 'Networking', icon: LucideIcons.Globe },
  { name: 'Network', label: 'Network / Subnet', category: 'Networking', icon: LucideIcons.Network },
  { name: 'Router', label: 'Router / Gateway', category: 'Networking', icon: LucideIcons.Router },
  { name: 'Split', label: 'Load Balancer', category: 'Networking', icon: LucideIcons.Split },
  { name: 'Zap', label: 'Lambda / Function', category: 'Networking', icon: LucideIcons.Zap },
  { name: 'Share2', label: 'API Endpoint', category: 'Networking', icon: LucideIcons.Share2 },
  { name: 'Wifi', label: 'Wireless / Edge', category: 'Networking', icon: LucideIcons.Wifi },
  { name: 'Workflow', label: 'Pipeline / Flow', category: 'Networking', icon: LucideIcons.Workflow },

  // Security & Auth
  { name: 'ShieldCheck', label: 'Firewall / WAF', category: 'Security & Auth', icon: LucideIcons.ShieldCheck },
  { name: 'Lock', label: 'Encryption / SSL', category: 'Security & Auth', icon: LucideIcons.Lock },
  { name: 'KeyRound', label: 'OAuth / IAM', category: 'Security & Auth', icon: LucideIcons.KeyRound },
  { name: 'Key', label: 'API Key / Secret', category: 'Security & Auth', icon: LucideIcons.Key },
  { name: 'Fingerprint', label: 'Biometrics / MFA', category: 'Security & Auth', icon: LucideIcons.Fingerprint },
  { name: 'UserCheck', label: 'User Auth', category: 'Security & Auth', icon: LucideIcons.UserCheck },
  { name: 'Users', label: 'Tenant / Group', category: 'Security & Auth', icon: LucideIcons.Users },
  { name: 'ShieldAlert', label: 'Security Guard', category: 'Security & Auth', icon: LucideIcons.ShieldAlert },

  // Commerce & Payments
  { name: 'CreditCard', label: 'Payments (Stripe)', category: 'Payments', icon: LucideIcons.CreditCard },
  { name: 'DollarSign', label: 'Billing / Invoice', category: 'Payments', icon: LucideIcons.DollarSign },
  { name: 'ShoppingCart', label: 'E-commerce Store', category: 'Payments', icon: LucideIcons.ShoppingCart },
  { name: 'Wallet', label: 'Wallet / Crypto', category: 'Payments', icon: LucideIcons.Wallet },
  { name: 'Receipt', label: 'Transactions', category: 'Payments', icon: LucideIcons.Receipt },

  // Communication & Events
  { name: 'Mail', label: 'Email (SES/SendGrid)', category: 'Communication', icon: LucideIcons.Mail },
  { name: 'MessageSquareCode', label: 'Message Broker', category: 'Communication', icon: LucideIcons.MessageSquareCode },
  { name: 'MessageSquare', label: 'Chat / Slack', category: 'Communication', icon: LucideIcons.MessageSquare },
  { name: 'Bell', label: 'Push Notifications', category: 'Communication', icon: LucideIcons.Bell },
  { name: 'Webhook', label: 'Webhooks', category: 'Communication', icon: LucideIcons.Webhook },
  { name: 'Send', label: 'SMS / Twilio', category: 'Communication', icon: LucideIcons.Send },

  // DevOps & Tools
  { name: 'GitBranch', label: 'Git / VCS', category: 'DevOps', icon: LucideIcons.GitBranch },
  { name: 'GitPullRequest', label: 'CI / CD Pipeline', category: 'DevOps', icon: LucideIcons.GitPullRequest },
  { name: 'Container', label: 'Docker Container', category: 'DevOps', icon: LucideIcons.Container },
  { name: 'Package', label: 'NPM / Package', category: 'DevOps', icon: LucideIcons.Package },
  { name: 'Settings', label: 'Configuration', category: 'DevOps', icon: LucideIcons.Settings },
  { name: 'Play', label: 'Worker / Job', category: 'DevOps', icon: LucideIcons.Play },

  // Analytics & Monitoring
  { name: 'Activity', label: 'APM / Monitoring', category: 'Monitoring', icon: LucideIcons.Activity },
  { name: 'BarChart2', label: 'Analytics / Metrics', category: 'Monitoring', icon: LucideIcons.BarChart2 },
  { name: 'LineChart', label: 'Telemetry', category: 'Monitoring', icon: LucideIcons.LineChart },
  { name: 'Gauge', label: 'Performance', category: 'Monitoring', icon: LucideIcons.Gauge },
  { name: 'Eye', label: 'Observability', category: 'Monitoring', icon: LucideIcons.Eye },
  { name: 'AlertTriangle', label: 'Alerting / Pager', category: 'Monitoring', icon: LucideIcons.AlertTriangle },
  { name: 'Clock', label: 'Cron / Scheduler', category: 'Monitoring', icon: LucideIcons.Clock },
];

// 2. Full index of ALL Lucide icons dynamically generated for global search
const nonIconKeys = new Set([
  'createLucideIcon',
  'default',
  'Icon',
  'LucideIcon',
  'LucideProps',
  'icons',
  'categories',
  'aliases',
]);

export const ALL_LUCIDE_ICONS: IconItem[] = Object.keys(LucideIcons)
  .filter((key) => {
    if (nonIconKeys.has(key)) return false;
    if (!/^[A-Z]/.test(key)) return false;
    const component = (LucideIcons as Record<string, unknown>)[key];
    return typeof component === 'function' || typeof component === 'object';
  })
  .sort()
  .map((name) => ({
    name,
    label: name.replace(/([A-Z])/g, ' $1').trim(),
    category: 'All',
    icon: (LucideIcons as unknown as Record<string, LucideIcon>)[name],
  }));

const LUCIDE_LOWERCASE_MAP = new Map<string, LucideIcon>();
Object.keys(LucideIcons).forEach((key) => {
  if (/^[A-Z]/.test(key) && !nonIconKeys.has(key)) {
    const comp = (LucideIcons as Record<string, unknown>)[key];
    if (typeof comp === 'function' || typeof comp === 'object') {
      LUCIDE_LOWERCASE_MAP.set(key.toLowerCase(), comp as LucideIcon);
      LUCIDE_LOWERCASE_MAP.set(key.toLowerCase().replace(/[-_]/g, ''), comp as LucideIcon);
    }
  }
});

// Fast resolver for any Lucide icon name (case-insensitive and alias-aware)
export const getIconComponent = (
  iconName?: string,
  fallbackIcon: LucideIcon = Box
): LucideIcon => {
  if (!iconName) return fallbackIcon;
  const icon = (LucideIcons as Record<string, unknown>)[iconName];
  if (icon && (typeof icon === 'function' || typeof icon === 'object')) {
    return icon as LucideIcon;
  }
  const clean = iconName.toLowerCase().replace(/[-_]/g, '');
  const matched = LUCIDE_LOWERCASE_MAP.get(clean) || LUCIDE_LOWERCASE_MAP.get(iconName.toLowerCase());
  if (matched) {
    return matched;
  }
  return fallbackIcon;
};
