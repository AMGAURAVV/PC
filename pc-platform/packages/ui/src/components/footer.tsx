import * as React from 'react';
import { cn } from '../lib/utils';
import { Button } from './button';
import { Input } from './input';
import {
  Cpu,
  ShieldCheck,
  Zap,
  Truck,
  Headphones,
  CheckCircle2,
  Terminal,
} from 'lucide-react';

export interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className }) => {
  const [newsletterEmail, setNewsletterEmail] = React.useState('');
  const [subscribed, setSubscribed] = React.useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <footer
      className={cn(
        'border-t border-cyber-800/80 bg-cyber-950 text-cyber-300 relative overflow-hidden',
        className
      )}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Trust & Hardware Assurance Bar */}
      <div className="border-b border-cyber-800/60 py-8 bg-cyber-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyber-900 border border-cyber-700/60 flex items-center justify-center text-cyan-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  AUTHORITATIVE CHECKS
                </p>
                <p className="text-[11px] text-cyber-400">
                  Every part verified by rule-engine
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyber-900 border border-cyber-700/60 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  100% GENUINE HARDWARE
                </p>
                <p className="text-[11px] text-cyber-400">
                  Direct brand warranty support
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyber-900 border border-cyber-700/60 flex items-center justify-center text-purple-400 shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  EXPRESS DISPATCH
                </p>
                <p className="text-[11px] text-cyber-400">
                  Reinforced transit packaging
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyber-900 border border-cyber-700/60 flex items-center justify-center text-amber-400 shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  EXPERT BUILD DESK
                </p>
                <p className="text-[11px] text-cyber-400">
                  Specialized technician support
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Col 1: Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 p-0.5">
                <div className="w-full h-full bg-cyber-950 rounded-[6px] flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <span className="font-extrabold tracking-wider text-base text-white font-mono">
                NEXUS<span className="text-cyan-400">RIGS</span>
              </span>
            </div>

            <p className="text-xs text-cyber-400 leading-relaxed max-w-sm">
              Next-generation PC building platform powered by an authoritative hardware compatibility engine, real-time power budgeting, and automated physical clearance validation.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2 pt-2">
              <p className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
                HARDWARE DISPATCH & TELEMETRY
              </p>
              {subscribed ? (
                <p className="text-xs font-mono text-cyan-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  SUBMISSION RECORDED. WELCOME TO NEXUS INTEL.
                </p>
              ) : (
                <div className="flex gap-2 max-w-sm">
                  <Input
                    type="email"
                    placeholder="hardware.dev@nexus.io"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                  <Button variant="secondary" size="sm" type="submit" className="h-9 px-3 shrink-0 font-mono text-xs">
                    JOIN
                  </Button>
                </div>
              )}
            </form>
          </div>

          {/* Col 2: PC Configurator */}
          <div className="space-y-3">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              BUILD TOOLS
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="/pc-builder" className="hover:text-cyan-400 transition-colors">
                  Custom PC Builder
                </a>
              </li>
              <li>
                <a href="/compatibility-engine" className="hover:text-cyan-400 transition-colors">
                  Rule Engine Specs
                </a>
              </li>
              <li>
                <a href="/power-calculator" className="hover:text-cyan-400 transition-colors">
                  PSU Wattage Estimator
                </a>
              </li>
              <li>
                <a href="/builds" className="hover:text-cyan-400 transition-colors">
                  Community Builds
                </a>
              </li>
              <li>
                <a href="/benchmarks" className="hover:text-cyan-400 transition-colors">
                  Gaming Benchmarks
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Components */}
          <div className="space-y-3">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              COMPONENTS
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="/products?cat=cpu" className="hover:text-cyan-400 transition-colors">
                  CPUs & Processors
                </a>
              </li>
              <li>
                <a href="/products?cat=gpu" className="hover:text-cyan-400 transition-colors">
                  Graphics Cards
                </a>
              </li>
              <li>
                <a href="/products?cat=motherboard" className="hover:text-cyan-400 transition-colors">
                  Motherboards
                </a>
              </li>
              <li>
                <a href="/products?cat=ram" className="hover:text-cyan-400 transition-colors">
                  DDR5 / DDR4 RAM
                </a>
              </li>
              <li>
                <a href="/products?cat=storage" className="hover:text-cyan-400 transition-colors">
                  NVMe M.2 SSDs
                </a>
              </li>
              <li>
                <a href="/products?cat=psu" className="hover:text-cyan-400 transition-colors">
                  Power Supplies
                </a>
              </li>
              <li>
                <a href="/products?cat=case" className="hover:text-cyan-400 transition-colors">
                  Cases & Cooling
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Support & Platform */}
          <div className="space-y-3">
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              PLATFORM & SPECS
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="/docs/compatibility" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-cyan-400" />
                  API Documentation
                </a>
              </li>
              <li>
                <a href="/warranty-policy" className="hover:text-cyan-400 transition-colors">
                  Hardware Warranty
                </a>
              </li>
              <li>
                <a href="/shipping-rates" className="hover:text-cyan-400 transition-colors">
                  Transit & Handling
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-cyan-400 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-cyan-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: System Status & Copyright */}
        <div className="mt-12 pt-6 border-t border-cyber-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-cyber-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>COMPATIBILITY ENGINE STATUS: OPERATIONAL</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} NEXUS RIGS PLATFORM. ALL HARDWARE SPECIFICATIONS SUBJECT TO VERIFICATION.
          </div>
        </div>
      </div>
    </footer>
  );
};
