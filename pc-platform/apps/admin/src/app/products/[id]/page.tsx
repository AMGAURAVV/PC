'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Save,
  ArrowLeft,
  Image as ImageIcon,
  DollarSign,
  Boxes,
  Cpu,
  Layers,
  Trash2,
  Plus,
  Star,
  CheckCircle2,
  ExternalLink,
  Upload,
  FileCode,
} from 'lucide-react';
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
  Price,
} from '@pc-platform/ui';
import {
  getAdminProductById,
  updateAdminProduct,
  upsertProductSpec,
  createAdminPrice,
  updateAdminInventory,
  addProductImage,
  removeProductImage,
  setPrimaryProductImage,
  uploadStorageFile,
} from '../../../lib/api/admin-api';
import { AdminBreadcrumbs } from '../../../components/shell/admin-breadcrumbs';
import { SpecEditor } from '../../../components/ui/spec-editor';
import { ConfirmDialog } from '../../../components/ui/confirm-dialog';

interface ProductEditorPageProps {
  params: { id: string };
}

export default function ProductEditorPage({ params }: ProductEditorPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const productId = params.id;

  // Active Tab
  const [activeTab, setActiveTab] = React.useState('basic');

  // Form State
  const [formData, setFormData] = React.useState<any>({
    name: '',
    slug: '',
    sku: '',
    model: '',
    description: '',
    category: 'CPU',
    brandName: '',
    isActive: true,
    isFeatured: false,
  });

  // Price & Inventory state
  const [sellingPrice, setSellingPrice] = React.useState<number>(0);
  const [comparePrice, setComparePrice] = React.useState<number>(0);
  const [inventoryQty, setInventoryQty] = React.useState<number>(10);
  const [reservedQty, setReservedQty] = React.useState<number>(0);
  const [lowStockThreshold, setLowStockThreshold] = React.useState<number>(3);
  const [warehouseLocation, setWarehouseLocation] = React.useState<string>('WH-BLR-01');

  // Specs & Compatibility Metadata
  const [specs, setSpecs] = React.useState<Record<string, any>>({});
  const [compatNotes, setCompatNotes] = React.useState<string>('');
  const [biosReq, setBiosReq] = React.useState<string>('');

  // Image Upload & Metadata Inputs
  const [newImageUrl, setNewImageUrl] = React.useState('');
  const [newImageStorageKey, setNewImageStorageKey] = React.useState('');
  const [newImageAlt, setNewImageAlt] = React.useState('');
  const [newImageSortOrder, setNewImageSortOrder] = React.useState<number>(0);
  const [newImageWidth, setNewImageWidth] = React.useState<number | undefined>(undefined);
  const [newImageHeight, setNewImageHeight] = React.useState<number | undefined>(undefined);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [deleteImageId, setDeleteImageId] = React.useState<string | null>(null);

  // Success Toast state
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  // Fetch product data
  const { data: productResp, isLoading } = useQuery({
    queryKey: ['admin-product', productId],
    queryFn: () => getAdminProductById(productId),
  });

  const product = productResp?.data || productResp;

  // Populate state when product loads
  React.useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        sku: product.sku || '',
        model: product.model || '',
        description: product.description || '',
        category: product.category || 'CPU',
        brandName: product.brand?.name || product.brandName || '',
        isActive: Boolean(product.isActive),
        isFeatured: Boolean(product.isFeatured),
      });

      const pAmount = product.prices?.[0]?.amount
        ? Number(product.prices[0].amount) / 100
        : product.price || 0;
      setSellingPrice(pAmount);

      const inv = product.inventory?.[0] || product.inventory;
      if (inv) {
        setInventoryQty(inv.quantity || 0);
        setReservedQty(inv.reservedQty || 0);
        setLowStockThreshold(inv.lowStockThreshold || 3);
        setWarehouseLocation(inv.locationCode || 'WH-BLR-01');
      }

      // Specs
      const existingSpecs =
        product.cpuSpec ||
        product.gpuSpec ||
        product.motherboardSpec ||
        product.ramSpec ||
        product.storageSpec ||
        product.psuSpec ||
        product.caseSpec ||
        product.coolerSpec ||
        {};
      setSpecs(existingSpecs);
    }
  }, [product]);

  // Master Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // 1. Update basic details
      await updateAdminProduct(productId, {
        name: formData.name,
        slug: formData.slug,
        sku: formData.sku,
        model: formData.model,
        description: formData.description,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
      });

      // 2. Update price if changed
      if (sellingPrice > 0) {
        await createAdminPrice({
          productId,
          amount: Math.round(sellingPrice * 100), // convert to paise
          isActive: true,
        });
      }

      // 3. Update inventory
      const invId = product?.inventory?.[0]?.id || product?.inventory?.id;
      if (invId) {
        await updateAdminInventory(invId, {
          quantity: inventoryQty,
          lowStockThreshold,
        });
      }

      // 4. Update specifications
      if (Object.keys(specs).length > 0) {
        await upsertProductSpec(productId, formData.category, specs);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  // Handle direct file upload to StorageProvider
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const result = await uploadStorageFile(file, `products/${productId}`);
      setNewImageUrl(result.url);
      setNewImageStorageKey(result.storageKey);

      // Attempt to load image to obtain natural dimensions
      const img = new Image();
      img.onload = () => {
        setNewImageWidth(img.naturalWidth);
        setNewImageHeight(img.naturalHeight);
      };
      img.src = result.url;
    } catch (err: any) {
      setUploadError(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Image actions
  const addImageMutation = useMutation({
    mutationFn: () =>
      addProductImage(productId, {
        url: newImageUrl,
        storageKey: newImageStorageKey || undefined,
        altText: newImageAlt || undefined,
        sortOrder: newImageSortOrder,
        width: newImageWidth,
        height: newImageHeight,
        isPrimary: false,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
      setNewImageUrl('');
      setNewImageStorageKey('');
      setNewImageAlt('');
      setNewImageSortOrder(0);
      setNewImageWidth(undefined);
      setNewImageHeight(undefined);
    },
  });

  const removeImageMutation = useMutation({
    mutationFn: (imgId: string) => removeProductImage(productId, imgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
      setDeleteImageId(null);
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: (imgId: string) => setPrimaryProductImage(productId, imgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-product', productId] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-cyber-800 rounded w-1/4 animate-pulse" />
        <div className="h-96 bg-cyber-900 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs
        items={[
          { label: 'Hardware Products', href: '/products' },
          { label: formData.name || 'Component Editor' },
        ]}
      />

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cyber-800/80 pb-5">
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
              <h1 className="text-xl sm:text-2xl font-bold font-mono text-white line-clamp-1">
                {formData.name || 'Edit Hardware Component'}
              </h1>
              <Badge variant="tech" className="text-[10px] font-mono">
                {formData.category}
              </Badge>
            </div>
            <p className="text-xs font-mono text-cyber-400">
              SKU: {formData.sku || 'UNASSIGNED'} • ID: {productId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {saveSuccess && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" /> Changes Saved
            </span>
          )}

          <Button
            variant="gaming"
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="gap-1.5 font-mono text-xs shadow-lg shadow-cyan-500/20"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saveMutation.isPending ? 'Saving...' : 'SAVE ALL CHANGES'}</span>
          </Button>
        </div>
      </div>

      {/* Main 6-Tab Product Editor */}
      <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-cyber-900 border border-cyber-800 p-1 flex flex-wrap gap-1">
          <TabsTrigger value="basic" className="font-mono text-xs gap-1.5 data-[state=active]:bg-cyber-800">
            <Cpu className="w-3.5 h-3.5" />
            <span>Basic Details</span>
          </TabsTrigger>
          <TabsTrigger value="images" className="font-mono text-xs gap-1.5 data-[state=active]:bg-cyber-800">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Images & Media</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="font-mono text-xs gap-1.5 data-[state=active]:bg-cyber-800">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Pricing & MSRP</span>
          </TabsTrigger>
          <TabsTrigger value="inventory" className="font-mono text-xs gap-1.5 data-[state=active]:bg-cyber-800">
            <Boxes className="w-3.5 h-3.5" />
            <span>Inventory & Warehouse</span>
          </TabsTrigger>
          <TabsTrigger value="specs" className="font-mono text-xs gap-1.5 data-[state=active]:bg-cyber-800">
            <Layers className="w-3.5 h-3.5" />
            <span>Technical Specs</span>
          </TabsTrigger>
          <TabsTrigger value="compatibility" className="font-mono text-xs gap-1.5 data-[state=active]:bg-cyber-800">
            <Star className="w-3.5 h-3.5" />
            <span>Compatibility Metadata</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Basic Details */}
        <TabsContent value="basic" className="space-y-6">
          <Card variant="default">
            <CardHeader>
              <CardTitle className="text-sm font-mono text-white">CORE HARDWARE METADATA</CardTitle>
              <CardDescription>
                Define primary product identification, category mapping, and storefront copy.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-cyber-300">Component Display Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Intel Core i9-14900K Desktop Processor"
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-cyber-300">URL Slug</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="intel-core-i9-14900k"
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-cyber-300">Manufacturer SKU</Label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="BX8071514900K"
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-cyber-300">Model Number</Label>
                  <Input
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="14900K"
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-cyber-300">Hardware Category</Label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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

              <div>
                <Label className="text-xs text-cyber-300">Marketing & Technical Description</Label>
                <Textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Comprehensive technical details, architecture overview, and key features..."
                  className="mt-1 text-xs font-mono"
                />
              </div>

              <div className="flex items-center gap-6 pt-2 border-t border-cyber-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded bg-cyber-900 border-cyber-700 text-cyan-500"
                  />
                  <span className="text-xs text-cyber-300">Active on Storefront</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded bg-cyber-900 border-cyber-700 text-cyan-500"
                  />
                  <span className="text-xs text-cyber-300">Featured Component (Homepage Highlights)</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Images & Media */}
        <TabsContent value="images" className="space-y-6">
          <Card variant="default">
            <CardHeader>
              <CardTitle className="text-sm font-mono text-white">COMPONENT MEDIA GALLERY</CardTitle>
              <CardDescription>
                Manage hardware product photography, angles, and designate the primary storefront thumbnail.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 font-mono">
              {/* Add New Image: Direct File Upload OR CDN URL */}
              <div className="bg-[#0c101d] border border-cyber-800 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    Upload Component Media to Storage Provider
                  </span>
                  {newImageStorageKey && (
                    <Badge variant="tech" className="text-[10px] gap-1">
                      <FileCode className="w-3 h-3" />
                      Key: {newImageStorageKey}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File Upload Zone */}
                  <div>
                    <Label className="text-xs text-cyber-300">File Upload (Object Storage)</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-cyber-900 hover:bg-cyber-800/80 border border-cyber-700 border-dashed rounded-md cursor-pointer text-xs text-cyber-300 transition-colors">
                        <Upload className="w-4 h-4 text-cyan-400" />
                        <span>{isUploading ? 'Uploading to Storage...' : 'Select File (PNG, JPG, WEBP)'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {uploadError && (
                      <p className="text-[11px] text-rose-400 mt-1">{uploadError}</p>
                    )}
                  </div>

                  {/* CDN / Public URL fallback */}
                  <div>
                    <Label className="text-xs text-cyber-300">Image Public URL / CDN Reference *</Label>
                    <Input
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="https://... or auto-generated by upload"
                      className="mt-1 h-9 text-xs"
                    />
                  </div>
                </div>

                {/* Metadata Fields: Alt Text, Dimensions, Sort Order */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-cyber-800/60">
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-cyber-300">Alt Text (Accessibility)</Label>
                    <Input
                      value={newImageAlt}
                      onChange={(e) => setNewImageAlt(e.target.value)}
                      placeholder="e.g. Front angled view with RGB lighting"
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-cyber-300">Sort Order</Label>
                    <Input
                      type="number"
                      value={newImageSortOrder}
                      onChange={(e) => setNewImageSortOrder(Number(e.target.value))}
                      placeholder="0"
                      className="mt-1 h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-cyber-300">Dimensions (WxH px)</Label>
                    <div className="mt-1 flex items-center gap-1">
                      <Input
                        type="number"
                        value={newImageWidth || ''}
                        onChange={(e) => setNewImageWidth(Number(e.target.value) || undefined)}
                        placeholder="W"
                        className="h-8 text-xs"
                      />
                      <span className="text-cyber-500 text-xs">×</span>
                      <Input
                        type="number"
                        value={newImageHeight || ''}
                        onChange={(e) => setNewImageHeight(Number(e.target.value) || undefined)}
                        placeholder="H"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="gaming"
                    size="sm"
                    onClick={() => addImageMutation.mutate()}
                    disabled={!newImageUrl.trim() || addImageMutation.isPending || isUploading}
                    className="gap-1 font-mono text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{addImageMutation.isPending ? 'Saving...' : 'Add to Component Gallery'}</span>
                  </Button>
                </div>
              </div>

              {/* Gallery Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(product?.images || []).length === 0 ? (
                  <div className="col-span-full p-8 border border-dashed border-cyber-800 rounded-lg text-center text-cyber-500 text-xs">
                    No images registered for this component. Upload a file or add a URL above.
                  </div>
                ) : (
                  product.images.map((img: any) => (
                    <div
                      key={img.id}
                      className={`relative group rounded-lg overflow-hidden border ${
                        img.isPrimary
                          ? 'border-cyan-500 shadow-md shadow-cyan-500/20'
                          : 'border-cyber-800'
                      } bg-[#060910] flex flex-col justify-between`}
                    >
                      <div className="aspect-square relative flex items-center justify-center p-3 bg-black/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={img.altText || formData.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      {/* Image Details / Metadata */}
                      <div className="p-2.5 bg-cyber-950/90 border-t border-cyber-800 space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-cyber-400 font-bold">#{img.sortOrder ?? 0}</span>
                          {img.isPrimary && (
                            <Badge variant="tech" className="text-[9px] px-1.5 py-0 h-4">
                              PRIMARY
                            </Badge>
                          )}
                          {(img.width && img.height) ? (
                            <span className="text-[10px] text-cyber-400 font-mono">
                              {img.width}×{img.height}
                            </span>
                          ) : null}
                        </div>

                        {img.storageKey && (
                          <div className="text-[10px] text-cyan-400 truncate font-mono" title={img.storageKey}>
                            key: {img.storageKey}
                          </div>
                        )}

                        {img.altText && (
                          <div className="text-[10px] text-cyber-300 truncate font-sans" title={img.altText}>
                            alt: {img.altText}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-cyber-800/80">
                          {!img.isPrimary ? (
                            <button
                              onClick={() => setPrimaryMutation.mutate(img.id)}
                              className="text-cyber-400 hover:text-cyan-400 underline text-[10px]"
                            >
                              Set Primary
                            </button>
                          ) : (
                            <span className="text-[10px] text-cyan-400 font-bold">Thumbnail</span>
                          )}

                          <button
                            onClick={() => setDeleteImageId(img.id)}
                            className="text-cyber-500 hover:text-rose-400 p-1 transition-colors"
                            title="Delete image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Pricing & MSRP */}
        <TabsContent value="pricing" className="space-y-6">
          <Card variant="default">
            <CardHeader>
              <CardTitle className="text-sm font-mono text-white">AUTHORITATIVE PRICING ENGINE</CardTitle>
              <CardDescription>
                Live selling price in INR. Remember: Never trust client pricing; backend validates this exact rate.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-cyber-300">Live Selling Price (₹ INR)</Label>
                  <Input
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    placeholder="35000"
                    className="mt-1 h-9 text-xs text-cyan-400 font-bold"
                  />
                  <p className="text-[10px] text-cyber-500 mt-1">Stored in DB as paise ({sellingPrice * 100}p)</p>
                </div>

                <div>
                  <Label className="text-xs text-cyber-300">MSRP / Compare-at Price (₹ INR)</Label>
                  <Input
                    type="number"
                    value={comparePrice}
                    onChange={(e) => setComparePrice(Number(e.target.value))}
                    placeholder="39999"
                    className="mt-1 h-9 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs text-cyber-300">Currency Lock</Label>
                  <Input
                    value="INR (₹)"
                    disabled
                    className="mt-1 h-9 text-xs bg-cyber-900/50 text-cyber-400"
                  />
                </div>
              </div>

              {/* Price Preview */}
              <div className="p-4 rounded-lg bg-cyber-900/60 border border-cyber-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-cyber-400">Storefront Customer Display Preview:</span>
                  <div className="mt-1 flex items-baseline gap-3">
                    <Price amount={sellingPrice} size="lg" />
                    {comparePrice > sellingPrice && (
                      <span className="text-xs line-through text-cyber-500 font-mono">
                        ₹{comparePrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="tech">AUTHORITATIVE</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Inventory & Warehouse */}
        <TabsContent value="inventory" className="space-y-6">
          <Card variant="default">
            <CardHeader>
              <CardTitle className="text-sm font-mono text-white">WAREHOUSE & STOCK LEVEL CONTROL</CardTitle>
              <CardDescription>
                Atomically synchronized on checkout. Reserves are held during PENDING orders and committed on CONFIRMED.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-cyber-300">On-Hand Total Quantity</Label>
                  <Input
                    type="number"
                    value={inventoryQty}
                    onChange={(e) => setInventoryQty(Number(e.target.value))}
                    className="mt-1 h-9 text-xs font-bold text-white"
                  />
                </div>

                <div>
                  <Label className="text-xs text-cyber-300">Pending Reserved Stock</Label>
                  <Input
                    type="number"
                    value={reservedQty}
                    disabled
                    className="mt-1 h-9 text-xs bg-cyber-900/50 text-amber-400"
                  />
                  <p className="text-[10px] text-cyber-500 mt-1">Locked in active checkouts</p>
                </div>

                <div>
                  <Label className="text-xs text-cyber-300">Low Stock Alert Threshold</Label>
                  <Input
                    type="number"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-cyber-300">Fulfillment Center Location Code</Label>
                <Input
                  value={warehouseLocation}
                  onChange={(e) => setWarehouseLocation(e.target.value)}
                  placeholder="WH-BLR-01 / WH-BOM-02"
                  className="mt-1 h-9 text-xs max-w-sm"
                />
              </div>

              <div className="p-4 rounded-lg bg-cyber-900/60 border border-cyber-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-cyber-400">Available to Purchase:</span>
                  <div className="text-lg font-bold text-emerald-400 font-mono">
                    {Math.max(0, inventoryQty - reservedQty)} units
                  </div>
                </div>
                <Badge variant={inventoryQty - reservedQty > 5 ? 'tech' : 'secondary'}>
                  {inventoryQty - reservedQty > 5 ? 'HEALTHY STOCK' : 'LOW STOCK WARNING'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Technical Specifications */}
        <TabsContent value="specs" className="space-y-6">
          <Card variant="default">
            <CardContent className="pt-6">
              <SpecEditor
                componentType={formData.category}
                specs={specs}
                onChange={setSpecs}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 6: Compatibility Metadata */}
        <TabsContent value="compatibility" className="space-y-6">
          <Card variant="default">
            <CardHeader>
              <CardTitle className="text-sm font-mono text-white">COMPONENT COMPATIBILITY METADATA</CardTitle>
              <CardDescription>
                Specific architectural constraints and clearance tags evaluated during PC builder checks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 font-mono">
              <div>
                <Label className="text-xs text-cyber-300">BIOS / Firmware Constraint Note</Label>
                <Input
                  value={biosReq}
                  onChange={(e) => setBiosReq(e.target.value)}
                  placeholder="e.g. Requires BIOS version 1601+ for 14th Gen Intel support"
                  className="mt-1 h-9 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs text-cyber-300">Clearance & Form Factor Advisory</Label>
                <Textarea
                  rows={3}
                  value={compatNotes}
                  onChange={(e) => setCompatNotes(e.target.value)}
                  placeholder="e.g. High-profile heat spreaders (44mm). Check top AIO radiator clearance."
                  className="mt-1 text-xs"
                />
              </div>

              <div className="p-4 rounded-lg bg-cyber-900/60 border border-cyber-800 text-xs text-cyber-400">
                <strong className="text-cyan-400">Important:</strong> Global rules governing sockets, TDP, memory limits, and clearances are managed in the{' '}
                <button
                  onClick={() => router.push('/compatibility')}
                  className="text-white underline hover:text-cyan-300"
                >
                  Dedicated Compatibility Rule Editor
                </button>
                .
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Image Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteImageId)}
        onClose={() => setDeleteImageId(null)}
        onConfirm={() => {
          if (deleteImageId) removeImageMutation.mutate(deleteImageId);
        }}
        title="Delete Component Image?"
        description="Are you sure you want to remove this image from the product gallery?"
        confirmText="Delete Image"
        isDestructive={true}
      />
    </div>
  );
}
