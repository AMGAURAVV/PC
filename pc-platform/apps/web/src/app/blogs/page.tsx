import type { Metadata } from 'next';
import {
  Breadcrumbs,
  Badge,
  Button,
} from '@pc-platform/ui';
import {
  BookOpen,
  Clock,
  ArrowRight,
  Sparkles,
  Calendar,
  User,
} from 'lucide-react';
import { getAllBlogPosts } from '../../lib/blogs';
import {
  constructMetadata,
  JsonLd,
  generateCollectionSchema,
  generateBreadcrumbSchema,
} from '../../lib/seo';

export const metadata: Metadata = constructMetadata({
  title: 'Hardware Guides, Benchmarks & PC Building Tutorials',
  description:
    'Authoritative technical articles on PC assembly, PCIe lane architecture, DDR5 memory timings, thermal dynamics, and power budgeting from PC Platform engineers.',
  canonicalPath: '/blogs',
  keywords: [
    'PC building guide',
    'hardware benchmarks 2026',
    'RTX 50 buying guide',
    'DDR5 vs DDR4 comparison',
    'how to choose PC power supply',
    'thermal optimization tutorials',
  ],
});

export const revalidate = 120;

export default function BlogsPage() {
  const posts = getAllBlogPosts();

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Hardware Guides & Articles', url: '/blogs' },
  ]);

  const collectionSchema = generateCollectionSchema(
    'Hardware Guides & Articles',
    'Deep-dive technical hardware tutorials and architectural benchmarks.',
    '/blogs',
    posts.map((p) => ({ name: p.title, url: `/blogs/${p.slug}` }))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 pb-24">
      <JsonLd data={[breadcrumbSchema, collectionSchema]} />

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Hardware Guides & Blog' },
        ]}
      />

      {/* Hero Banner */}
      <div className="relative rounded-3xl border border-border/80 bg-gradient-to-r from-cyan-950/40 via-cyber-950 to-purple-950/40 p-8 sm:p-12 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyber-900/80 px-3.5 py-1.5 backdrop-blur-md">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-300">
              EDITORIAL INTEL & HARDWARE GUIDES
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-mono leading-tight tracking-tight">
            HARDWARE ARCHITECTURE,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
              BENCHMARKS & GUIDES
            </span>
          </h1>

          <p className="text-sm sm:text-base text-cyber-300 leading-relaxed">
            In-depth guides crafted by our silicon and systems engineers. Demystifying memory subchannel timings, PCIe 5.0 topologies, and thermal curve optimization.
          </p>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {posts.map((post, idx) => (
          <article
            key={post.id}
            className="group rounded-2xl border border-border/80 bg-cyber-950/70 overflow-hidden hover:border-cyan-500/60 transition-all duration-300 flex flex-col shadow-lg hover:shadow-glow-cyan/15"
          >
            {/* Article Image */}
            <a
              href={`/blogs/${post.slug}`}
              className="relative aspect-[16/9] w-full overflow-hidden bg-cyber-900 block"
            >
              <img
                src={post.coverImage}
                alt={post.title}
                loading={idx < 2 ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={idx < 2 ? 'high' : 'auto'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3">
                <Badge variant="gaming" className="text-[10px] font-mono">
                  {post.category}
                </Badge>
              </div>
            </a>

            {/* Content Details */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-cyan-400">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readingTimeMinutes} min read
                  </span>
                </div>

                <a href={`/blogs/${post.slug}`}>
                  <h2 className="text-lg font-bold font-mono text-white group-hover:text-cyan-300 transition-colors leading-snug">
                    {post.title}
                  </h2>
                </a>

                <p className="text-xs text-cyber-300 leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
              </div>

              {/* Tags & Author Footer */}
              <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-cyber-900 border border-border flex items-center justify-center text-cyan-400 font-mono text-xs font-bold">
                    {post.author.name[0]}
                  </div>
                  <span className="text-xs font-mono text-white font-medium">
                    {post.author.name}
                  </span>
                </div>

                <a
                  href={`/blogs/${post.slug}`}
                  className="text-xs font-mono text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1 font-semibold"
                >
                  <span>Read Article</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
