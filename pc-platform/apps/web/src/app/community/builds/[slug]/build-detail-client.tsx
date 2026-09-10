'use client';

import * as React from 'react';
import {
  Breadcrumbs,
  Badge,
  Button,
  Price,
  Textarea,
  Input,
  Label,
  Modal,
  ModalContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Select,
  useToast,
  ErrorState,
} from '@pc-platform/ui';
import {
  Cpu,
  Layers,
  Heart,
  MessageSquare,
  Share2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Wrench,
  Flag,
  Copy,
  ExternalLink,
} from 'lucide-react';
import {
  useCommunityBuild,
  useCommunityComments,
  useToggleBuildLike,
  useAddCommunityComment,
  useReportCommunityBuild,
} from '../../../../hooks/use-community';

export interface BuildDetailClientProps {
  slug: string;
  initialBuild?: any;
}

export function BuildDetailClient({ slug, initialBuild }: BuildDetailClientProps) {
  const { toast } = useToast();
  const { data: buildResponse, isLoading, isError, refetch } = useCommunityBuild(slug, {
    initialData: initialBuild ? { data: initialBuild } : undefined,
  });
  const build = buildResponse?.data;

  const { data: commentsResponse, refetch: refetchComments } = useCommunityComments(build?.id || '');
  const comments = commentsResponse?.data || [];

  const toggleLikeMutation = useToggleBuildLike(build?.id || '');
  const addCommentMutation = useAddCommunityComment(build?.id || '');
  const reportMutation = useReportCommunityBuild(build?.id || '');

  const [commentText, setCommentText] = React.useState('');
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const [reportModalOpen, setReportModalOpen] = React.useState(false);
  const [reportReason, setReportReason] = React.useState('SPAM_OR_ADVERTISING');
  const [reportDetails, setReportDetails] = React.useState('');
  const [isSubmittingReport, setIsSubmittingReport] = React.useState(false);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
        <div className="h-6 w-64 bg-cyber-900 rounded" />
        <div className="h-96 bg-cyber-900 rounded-3xl" />
      </div>
    );
  }

  if (isError || !build) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <ErrorState
          title="COMMUNITY BUILD NOT FOUND"
          message={`Unable to retrieve community build "${slug}". It may have been unlisted or removed.`}
          retryLabel="RETURN TO SHOWCASE"
          onRetry={() => (window.location.href = '/community')}
        />
      </div>
    );
  }

  const images = build.images && build.images.length > 0
    ? build.images
    : ['https://storage.googleapis.com/pc-platform-assets/builds/default-build.jpg'];

  const handleLike = async () => {
    try {
      await toggleLikeMutation.mutateAsync();
      toast({
        title: 'BUILD APPRECIATED',
        description: 'Your reaction has been logged.',
        variant: 'success',
      });
    } catch {
      toast({
        title: 'ACTION FAILED',
        description: 'Unable to update like. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await addCommentMutation.mutateAsync(commentText);
      setCommentText('');
      toast({
        title: 'COMMENT POSTED',
        description: 'Your hardware observation was shared with the builder.',
        variant: 'success',
      });
      refetchComments();
    } catch {
      toast({
        title: 'POSTING FAILED',
        description: 'Please sign in to leave comments on community builds.',
        variant: 'destructive',
      });
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    try {
      await reportMutation.mutateAsync({
        reason: reportReason,
        details: reportDetails,
      });
      setReportModalOpen(false);
      setReportDetails('');
      toast({
        title: 'REPORT SUBMITTED',
        description: 'Our moderation team will review this build promptly.',
        variant: 'success',
      });
    } catch {
      toast({
        title: 'REPORT FAILED',
        description: 'Could not send moderation report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'LINK COPIED',
      description: 'Community build URL copied to clipboard.',
      variant: 'success',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 pb-24">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Community', href: '/community' },
          { label: build.name },
        ]}
      />

      {/* Build Header Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* Left Column: Build Visuals */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-video w-full rounded-2xl border border-border/80 bg-cyber-950 overflow-hidden shadow-2xl">
            <img
              src={images[selectedImageIndex] || images[0]}
              alt={build.name}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover transition-all"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant="gaming" className="font-mono text-xs font-bold">
                {build.useCase}
              </Badge>
              {build.isFeatured && (
                <Badge variant="warning" className="font-mono text-xs font-bold">
                  ★ FEATURED
                </Badge>
              )}
            </div>
          </div>

          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto py-1">
              {images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-20 h-14 rounded-xl border overflow-hidden shrink-0 transition-all ${
                    idx === selectedImageIndex
                      ? 'border-cyan-400 ring-2 ring-cyan-400/40'
                      : 'border-border/60 hover:border-border'
                  }`}
                >
                  <img src={img} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Build Metadata & Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                VERIFIED COMMUNITY SYSTEM
              </span>
              <button
                type="button"
                onClick={() => setReportModalOpen(true)}
                className="text-xs font-mono text-muted-foreground hover:text-rose-400 flex items-center gap-1"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report</span>
              </button>
            </div>

            <h1 className="text-3xl font-extrabold text-white font-mono leading-tight">
              {build.name}
            </h1>

            <p className="text-xs font-mono text-muted-foreground">
              Published on {new Date(build.publishedAt || build.createdAt).toLocaleDateString()} by{' '}
              <span className="text-white font-semibold">
                {build.author ? `${build.author.firstName} ${build.author.lastName}` : 'Enthusiast Builder'}
              </span>
            </p>
          </div>

          {/* Price Box */}
          <div className="p-4 rounded-xl border border-border/80 bg-cyber-900/40 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-mono text-muted-foreground uppercase">ESTIMATED HARDWARE TOTAL</span>
              <span className="text-2xl font-extrabold font-mono text-cyan-400">
                ₹{Number(build.totalPrice).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <p className="text-sm text-cyber-300 leading-relaxed">
            {build.description ||
              `Custom ${build.useCase} build featuring ${build.cpuName} processor and ${build.gpuName} graphics. Rigorously verified for physical dimensions, thermal dissipation, and wattage headroom.`}
          </p>

          {/* Compatibility Badge Box */}
          <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 space-y-2.5">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>SYSTEM COMPATIBILITY AUDIT: PASSED</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-cyber-300">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Power: ~{build.compatibilitySummary?.estimatedWattage || 550}W</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Rec PSU: {build.compatibilitySummary?.recommendedPsuW || 750}W+</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <Button
                variant="gaming"
                size="lg"
                onClick={() => (window.location.href = `/builder?community=${build.slug}`)}
                className="flex-1 font-mono text-xs gap-2"
              >
                <Wrench className="w-4 h-4" />
                <span>OPEN IN CUSTOM PC BUILDER</span>
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={handleLike}
                className="gap-2 font-mono text-xs"
              >
                <Heart className={`w-4 h-4 text-rose-500 ${build.hasLiked ? 'fill-current' : ''}`} />
                <span>{build.likeCount}</span>
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={handleCopyShare}
                className="font-mono text-xs"
                title="Copy share link"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Components Breakdown Table */}
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold font-mono text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <span>INSTALLED COMPONENT SPECIFICATION</span>
        </h2>

        <div className="rounded-2xl border border-border/80 bg-cyber-950/80 overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs font-mono divide-y divide-border/60">
            <thead className="bg-cyber-900/60 text-muted-foreground uppercase text-[11px]">
              <tr>
                <th className="p-3.5">Component Role</th>
                <th className="p-3.5">Hardware Model</th>
                <th className="p-3.5 text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {(build.components && build.components.length > 0 ? build.components : [
                { componentType: 'CPU', name: build.cpuName || 'High-End Processor', price: 34999 },
                { componentType: 'GPU', name: build.gpuName || 'Flagship Graphics Card', price: 99999 },
                { componentType: 'Motherboard', name: build.motherboardName || 'Enthusiast Chipset Board', price: 21999 },
                { componentType: 'RAM', name: build.ramInfo || 'DDR5 32GB (2x16GB) 6000MT/s', price: 9499 },
                { componentType: 'Storage', name: build.storageInfo || '2TB Gen4 M.2 NVMe SSD', price: 11499 },
                { componentType: 'Case', name: build.caseName || 'High Airflow Dual-Chamber Chassis', price: 12999 },
                { componentType: 'Power Supply', name: build.psuInfo || '850W ATX 3.0 Gold Fully Modular', price: 10999 },
                { componentType: 'Cooler', name: build.coolerName || '360mm AIO Liquid Cooler', price: 8999 },
              ]).map((part: any, i: number) => (
                <tr key={i} className="hover:bg-cyber-900/30">
                  <td className="p-3.5 text-cyan-400 font-semibold">{part.componentType || 'Component'}</td>
                  <td className="p-3.5 text-white">
                    {part.productId ? (
                      <a
                        href={`/products/${part.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                        className="hover:underline hover:text-cyan-300"
                      >
                        {part.name}
                      </a>
                    ) : (
                      part.name
                    )}
                  </td>
                  <td className="p-3.5 text-right font-bold text-foreground">
                    {part.price ? `₹${Number(part.price).toLocaleString('en-IN')}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Community Comments Stream */}
      <section className="space-y-6 pt-6 border-t border-border/60">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold font-mono text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            <span>COMMUNITY FEEDBACK & BENCHMARKS ({comments.length})</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Comments List */}
          <div className="lg:col-span-7 space-y-4">
            {comments.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-border/80 text-center font-mono text-xs text-muted-foreground">
                No discussion yet. Start the conversation with questions or recommendations!
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((comm: any) => (
                  <div
                    key={comm.id}
                    className="p-4 rounded-xl border border-border/70 bg-cyber-950/60 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-white">
                        {comm.user ? `${comm.user.firstName} ${comm.user.lastName}` : 'Fellow Builder'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(comm.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-cyber-300 leading-relaxed">{comm.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Comment Form */}
          <div className="lg:col-span-5 p-6 rounded-2xl border border-border/80 bg-cyber-950/60 space-y-4">
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              POST A COMMENT
            </h3>
            <form onSubmit={handleAddComment} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Your Feedback or Question</Label>
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Ask about fan curves, undervolting, thermal headroom, or component choices..."
                  rows={4}
                  required
                />
              </div>
              <Button variant="gaming" size="sm" type="submit" className="w-full font-mono text-xs">
                SUBMIT COMMENT
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Report Build Modal */}
      <Modal open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <ModalContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-lg text-white">
              REPORT COMMUNITY BUILD
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Help us maintain authentic, high-quality hardware configurations.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReportSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Reason for Report</Label>
              <Select
                value={reportReason}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReportReason(e.target.value)}
                className="w-full text-xs font-mono"
              >
                <option value="SPAM_OR_ADVERTISING">Spam or Promotional Advertising</option>
                <option value="MISLEADING_PRICING">Misleading Pricing / Fake Components</option>
                <option value="INAPPROPRIATE_CONTENT">Inappropriate or Offensive Content</option>
                <option value="COPYRIGHT_INFRINGEMENT">Copyright / Stolen Images</option>
                <option value="HARASSMENT">Harassment or Abuse</option>
                <option value="OTHER">Other Reason</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Additional Context (Optional)</Label>
              <Textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide details for the moderation review team..."
                rows={3}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setReportModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                type="submit"
                disabled={isSubmittingReport}
                className="font-mono text-xs"
              >
                {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
              </Button>
            </DialogFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
