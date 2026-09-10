export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    role: string;
    avatarUrl?: string;
  };
  coverImage: string;
  category: string;
  tags: string[];
  readingTimeMinutes: number;
  publishedAt: string;
  updatedAt: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'post-1',
    slug: 'ultimate-pc-building-guide-2026',
    title: 'The Ultimate PC Building Guide (2026 Edition): Socket Fits, PCIe Lanes & Cable Routing',
    excerpt:
      'Step-by-step masterclass on assembling modern gaming and AI workstation rigs. Avoid costly socket pin damage, optimize PCIe 5.0 lanes, and master negative vs positive pressure cooling.',
    coverImage: 'https://storage.googleapis.com/pc-platform-assets/blogs/pc-building-guide-2026.jpg',
    category: 'Hardware Tutorials',
    tags: ['PC Building', 'Hardware Guide', 'Cable Management', 'Thermal Optimization'],
    readingTimeMinutes: 12,
    publishedAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-02-10T14:30:00.000Z',
    author: {
      name: 'Vikram Mehta',
      role: 'Chief Systems Architect',
      avatarUrl: 'https://storage.googleapis.com/pc-platform-assets/avatars/vikram.jpg',
    },
    content: `
Building a custom PC in 2026 is both exhilarating and demanding. With PCIe Gen 5.0 SSDs generating up to 14W under sustained writes, 600W 12V-2x6 GPU power cables requiring precise bending radii, and DDR5 timings reaching 7200+ MT/s, precision planning is paramount.

### Phase 1: Motherboard Pre-Bench Preparation
Before mounting your motherboard inside the chassis, always perform the base assembly on top of the motherboard box (never on anti-static bags, which can be conductive on their exterior surface).

1. **CPU Installation**: For LGA1700/LGA1851 and AM5 sockets, inspect the pins with high-intensity light. Align the golden triangle marking and let gravity seat the package before locking the retention arm.
2. **Dual-Channel RAM Configuration**: For motherboards with four DIMM slots, populate slots **A2 and B2** (slots 2 and 4 away from the CPU) to ensure signal trace termination works as designed.
3. **Primary NVMe SSD**: Install your OS drive in the primary M.2 slot wired directly to the CPU lanes rather than the motherboard chipset bus to prevent latency penalties.

### Phase 2: Power Budgeting & PSU Headroom
Modern GPUs like the RTX 4090 and RTX 50-series exhibit microsecond power excursions (transient spikes) that can trip Over-Current Protection (OCP) on older power supplies.

- Always choose an **ATX 3.0 / PCIe 5.0** rated power supply with native 12V-2x6 connectors.
- Maintain at least **25% wattage headroom** over your calculated system TDP to ensure maximum power efficiency within the 50-70% PSU load curve.

### Phase 3: Airflow Geometry & Thermal Acoustics
Positive air pressure (more intake CFM than exhaust CFM) prevents unfiltered dust infiltration through chassis seams and PCIe slot covers.
- Mount 360mm AIO liquid coolers either as top exhaust or front intake with tubes oriented downward.
- Configure case fan PWM curves in UEFI BIOS to ramp against CPU Package (Tctl/Tdie) temperatures with an 8-second smoothing hysteresis to eliminate annoying fan revving.
    `,
  },
  {
    id: 'post-2',
    slug: 'rtx-50-series-gpu-buying-guide',
    title: 'Next-Gen GPU Architecture & Power Requirements: What Every Builder Needs to Know',
    excerpt:
      'Everything you need to evaluate before upgrading to next-gen graphics cards: PCIe 5.0 bandwidth saturation, chassis clearance dimensions, and 12V-2x6 safety standards.',
    coverImage: 'https://storage.googleapis.com/pc-platform-assets/blogs/rtx-50-series-guide.jpg',
    category: 'Graphics Cards',
    tags: ['GPU', 'NVIDIA', 'RTX', 'Gaming Benchmarks', 'Power Supplies'],
    readingTimeMinutes: 9,
    publishedAt: '2026-02-01T10:30:00.000Z',
    updatedAt: '2026-02-20T16:00:00.000Z',
    author: {
      name: 'Ananya Sharma',
      role: 'Lead Hardware Reviewer',
      avatarUrl: 'https://storage.googleapis.com/pc-platform-assets/avatars/ananya.jpg',
    },
    content: `
Graphics cards represent up to 50% of the entire budget for modern gaming and rendering workstations. As display resolutions push past 4K at 240Hz and neural shaders demand immense memory bandwidth, choosing the right GPU requires careful architectural assessment.

### Key Factors When Selecting Your Next GPU:
1. **VRAM Capacity & Bus Width**: For high-fidelity 1440p and 4K gaming, 16GB of GDDR6X/GDDR7 is the minimum baseline. Local LLM fine-tuning and AI image generation workflows benefit exponentially from 24GB+ pools.
2. **Chassis Clearance**: High-end coolers frequently exceed 340mm in length and require 3.5 slots of vertical height. Verify maximum GPU length inside your chassis before ordering.
3. **Anti-Sag Brackets**: Heavy triple-fan heatsinks exert substantial mechanical stress on the PCIe x16 slot. Always utilize the bundled reinforcement bracket or vertical support pillar.
    `,
  },
  {
    id: 'post-3',
    slug: 'ddr5-vs-ddr4-ram-comparison',
    title: 'DDR5 vs DDR4 Memory Architecture: Sweet Spots, Latency & Gaming Performance',
    excerpt:
      'An architectural dive into DDR5 on-die ECC, dual 32-bit subchannels, and the real-world frame time differences in modern AAA titles and rendering engines.',
    coverImage: 'https://storage.googleapis.com/pc-platform-assets/blogs/ddr5-memory-analysis.jpg',
    category: 'Memory & Storage',
    tags: ['RAM', 'DDR5', 'Memory Timings', 'Overclocking', 'AMD EXPO', 'Intel XMP'],
    readingTimeMinutes: 8,
    publishedAt: '2026-02-18T12:00:00.000Z',
    updatedAt: '2026-03-01T11:15:00.000Z',
    author: {
      name: 'Rohan Deshmukh',
      role: 'Overclocking & Silicon Analyst',
      avatarUrl: 'https://storage.googleapis.com/pc-platform-assets/avatars/rohan.jpg',
    },
    content: `
DDR5 is now the undisputed standard for both AMD AM5 and Intel platforms. While DDR4 served the industry faithfully for nearly a decade, architectural enhancements in DDR5 unlock critical throughput for multi-core CPUs.

### Architectural Advantages of DDR5
- **Dual 32-Bit Subchannels**: Each DDR5 DIMM acts as two independent channels, dramatically increasing bus access efficiency.
- **On-Die ECC**: Real-time single-bit error recovery directly on the DRAM package prevents memory instability at extreme transfer rates.
- **Sweet Spot Frequency**: For AMD Ryzen 7000/9000, DDR5-6000 CL30 maintains optimal 1:1 memory controller (UCLK:MCLK) synchronicity.
    `,
  },
  {
    id: 'post-4',
    slug: 'choosing-the-right-power-supply-unit',
    title: 'How to Choose the Right Power Supply (PSU): 80 Plus Ratings, Cybenetics & Transient Spikes',
    excerpt:
      'Do not skimp on your system heart. Understand 80 Plus vs Cybenetics titanium certifications, single vs multi-rail configurations, and Japanese 105°C capacitors.',
    coverImage: 'https://storage.googleapis.com/pc-platform-assets/blogs/psu-buying-guide.jpg',
    category: 'Power & Cooling',
    tags: ['Power Supplies', 'ATX 3.0', 'Cybenetics', '80 Plus Gold', 'PC Safety'],
    readingTimeMinutes: 7,
    publishedAt: '2026-03-05T08:30:00.000Z',
    updatedAt: '2026-03-05T08:30:00.000Z',
    author: {
      name: 'Vikram Mehta',
      role: 'Chief Systems Architect',
      avatarUrl: 'https://storage.googleapis.com/pc-platform-assets/avatars/vikram.jpg',
    },
    content: `
The power supply unit is the foundation of hardware longevity. A catastrophic PSU failure can destroy the motherboard, CPU, and graphics card simultaneously.

### Why ATX 3.0 Certification Matters
The ATX 3.0 standard mandates that power supplies must endure **200% transient power spikes** for up to 100 microseconds without shutting down. If you are operating an RTX 4080/4090 or RX 7900 XTX, an ATX 3.0 unit with a dedicated 16-pin 12V-2x6 cable guarantees clean, ripple-free power delivery.
    `,
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getAllBlogPosts(): BlogPost[] {
  return BLOG_POSTS;
}
