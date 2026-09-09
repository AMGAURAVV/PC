// ──────────────────────────────────────────────────────────────
// @pc-platform/ui — Shared Component Library
//
// Wraps shadcn/ui components with platform-specific defaults.
// No data fetching. No business logic. Pure presentation.
//
// To add a shadcn component:
//   pnpm dlx shadcn-ui@latest add <component> --output-dir packages/ui/src/components
// ──────────────────────────────────────────────────────────────

// Utility
export { cn } from './lib/utils';

// Components (add as shadcn components are installed)
// export { Button } from './components/button';
// export { Card, CardContent, CardHeader, CardTitle } from './components/card';
// export { Badge } from './components/badge';
// export { Input } from './components/input';
// export { Label } from './components/label';
// export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/select';
// export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/dialog';
// export { Separator } from './components/separator';
// export { Toast, Toaster } from './components/toast';

// Re-export icons used across the platform
export {
  ShoppingCart,
  Search,
  User,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Check,
  AlertCircle,
  AlertTriangle,
  Info,
  Star,
  Heart,
  Cpu,
  HardDrive,
  Monitor,
  Zap,
  Package,
  Truck,
  Shield,
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Filter,
  SortAsc,
  Grid,
  List,
} from 'lucide-react';
