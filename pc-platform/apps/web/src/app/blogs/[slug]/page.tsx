import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  Breadcrumbs,
  Badge,
  Button,
} from '@pc-platform/ui';
import {
  Calendar,
  Clock,
  User,
  Share2,
  ArrowLeft,
  Wrench,
  CheckCircle2,
} from 'lucide-react';
import { getBlogPostBySlug, getAllBlogPosts } from '../../../lib/blogs';
import {
  constructMetadata,
  JsonLd,
  generateArticleSchema,
  generateBreadcrumbSchema,
  siteConfig,
} from '../../../lib/seo';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = getBlogPostBySlug(params.slug);

  if (!post) {
    return constructMetadata({
      title: 'Article Not Found',
      description: 'The requested hardware guide could not be found.',
      canonicalPath: `/blogs/${params.slug}`,
      noIndex: true,
    });
  }

  return constructMetadata({
    title: post.title,
    description: post.excerpt,
    image: post.coverImage,
    canonicalPath: `/blogs/${params.slug}`,
    type: 'article',
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    author: post.author.name,
    keywords: [
      ...post.tags,
      post.category,
      'hardware guide',
      'PC building tutorial',
      'benchmarks',
    ],
  });
}

export const revalidate = 120;

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const post = getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Hardware Guides', url: '/blogs' },
    { name: post.title, url: `/blogs/${params.slug}` },
  ];

  const uiBreadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Hardware Guides', href: '/blogs' },
    { label: post.title },
  ];

  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);

  const articleSchema = generateArticleSchema({
    title: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    authorName: post.author.name,
    url: `/blogs/${params.slug}`,
  });

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 pb-28">
      <JsonLd data={[articleSchema, breadcrumbSchema]} />

      {/* Breadcrumbs */}
      <Breadcrumbs items={uiBreadcrumbs} />

      {/* Article Header */}
      <header className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="gaming" className="font-mono text-xs font-semibold">
            {post.category}
          </Badge>
          <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            {post.readingTimeMinutes} min read
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-mono leading-tight tracking-tight">
          {post.title}
        </h1>

        <p className="text-base sm:text-lg text-cyber-300 leading-relaxed">
          {post.excerpt}
        </p>

        {/* Author Metadata Bar */}
        <div className="pt-4 pb-2 border-y border-border/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyber-900 border border-border/80 flex items-center justify-center font-mono font-bold text-cyan-400 text-sm">
              {post.author.name[0]}
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-white uppercase">
                {post.author.name}
              </p>
              <p className="text-[11px] font-mono text-muted-foreground">
                {post.author.role}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Published: {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </header>

      {/* Hero Image */}
      <div className="relative aspect-[16/9] w-full rounded-2xl border border-border/80 bg-cyber-950 overflow-hidden shadow-2xl">
        <img
          src={post.coverImage}
          alt={post.title}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Article Body Content */}
      <div className="prose prose-invert max-w-none space-y-6 text-cyber-200 leading-relaxed font-sans text-sm sm:text-base">
        {post.content.split('\n\n').map((paragraph, idx) => {
          if (paragraph.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-xl sm:text-2xl font-bold font-mono text-white pt-6 border-b border-border/60 pb-2">
                {paragraph.replace('### ', '')}
              </h3>
            );
          }
          if (paragraph.startsWith('1. ') || paragraph.startsWith('- ')) {
            const lines = paragraph.split('\n');
            return (
              <ul key={idx} className="space-y-2 list-disc pl-5">
                {lines.map((l, li) => (
                  <li key={li} className="text-cyber-300">
                    {l.replace(/^[0-9]+\.\s+/, '').replace(/^-\s+/, '')}
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <p key={idx} className="text-cyber-300 leading-relaxed">
              {paragraph.trim()}
            </p>
          );
        })}
      </div>

      {/* Tags Chips */}
      <div className="pt-6 border-t border-border/60 space-y-3">
        <span className="text-xs font-mono font-bold uppercase text-muted-foreground">
          RELATED HARDWARE TOPICS:
        </span>
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-lg border border-border/70 bg-cyber-900/60 text-xs font-mono text-cyan-300"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Next Step / PC Builder CTA */}
      <div className="p-6 sm:p-8 rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 via-cyber-950 to-purple-950/40 space-y-4">
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
          <Wrench className="w-4 h-4" />
          <span>READY TO TEST YOUR SYSTEM GEOMETRY?</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-extrabold font-mono text-white">
          Launch Nexus Custom PC Builder
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
          Apply these architectural principles immediately with automated socket clearance, PCIe bandwidth validation, and real-time wattage budgeting.
        </p>
        <div className="pt-2">
          <a href="/builder">
            <Button variant="gaming" size="sm" className="font-mono text-xs">
              START CUSTOM BUILD
            </Button>
          </a>
        </div>
      </div>

      {/* Back to Guides Link */}
      <div className="pt-4">
        <a
          href="/blogs"
          className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Hardware Guides</span>
        </a>
      </div>
    </article>
  );
}
