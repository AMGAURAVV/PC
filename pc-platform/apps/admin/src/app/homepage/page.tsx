'use client';

import * as React from 'react';
import { Home, Save, CheckCircle2, Sparkles, Megaphone, Star } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Label,
  Textarea,
  Badge,
} from '@pc-platform/ui';
import { AdminBreadcrumbs } from '../../components/shell/admin-breadcrumbs';

export default function AdminHomepageConfigPage() {
  const [saved, setSaved] = React.useState(false);

  // Merchandising state
  const [heroHeading, setHeroHeading] = React.useState('ENGINEER YOUR ULTIMATE BATTLESTATION');
  const [heroSubtitle, setHeroSubtitle] = React.useState(
    'India\'s most advanced custom PC building platform with authoritative hardware compatibility checks.',
  );
  const [announcementText, setAnnouncementText] = React.useState(
    '⚡ Monsoon Rig Upgrade Fest: Use code NEXUS10 for 10% instant off on select RTX 40-Series builds!',
  );
  const [showAnnouncement, setShowAnnouncement] = React.useState(true);
  const [flashDealsActive, setFlashDealsActive] = React.useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <AdminBreadcrumbs items={[{ label: 'Homepage Merchandising' }]} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cyber-800/80 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
            HOMEPAGE MERCHANDISING CONTROL
          </h1>
          <p className="text-xs text-cyber-400 mt-1">
            Configure live customer storefront hero marketing, announcement banners, and featured component highlights.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Published to Storefront
            </span>
          )}
          <Button variant="gaming" size="sm" onClick={handleSave} className="gap-1.5 font-mono text-xs">
            <Save className="w-3.5 h-3.5" />
            <span>PUBLISH CHANGES</span>
          </Button>
        </div>
      </div>

      <div className="space-y-6 font-mono text-xs">
        {/* Hero Section */}
        <Card variant="default">
          <CardHeader>
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>STOREFRONT HERO BANNER COPY</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Primary brand tagline and value proposition rendered on route /.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-cyber-300">Main Hero Headline *</Label>
              <Input
                value={heroHeading}
                onChange={(e) => setHeroHeading(e.target.value)}
                className="mt-1 h-9 text-xs font-bold text-white"
              />
            </div>

            <div>
              <Label className="text-xs text-cyber-300">Hero Subtitle Copy</Label>
              <Textarea
                rows={2}
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Announcement Ticker */}
        <Card variant="default">
          <CardHeader>
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-400" />
              <span>TOP ANNOUNCEMENT BAR</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Global sticky ticker bar displayed across all customer storefront pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-cyber-300">Ticker Announcement Message</Label>
              <Input
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-6 pt-2 border-t border-cyber-800">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAnnouncement}
                  onChange={(e) => setShowAnnouncement(e.target.checked)}
                  className="rounded bg-cyber-900 border-cyber-700 text-cyan-500"
                />
                <span className="text-cyber-300">Show Top Announcement Bar</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={flashDealsActive}
                  onChange={(e) => setFlashDealsActive(e.target.checked)}
                  className="rounded bg-cyber-900 border-cyber-700 text-cyan-500"
                />
                <span className="text-cyber-300">Enable Flash Deals Promotion Ribbon</span>
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
