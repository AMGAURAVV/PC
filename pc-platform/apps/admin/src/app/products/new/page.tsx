'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, CheckCircle2, Cpu } from 'lucide-react';
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
import { createAdminProduct, createAdminPrice, createAdminInventory } from '../../../lib/api/admin-api';
import { AdminBreadcrumbs } from '../../../components/shell/admin-breadcrumbs';

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [sku, setSku] = React.useState('');
  const [model, setModel] = React.useState('');
  const [category, setCategory] = React.useState('CPU');
  const [description, setDescription] = React.useState('');
  const [price, setPrice] = React.useState(25000);
  const [initialStock, setInitialStock] = React.useState(15);
  const [imageUrl, setImageUrl] = React.useState('');

  // Auto-generate slug and SKU from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      // 1. Create product
      const res = await createAdminProduct({
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
        model: model || 'Standard',
        description,
        category,
        isActive: true,
      });

      const newId = res.data?.id || res.id;

      // 2. Create initial active price record
      if (newId && price > 0) {
        try {
          await createAdminPrice({
            productId: newId,
            amount: Math.round(price * 100),
            isActive: true,
          });
        } catch {
          // ignore price creation fail in mock
        }
      }

      return newId;
    },
    onSuccess: (newId) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      if (newId) {
        router.push(`/products/${newId}`);
      } else {
        router.push('/products');
      }
    },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <AdminBreadcrumbs
        items={[
          { label: 'Hardware Products', href: '/products' },
          { label: 'New Component Ingestion' },
        ]}
      />

      <div className="flex items-center justify-between border-b border-cyber-800/80 pb-5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/products')}
            className="h-8 w-8 p-0 text-cyber-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
                INGEST NEW HARDWARE COMPONENT
              </h1>
              <Badge variant="tech">STEP 1/2</Badge>
            </div>
            <p className="text-xs font-mono text-cyber-400">
              Register part SKU, category taxonomy, initial pricing, and warehouse allocation.
            </p>
          </div>
        </div>

        <Button
          variant="gaming"
          size="sm"
          onClick={() => createMutation.mutate()}
          disabled={!name.trim() || createMutation.isPending}
          className="gap-1.5 font-mono text-xs shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{createMutation.isPending ? 'Ingesting...' : 'INGEST COMPONENT'}</span>
        </Button>
      </div>

      <Card variant="default">
        <CardHeader>
          <CardTitle className="text-sm font-mono text-white">HARDWARE CLASSIFICATION & DETAILS</CardTitle>
          <CardDescription>
            Basic catalog parameters. You will be redirected to the detailed specification editor immediately upon creation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 font-mono">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-cyber-300">Component Display Name *</Label>
              <Input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. AMD Ryzen 7 7800X3D Gaming Processor"
                className="mt-1 h-9 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-cyber-300">Hardware Category *</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full h-9 px-3 bg-cyber-900 border border-cyber-700 rounded-md text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="CPU">CPU Processors</option>
                <option value="GPU">Graphics Cards (GPU)</option>
                <option value="MOTHERBOARD">Motherboards</option>
                <option value="RAM">RAM Memory</option>
                <option value="STORAGE">Storage Drives (SSD/HDD)</option>
                <option value="PSU">Power Supplies (PSU)</option>
                <option value="CASE">PC Cases</option>
                <option value="COOLER">Coolers & AIO</option>
                <option value="FAN">Case Fans</option>
                <option value="MONITOR">Monitors</option>
                <option value="ACCESSORY">Accessories</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-cyber-300">Manufacturer SKU</Label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="100-100000910WOF"
                className="mt-1 h-9 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-cyber-300">Model Identifier</Label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="7800X3D"
                className="mt-1 h-9 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-cyber-300">URL Slug</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="amd-ryzen-7-7800x3d"
                className="mt-1 h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-cyber-800">
            <div>
              <Label className="text-xs text-cyber-300">Initial Price (₹ INR)</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="mt-1 h-9 text-xs text-cyan-400 font-bold"
              />
            </div>
            <div>
              <Label className="text-xs text-cyber-300">Initial Stock Units</Label>
              <Input
                type="number"
                value={initialStock}
                onChange={(e) => setInitialStock(Number(e.target.value))}
                className="mt-1 h-9 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-cyber-300">Primary Product Description</Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key specifications, socket, performance tier..."
              className="mt-1 text-xs"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
