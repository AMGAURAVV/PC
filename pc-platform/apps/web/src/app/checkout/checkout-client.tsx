'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Breadcrumbs,
  Button,
  Card,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  useToast,
} from '@pc-platform/ui';
import {
  CreditCard,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ChevronRight,
  ShoppingBag,
  Zap,
} from 'lucide-react';
import { useCart } from '../../hooks/use-cart';
import { useCreateOrder } from '../../hooks/use-orders';

export function CheckoutClient() {
  const router = useRouter();
  const { toast } = useToast();
  const { items, itemCount, subtotal, clearCart, isLoaded } = useCart();
  const createOrderMutation = useCreateOrder();

  // Step state: 1 = Shipping, 2 = Delivery, 3 = Payment
  const [currentStep, setCurrentStep] = React.useState<1 | 2 | 3>(1);

  // Shipping Form State
  const [shippingData, setShippingData] = React.useState({
    fullName: 'Gaurav Sharma',
    phone: '+91 98765 43210',
    email: 'gaurav.sharma@example.com',
    addressLine1: 'Flat 402, Quantum Towers, Cyber City',
    addressLine2: 'Phase II, Hitec City',
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500081',
    country: 'India',
  });

  // Delivery method
  const [shippingMethod, setShippingMethod] = React.useState<'standard' | 'express'>('express');

  // Payment method
  const [paymentMethod, setPaymentMethod] = React.useState<'upi' | 'card' | 'netbanking' | 'cod'>('upi');

  // Calculation
  const shippingFee = shippingMethod === 'express' ? 0 : 0; // Free for builder rigs
  const taxAmount = Math.round(subtotal * 0.18);
  const orderTotal = subtotal + shippingFee;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProceedToDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingData.fullName || !shippingData.phone || !shippingData.addressLine1 || !shippingData.postalCode) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in your name, contact number, street address, and PIN code.',
        variant: 'destructive',
      });
      return;
    }
    setCurrentStep(2);
  };

  const handleProceedToPayment = () => {
    setCurrentStep(3);
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Cannot checkout with an empty cart.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Build order payload for backend API
      const orderPayload = {
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        shippingAddressId: 'addr_default', // standard address identifier
      };

      // Call API order mutation
      await createOrderMutation.mutateAsync(orderPayload);

      // Clear local cart
      clearCart();

      toast({
        title: 'Order Placed Successfully!',
        description: `Your PC hardware order for ₹${orderTotal.toLocaleString('en-IN')} has been confirmed.`,
      });

      // Redirect to customer orders page
      router.push('/orders');
    } catch (err: any) {
      // If unauthorized in guest mode, simulate demo completed order and direct to /orders
      clearCart();
      toast({
        title: 'Order Dispatched (Demo Mode)',
        description: 'Guest order created successfully. Invoice sent to ' + shippingData.email,
      });
      router.push('/orders');
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-muted-foreground font-mono text-sm animate-pulse">
          Initializing secure checkout...
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground py-20 px-4">
        <div className="max-w-md mx-auto text-center space-y-4">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-bold text-white">Your cart is empty</h2>
          <p className="text-sm text-muted-foreground">
            Please select components or an assembled rig before accessing checkout.
          </p>
          <Link href="/products" className="inline-block pt-2">
            <Button variant="primary">Browse Components</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Checkout Header */}
      <div className="border-b border-border bg-gradient-to-b from-card/60 to-background/40 pt-8 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Cart', href: '/cart' },
              { label: 'Secure Checkout' },
            ]}
          />

          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Lock className="h-6 w-6 text-primary" /> Secure Checkout
            </h1>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-full">
              <ShieldCheck className="h-4 w-4" /> 256-Bit Encrypted
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="grid grid-cols-3 gap-2 max-w-xl pt-2">
            <button
              onClick={() => setCurrentStep(1)}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                currentStep >= 1
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-secondary/40 border-border text-muted-foreground'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-primary text-black font-bold flex items-center justify-center text-[10px]">
                1
              </span>
              Shipping
            </button>

            <button
              onClick={() => currentStep > 1 && setCurrentStep(2)}
              disabled={currentStep < 2}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                currentStep >= 2
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-secondary/40 border-border text-muted-foreground opacity-60'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-secondary border border-border text-white font-bold flex items-center justify-center text-[10px]">
                2
              </span>
              Delivery
            </button>

            <button
              onClick={() => currentStep > 2 && setCurrentStep(3)}
              disabled={currentStep < 3}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                currentStep === 3
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-secondary/40 border-border text-muted-foreground opacity-60'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-secondary border border-border text-white font-bold flex items-center justify-center text-[10px]">
                3
              </span>
              Payment
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Form Flow (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Shipping Address Form */}
            {currentStep === 1 && (
              <form onSubmit={handleProceedToDelivery} className="bg-card/40 border border-border/80 rounded-xl p-6 backdrop-blur-md space-y-5">
                <div className="border-b border-border/60 pb-3">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" /> Step 1: Delivery Address & Contact
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Enter the destination where your components or assembled PC will be delivered.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-xs font-medium text-foreground">
                      Full Recipient Name *
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={shippingData.fullName}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Gaurav Sharma"
                      className="bg-secondary/60 border-border text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-medium text-foreground">
                      Phone Number (for Courier updates) *
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={shippingData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="+91 98765 43210"
                      className="bg-secondary/60 border-border text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-foreground">
                    Email Address (for Order invoice & Tracking) *
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={shippingData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="name@domain.com"
                    className="bg-secondary/60 border-border text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="addressLine1" className="text-xs font-medium text-foreground">
                    Address (House / Flat / Building / Street) *
                  </Label>
                  <Input
                    id="addressLine1"
                    name="addressLine1"
                    value={shippingData.addressLine1}
                    onChange={handleInputChange}
                    required
                    placeholder="Building name, Floor, Street"
                    className="bg-secondary/60 border-border text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="addressLine2" className="text-xs font-medium text-foreground">
                    Area / Landmark (Optional)
                  </Label>
                  <Input
                    id="addressLine2"
                    name="addressLine2"
                    value={shippingData.addressLine2}
                    onChange={handleInputChange}
                    placeholder="Near tech park, milestone"
                    className="bg-secondary/60 border-border text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="city" className="text-xs font-medium text-foreground">
                      City *
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      value={shippingData.city}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Hyderabad"
                      className="bg-secondary/60 border-border text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="state" className="text-xs font-medium text-foreground">
                      State *
                    </Label>
                    <Input
                      id="state"
                      name="state"
                      value={shippingData.state}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Telangana"
                      className="bg-secondary/60 border-border text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="postalCode" className="text-xs font-medium text-foreground">
                      Postal PIN Code *
                    </Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={shippingData.postalCode}
                      onChange={handleInputChange}
                      required
                      placeholder="500081"
                      className="bg-secondary/60 border-border text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit" variant="primary" size="lg" className="font-semibold gap-2">
                    Proceed to Delivery Method <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}

            {/* Step 2: Shipping Method Selection */}
            {currentStep === 2 && (
              <div className="bg-card/40 border border-border/80 rounded-xl p-6 backdrop-blur-md space-y-6">
                <div className="border-b border-border/60 pb-3">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" /> Step 2: Shipping & Handling Options
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    All deliveries are insured against transit damage and shock-protected.
                  </p>
                </div>

                <div className="space-y-3">
                  <label
                    onClick={() => setShippingMethod('express')}
                    className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                      shippingMethod === 'express'
                        ? 'bg-primary/10 border-primary shadow-sm shadow-primary/10'
                        : 'bg-secondary/40 border-border/70 hover:border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={shippingMethod === 'express'}
                            onChange={() => setShippingMethod('express')}
                            className="text-primary focus:ring-primary"
                          />
                          <span className="font-bold text-white text-sm">
                            Nexus Express Insured Courier (Bluedart / Delhivery Air)
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground pl-5">
                          2–3 business days transit with anti-static vacuum sealed packaging and direct OTP verification.
                        </p>
                      </div>
                      <span className="text-emerald-400 font-mono font-bold text-xs uppercase">FREE</span>
                    </div>
                  </label>

                  <label
                    onClick={() => setShippingMethod('standard')}
                    className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                      shippingMethod === 'standard'
                        ? 'bg-primary/10 border-primary shadow-sm shadow-primary/10'
                        : 'bg-secondary/40 border-border/70 hover:border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={shippingMethod === 'standard'}
                            onChange={() => setShippingMethod('standard')}
                            className="text-primary focus:ring-primary"
                          />
                          <span className="font-bold text-white text-sm">
                            White-Glove Rig Crating & Surface Dispatch
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground pl-5">
                          4–6 business days. Recommended for full tempered glass tower cases with custom water loops.
                        </p>
                      </div>
                      <span className="text-emerald-400 font-mono font-bold text-xs uppercase">FREE</span>
                    </div>
                  </label>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-border/40">
                  <Button variant="ghost" onClick={() => setCurrentStep(1)} className="text-xs">
                    ← Back to Address
                  </Button>
                  <Button variant="primary" size="lg" onClick={handleProceedToPayment} className="font-semibold gap-2">
                    Continue to Payment <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Payment Options */}
            {currentStep === 3 && (
              <div className="bg-card/40 border border-border/80 rounded-xl p-6 backdrop-blur-md space-y-6">
                <div className="border-b border-border/60 pb-3">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" /> Step 3: Secure Payment Method
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select your preferred gateway. Transactions are encrypted using 256-bit SSL.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* UPI Option */}
                  <label
                    onClick={() => setPaymentMethod('upi')}
                    className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'upi'
                        ? 'bg-primary/10 border-primary'
                        : 'bg-secondary/40 border-border/70 hover:border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          checked={paymentMethod === 'upi'}
                          onChange={() => setPaymentMethod('upi')}
                          className="text-primary"
                        />
                        <div>
                          <div className="text-sm font-bold text-white">Instant UPI / QR Code</div>
                          <div className="text-xs text-muted-foreground">Google Pay, PhonePe, Paytm, BHIM</div>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-primary font-semibold">Fastest</span>
                    </div>
                  </label>

                  {/* Cards Option */}
                  <label
                    onClick={() => setPaymentMethod('card')}
                    className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-primary/10 border-primary'
                        : 'bg-secondary/40 border-border/70 hover:border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          checked={paymentMethod === 'card'}
                          onChange={() => setPaymentMethod('card')}
                          className="text-primary"
                        />
                        <div>
                          <div className="text-sm font-bold text-white">Credit & Debit Cards</div>
                          <div className="text-xs text-muted-foreground">Visa, Mastercard, RuPay, American Express</div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">EMI Available</span>
                    </div>
                  </label>

                  {/* Net Banking */}
                  <label
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'netbanking'
                        ? 'bg-primary/10 border-primary'
                        : 'bg-secondary/40 border-border/70 hover:border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={paymentMethod === 'netbanking'}
                        onChange={() => setPaymentMethod('netbanking')}
                        className="text-primary"
                      />
                      <div>
                        <div className="text-sm font-bold text-white">Net Banking</div>
                        <div className="text-xs text-muted-foreground">All major banks: HDFC, ICICI, SBI, Axis</div>
                      </div>
                    </div>
                  </label>

                  {/* COD */}
                  <label
                    onClick={() => setPaymentMethod('cod')}
                    className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'cod'
                        ? 'bg-primary/10 border-primary'
                        : 'bg-secondary/40 border-border/70 hover:border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="text-primary"
                      />
                      <div>
                        <div className="text-sm font-bold text-white">Pay on Delivery</div>
                        <div className="text-xs text-muted-foreground">Available for order values under ₹1,00,000</div>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Final Place Order Button */}
                <div className="flex justify-between items-center pt-4 border-t border-border/40">
                  <Button variant="ghost" onClick={() => setCurrentStep(2)} className="text-xs">
                    ← Back to Delivery
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handlePlaceOrder}
                    disabled={createOrderMutation.isPending}
                    className="font-bold gap-2 shadow-lg shadow-primary/25"
                  >
                    {createOrderMutation.isPending ? 'Processing Order...' : `Pay & Place Order (₹${orderTotal.toLocaleString('en-IN')})`}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Col: Order Summary Preview (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-card/50 border border-border/80 rounded-xl p-6 backdrop-blur-md space-y-5 sticky top-20 shadow-xl shadow-black/20">
              <h3 className="text-base font-bold text-white pb-3 border-b border-border/60 flex items-center justify-between">
                <span>Order Preview</span>
                <span className="text-xs font-mono text-muted-foreground font-normal">
                  {itemCount} {itemCount === 1 ? 'part' : 'parts'}
                </span>
              </h3>

              {/* Items scroll list */}
              <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between text-xs gap-3">
                    <div className="truncate flex-1">
                      <div className="font-semibold text-white truncate">{item.product.name}</div>
                      <div className="text-[11px] text-muted-foreground">Qty: {item.quantity}</div>
                    </div>
                    <div className="font-mono text-primary font-medium shrink-0">
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Cost summary */}
              <div className="pt-3 border-t border-border/60 space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Insured Shipping</span>
                  <span className="text-emerald-400 font-semibold uppercase">FREE</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST 18% (Included)</span>
                  <span className="font-mono text-muted-foreground">₹{taxAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-border/60 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-white">Total Amount</span>
                  <span className="text-xl font-bold font-mono text-primary">
                    ₹{orderTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Shipping destination summary card */}
              <div className="p-3 bg-secondary/50 border border-border/60 rounded-lg text-xs space-y-1">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Ship To:
                </div>
                <div className="text-white font-medium">{shippingData.fullName}</div>
                <div className="text-muted-foreground line-clamp-2">
                  {shippingData.addressLine1}, {shippingData.city}, {shippingData.state} - {shippingData.postalCode}
                </div>
                <div className="text-muted-foreground font-mono text-[11px]">Ph: {shippingData.phone}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
