-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('HOME', 'WORK', 'OTHER');

-- CreateEnum
CREATE TYPE "ComponentType" AS ENUM ('CPU', 'GPU', 'MOTHERBOARD', 'RAM', 'STORAGE', 'PSU', 'CASE', 'COOLER', 'FAN', 'MONITOR', 'KEYBOARD', 'MOUSE', 'HEADSET', 'WEBCAM', 'SPEAKER', 'MICROPHONE', 'UPS', 'OS', 'OTHER');

-- CreateEnum
CREATE TYPE "SpecDataType" AS ENUM ('STRING', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'JSON_ARRAY');

-- CreateEnum
CREATE TYPE "BuildStatus" AS ENUM ('DRAFT', 'COMPLETE', 'ORDERED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CompatibilityRuleType" AS ENUM ('SOCKET_MATCH', 'VALUE_RANGE', 'PHYSICAL_FIT', 'ENUM_MEMBERSHIP', 'MUTUAL_EXCLUSION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CompatibilitySeverity" AS ENUM ('ERROR', 'WARNING', 'INFO');

-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('RETAIL', 'SALE', 'WHOLESALE', 'COST');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'PARTIALLY_SHIPPED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('RAZORPAY', 'STRIPE', 'PAYPAL', 'COD', 'WALLET');

-- CreateEnum
CREATE TYPE "ShippingStatus" AS ENUM ('PENDING', 'LABEL_CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'ATTEMPTED_DELIVERY', 'EXCEPTION', 'RETURNED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'HIDDEN', 'REMOVED');

-- CreateEnum
CREATE TYPE "CommunityReportReason" AS ENUM ('INAPPROPRIATE_CONTENT', 'MISLEADING_SPECS', 'SPAM', 'OFFENSIVE_IMAGE', 'COPYRIGHT_VIOLATION', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'SUSPEND', 'ACTIVATE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "avatar_url" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_addresses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "AddressType" NOT NULL DEFAULT 'HOME',
    "label" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'IN',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "website_url" TEXT,
    "country_code" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "parent_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "short_description" TEXT,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "brand_id" TEXT NOT NULL,
    "component_type" "ComponentType" NOT NULL,
    "model" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_draft" BOOLEAN NOT NULL DEFAULT false,
    "weight" DECIMAL(8,3),
    "meta_title" TEXT,
    "meta_description" TEXT,
    "tags" TEXT[],
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "url" TEXT NOT NULL,
    "storage_key" TEXT,
    "alt_text" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "width" INTEGER,
    "height" INTEGER,
    "size_bytes" INTEGER,
    "mime_type" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_specifications" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "data_type" "SpecDataType" NOT NULL DEFAULT 'STRING',
    "unit" TEXT,
    "group_key" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_public" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "product_specifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component_type_defs" (
    "id" TEXT NOT NULL,
    "type" "ComponentType" NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "icon_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "component_type_defs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "component_spec_definitions" (
    "id" TEXT NOT NULL,
    "component_type_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "data_type" "SpecDataType" NOT NULL DEFAULT 'STRING',
    "unit" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_filterable" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,

    CONSTRAINT "component_spec_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cpu_specs" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "socket_type" TEXT NOT NULL,
    "architecture" TEXT,
    "process_tech" TEXT,
    "cores" INTEGER NOT NULL,
    "threads" INTEGER NOT NULL,
    "base_clock_mhz" INTEGER NOT NULL,
    "boost_clock_mhz" INTEGER,
    "l2_cache_mb" DECIMAL(6,2),
    "l3_cache_mb" DECIMAL(6,2),
    "tdp_w" INTEGER NOT NULL,
    "max_tdp_w" INTEGER,
    "memory_type" TEXT NOT NULL,
    "max_memory_gb" INTEGER NOT NULL,
    "max_memory_speed_mhz" INTEGER,
    "memory_channels" INTEGER NOT NULL DEFAULT 2,
    "pcie_gen" INTEGER,
    "pcie_lanes" INTEGER,
    "has_igpu" BOOLEAN NOT NULL DEFAULT false,
    "igpu_model" TEXT,
    "cooler_included" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "cpu_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gpu_specs" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "chipset" TEXT NOT NULL,
    "gpu_architecture" TEXT,
    "process_tech" TEXT,
    "vram_gb" INTEGER NOT NULL,
    "vram_type" TEXT NOT NULL,
    "vram_bus_bit" INTEGER NOT NULL,
    "base_clock_mhz" INTEGER,
    "boost_clock_mhz" INTEGER,
    "tdp_w" INTEGER NOT NULL,
    "recommended_psu_w" INTEGER,
    "power_connectors" TEXT NOT NULL,
    "pcie_slot" TEXT NOT NULL DEFAULT 'x16',
    "pcie_gen" INTEGER NOT NULL DEFAULT 4,
    "slot_width" INTEGER NOT NULL DEFAULT 2,
    "length_mm" INTEGER NOT NULL,
    "width_mm" INTEGER,
    "height_mm" INTEGER,
    "displayports" INTEGER NOT NULL DEFAULT 3,
    "hdmi_ports" INTEGER NOT NULL DEFAULT 1,
    "hdmi_version" TEXT,
    "dp_version" TEXT,
    "has_raytracing" BOOLEAN NOT NULL DEFAULT false,
    "has_dlss" BOOLEAN NOT NULL DEFAULT false,
    "has_fsr" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "gpu_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "motherboard_specs" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "socket_type" TEXT NOT NULL,
    "chipset" TEXT NOT NULL,
    "form_factor" TEXT NOT NULL,
    "supported_mem_types" TEXT[],
    "ram_slots" INTEGER NOT NULL,
    "max_ram_gb" INTEGER NOT NULL,
    "max_ram_speed_mhz" INTEGER,
    "pcie_x16_slots" INTEGER NOT NULL DEFAULT 1,
    "pcie_x1_slots" INTEGER NOT NULL DEFAULT 0,
    "m2_slots" INTEGER NOT NULL DEFAULT 1,
    "m2_details" JSONB NOT NULL DEFAULT '[]',
    "sata_slots" INTEGER NOT NULL DEFAULT 4,
    "usb_rear_ports" JSONB NOT NULL DEFAULT '[]',
    "usb_header_slots" JSONB NOT NULL DEFAULT '[]',
    "has_wifi" BOOLEAN NOT NULL DEFAULT false,
    "wifi_standard" TEXT,
    "has_bluetooth" BOOLEAN NOT NULL DEFAULT false,
    "bluetooth_version" TEXT,
    "has_rgb_headers" BOOLEAN NOT NULL DEFAULT false,
    "has_argb_headers" BOOLEAN NOT NULL DEFAULT false,
    "lan_chipset" TEXT,
    "lan_speed_gbps" DECIMAL(4,1),
    "audio_chipset" TEXT,
    "bios_flashback" BOOLEAN NOT NULL DEFAULT false,
    "thunderbolt_support" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "motherboard_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ram_specs" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "mem_type" TEXT NOT NULL,
    "total_capacity_gb" INTEGER NOT NULL,
    "stick_count" INTEGER NOT NULL DEFAULT 2,
    "capacity_per_stick_gb" INTEGER NOT NULL,
    "speed_mhz" INTEGER NOT NULL,
    "cas_latency" INTEGER,
    "timing" TEXT,
    "voltage_v" DECIMAL(4,3),
    "form_factor" TEXT NOT NULL DEFAULT 'DIMM',
    "is_ecc" BOOLEAN NOT NULL DEFAULT false,
    "is_registered" BOOLEAN NOT NULL DEFAULT false,
    "has_heatspreader" BOOLEAN NOT NULL DEFAULT false,
    "has_rgb" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ram_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_specs" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "storage_type" TEXT NOT NULL,
    "capacity_gb" INTEGER NOT NULL,
    "interface" TEXT NOT NULL,
    "form_factor" TEXT NOT NULL,
    "nand_type" TEXT,
    "controller" TEXT,
    "seq_read_mbps" INTEGER,
    "seq_write_mbps" INTEGER,
    "rand_read_4k_iops" INTEGER,
    "rand_write_4k_iops" INTEGER,
    "tbw" INTEGER,
    "mtbf_hours" INTEGER,
    "rpm_speed" INTEGER,
    "cache_gb" DECIMAL(5,2),
    "encryption_support" BOOLEAN NOT NULL DEFAULT false,
    "dram_cache" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "storage_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "psu_specs" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "wattage" INTEGER NOT NULL,
    "efficiency_rating" TEXT NOT NULL,
    "modular" TEXT NOT NULL,
    "form_factor" TEXT NOT NULL DEFAULT 'ATX',
    "atx12v_version" TEXT,
    "has_atx3_connector" BOOLEAN NOT NULL DEFAULT false,
    "eps12v_connectors" INTEGER NOT NULL DEFAULT 1,
    "pcie_connectors" JSONB NOT NULL DEFAULT '[]',
    "sata_connectors" INTEGER NOT NULL DEFAULT 6,
    "molex_connectors" INTEGER NOT NULL DEFAULT 2,
    "fan_size_mm" INTEGER NOT NULL DEFAULT 120,
    "is_zero_fan" BOOLEAN NOT NULL DEFAULT false,
    "warranty_years" INTEGER,
    "protections" TEXT[],

    CONSTRAINT "psu_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_specs" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "case_type" TEXT NOT NULL,
    "supported_form_factors" TEXT[],
    "max_mb_form_factor" TEXT NOT NULL,
    "max_gpu_length_mm" INTEGER NOT NULL,
    "max_gpu_width_mm" INTEGER,
    "max_cpu_cooler_height_mm" INTEGER NOT NULL,
    "max_psu_length_mm" INTEGER,
    "drive_35_bays" INTEGER NOT NULL DEFAULT 0,
    "drive_25_bays" INTEGER NOT NULL DEFAULT 0,
    "pci_slots" INTEGER NOT NULL DEFAULT 7,
    "front_panel_usb" JSONB NOT NULL DEFAULT '[]',
    "has_front_usbc" BOOLEAN NOT NULL DEFAULT false,
    "radiator_support" JSONB NOT NULL DEFAULT '[]',
    "included_fans" INTEGER NOT NULL DEFAULT 0,
    "max_fans" INTEGER,
    "has_glass_panel" BOOLEAN NOT NULL DEFAULT false,
    "has_rgb" BOOLEAN NOT NULL DEFAULT false,
    "dust_filters" BOOLEAN NOT NULL DEFAULT false,
    "width_mm" INTEGER,
    "height_mm" INTEGER,
    "depth_mm" INTEGER,

    CONSTRAINT "case_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cooler_specs" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "cooler_type" TEXT NOT NULL,
    "supported_sockets" TEXT[],
    "tdp_rating_w" INTEGER NOT NULL,
    "height_mm" INTEGER,
    "radiator_size_mm" INTEGER,
    "fan_count" INTEGER NOT NULL DEFAULT 1,
    "fan_size_mm" INTEGER NOT NULL DEFAULT 120,
    "max_fan_rpm" INTEGER,
    "noise_db_a" DECIMAL(5,2),
    "has_argb" BOOLEAN NOT NULL DEFAULT false,
    "ram_clearance_mm" INTEGER,
    "includes_thermal_paste" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cooler_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fan_specs" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "size_mm" INTEGER NOT NULL,
    "min_rpm" INTEGER,
    "max_rpm" INTEGER NOT NULL,
    "max_airflow_cfm" DECIMAL(6,2),
    "max_static_pressure_mm_h2o" DECIMAL(5,2),
    "max_noise_db_a" DECIMAL(5,2),
    "bearing_type" TEXT,
    "connector" TEXT NOT NULL DEFAULT '4-pin PWM',
    "is_pwm" BOOLEAN NOT NULL DEFAULT true,
    "has_argb" BOOLEAN NOT NULL DEFAULT false,
    "has_rgb" BOOLEAN NOT NULL DEFAULT false,
    "led_color" TEXT,
    "pack_count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "fan_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitor_specs" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "screen_size_inch" DECIMAL(4,1) NOT NULL,
    "resolution_w" INTEGER NOT NULL,
    "resolution_h" INTEGER NOT NULL,
    "panel_type" TEXT NOT NULL,
    "refresh_rate_hz" INTEGER NOT NULL,
    "response_time_ms" DECIMAL(4,2),
    "brightness" INTEGER,
    "contrast_ratio" TEXT,
    "color_gamut_percent" JSONB NOT NULL DEFAULT '{}',
    "hdr_support" TEXT,
    "adaptive_sync_type" TEXT,
    "ports" JSONB NOT NULL DEFAULT '[]',
    "has_builtin_speakers" BOOLEAN NOT NULL DEFAULT false,
    "has_usb_hub" BOOLEAN NOT NULL DEFAULT false,
    "vesa" TEXT,
    "curvature_mm" INTEGER,
    "aspect_ratio" TEXT,

    CONSTRAINT "monitor_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peripheral_specs" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "peripheral_type" "ComponentType" NOT NULL,
    "connectivity" TEXT[],
    "is_wireless" BOOLEAN NOT NULL DEFAULT false,
    "battery_mah" INTEGER,
    "battery_life_hours" INTEGER,
    "has_rgb" BOOLEAN NOT NULL DEFAULT false,
    "switch_type" TEXT,
    "key_layout" TEXT,
    "is_hot_swap" BOOLEAN NOT NULL DEFAULT false,
    "max_dpi" INTEGER,
    "button_count" INTEGER,
    "sensor_type" TEXT,
    "driver_size_mm" INTEGER,
    "frequency_hz" TEXT,
    "has_mic" BOOLEAN NOT NULL DEFAULT false,
    "surround_sound" TEXT,

    CONSTRAINT "peripheral_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "address" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_platform" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "supplier_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reserved_qty" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 5,
    "is_infinite" BOOLEAN NOT NULL DEFAULT false,
    "location_code" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prices" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "price_type" "PriceType" NOT NULL DEFAULT 'RETAIL',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "compare_at" DECIMAL(12,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "supplier_id" TEXT,
    "price_type" "PriceType" NOT NULL DEFAULT 'RETAIL',
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "source" TEXT NOT NULL DEFAULT 'ADMIN_UPDATE',
    "effective_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "changed_by" TEXT,
    "reason" TEXT,
    "is_correction" BOOLEAN NOT NULL DEFAULT false,
    "original_amount" DECIMAL(12,2),
    "correction_reason" TEXT,
    "corrected_by" TEXT,
    "corrected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "builds" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Build',
    "description" TEXT,
    "status" "BuildStatus" NOT NULL DEFAULT 'DRAFT',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "thumbnail_url" TEXT,
    "total_price_cache" DECIMAL(12,2),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "builds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "build_items" (
    "id" TEXT NOT NULL,
    "build_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "component_type" "ComponentType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "price_snapshot" DECIMAL(12,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "build_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_builds" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "build_id" TEXT NOT NULL,
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_builds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "build_versions" (
    "id" TEXT NOT NULL,
    "build_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "label" TEXT,
    "snapshot" JSONB NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "build_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_build_links" (
    "id" TEXT NOT NULL,
    "build_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "label" TEXT,
    "expires_at" TIMESTAMP(3),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "max_views" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_build_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "build_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "budget_min" DECIMAL(12,2),
    "budget_max" DECIMAL(12,2),
    "items" JSONB NOT NULL,
    "thumbnail_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "build_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compatibility_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rule_type" "CompatibilityRuleType" NOT NULL,
    "severity" "CompatibilitySeverity" NOT NULL DEFAULT 'ERROR',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "tags" TEXT[],
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compatibility_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compatibility_rule_conditions" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "condition_index" INTEGER NOT NULL,
    "component_type" "ComponentType" NOT NULL,
    "attribute_path" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "compare_to_component_type" "ComponentType",
    "compare_to_attribute_path" TEXT,
    "literal_value" TEXT,

    CONSTRAINT "compatibility_rule_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compatibility_rule_results" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "suggestion" TEXT,
    "documentation_url" TEXT,

    CONSTRAINT "compatibility_rule_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compatibility_warnings" (
    "id" TEXT NOT NULL,
    "build_id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "severity" "CompatibilitySeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compatibility_warnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "power_requirements" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "idle_w" INTEGER,
    "typical_w" INTEGER NOT NULL,
    "peak_w" INTEGER NOT NULL,
    "source_notes" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "power_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "physical_dimensions" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "length_mm" DECIMAL(7,2),
    "width_mm" DECIMAL(7,2),
    "height_mm" DECIMAL(7,2),
    "weight_g" DECIMAL(8,2),
    "clearance_top_mm" INTEGER,
    "clearance_side_mm" INTEGER,
    "notes" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "physical_dimensions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "coupon_type" "CouponType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "min_order_amount" DECIMAL(12,2),
    "max_discount_amount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "usage_limit" INTEGER,
    "usage_per_user" INTEGER,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "starts_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "applicable_to_product_ids" TEXT[],
    "applicable_to_category_ids" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_usages" (
    "id" TEXT NOT NULL,
    "coupon_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "session_token" TEXT,
    "expires_at" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "saved_for_later" BOOLEAN NOT NULL DEFAULT false,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "build_id" TEXT,
    "shipping_address_id" TEXT NOT NULL,
    "coupon_id" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "shipping_cost" DECIMAL(12,2) NOT NULL,
    "tax_amount" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "product_name" TEXT NOT NULL,
    "variant_name" TEXT,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "total_price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "provider_payment_id" TEXT,
    "provider_order_id" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "refunded_amount" DECIMAL(12,2),
    "refunded_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "carrier" TEXT,
    "tracking_number" TEXT,
    "tracking_url" TEXT,
    "status" "ShippingStatus" NOT NULL DEFAULT 'PENDING',
    "shipped_at" TIMESTAMP(3),
    "estimated_delivery_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_events" (
    "id" TEXT NOT NULL,
    "shipment_id" TEXT NOT NULL,
    "status" "ShippingStatus" NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "is_verified_purchase" BOOLEAN NOT NULL DEFAULT false,
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "not_helpful_count" INTEGER NOT NULL DEFAULT 0,
    "moderator_note" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_images" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt_text" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Wishlist',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" TEXT NOT NULL,
    "wishlist_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "notes" TEXT,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_email" TEXT,
    "action" "AuditAction" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "entity_label" TEXT,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "image_url" TEXT NOT NULL,
    "mobile_image_url" TEXT,
    "link_url" TEXT,
    "position" TEXT NOT NULL DEFAULT 'hero',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homepage_sections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "section_key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homepage_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_builds" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "use_case" TEXT NOT NULL DEFAULT 'Gaming',
    "total_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "cpu_name" TEXT,
    "gpu_name" TEXT,
    "motherboard_name" TEXT,
    "ram_info" TEXT,
    "storage_info" TEXT,
    "case_name" TEXT,
    "psu_info" TEXT,
    "cooler_name" TEXT,
    "images" TEXT[],
    "components" JSONB NOT NULL DEFAULT '[]',
    "compatibility_summary" JSONB,
    "author_id" TEXT NOT NULL,
    "build_id" TEXT,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "moderation_status" "ModerationStatus" NOT NULL DEFAULT 'APPROVED',
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "moderator_notes" TEXT,
    "moderated_at" TIMESTAMP(3),
    "moderated_by" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_builds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_build_likes" (
    "id" TEXT NOT NULL,
    "build_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_build_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_build_comments" (
    "id" TEXT NOT NULL,
    "build_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_moderated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_build_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_build_reports" (
    "id" TEXT NOT NULL,
    "build_id" TEXT NOT NULL,
    "user_id" TEXT,
    "reporter_email" TEXT,
    "reason" "CommunityReportReason" NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_build_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "permissions_module_idx" ON "permissions"("module");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_action_key" ON "permissions"("action");

-- CreateIndex
CREATE INDEX "user_roles_user_id_idx" ON "user_roles"("user_id");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "user_addresses_user_id_idx" ON "user_addresses"("user_id");

-- CreateIndex
CREATE INDEX "user_addresses_is_default_idx" ON "user_addresses"("is_default");

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE INDEX "brands_slug_idx" ON "brands"("slug");

-- CreateIndex
CREATE INDEX "brands_is_active_idx" ON "brands"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE INDEX "categories_slug_idx" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_is_active_idx" ON "categories"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_key" ON "products"("barcode");

-- CreateIndex
CREATE INDEX "products_brand_id_idx" ON "products"("brand_id");

-- CreateIndex
CREATE INDEX "products_component_type_idx" ON "products"("component_type");

-- CreateIndex
CREATE INDEX "products_is_active_idx" ON "products"("is_active");

-- CreateIndex
CREATE INDEX "products_is_featured_idx" ON "products"("is_featured");

-- CreateIndex
CREATE INDEX "products_slug_idx" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_sku_idx" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_deleted_at_idx" ON "products"("deleted_at");

-- CreateIndex
CREATE INDEX "products_is_active_deleted_at_created_at_idx" ON "products"("is_active", "deleted_at", "created_at");

-- CreateIndex
CREATE INDEX "products_is_active_deleted_at_component_type_created_at_idx" ON "products"("is_active", "deleted_at", "component_type", "created_at");

-- CreateIndex
CREATE INDEX "products_brand_id_is_active_deleted_at_idx" ON "products"("brand_id", "is_active", "deleted_at");

-- CreateIndex
CREATE INDEX "product_categories_category_id_idx" ON "product_categories"("category_id");

-- CreateIndex
CREATE INDEX "product_categories_product_id_idx" ON "product_categories"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_product_id_category_id_key" ON "product_categories"("product_id", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_barcode_key" ON "product_variants"("barcode");

-- CreateIndex
CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");

-- CreateIndex
CREATE INDEX "product_variants_sku_idx" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "product_images_product_id_idx" ON "product_images"("product_id");

-- CreateIndex
CREATE INDEX "product_images_variant_id_idx" ON "product_images"("variant_id");

-- CreateIndex
CREATE INDEX "product_specifications_product_id_idx" ON "product_specifications"("product_id");

-- CreateIndex
CREATE INDEX "product_specifications_key_idx" ON "product_specifications"("key");

-- CreateIndex
CREATE UNIQUE INDEX "product_specifications_product_id_key_key" ON "product_specifications"("product_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "component_type_defs_type_key" ON "component_type_defs"("type");

-- CreateIndex
CREATE INDEX "component_spec_definitions_component_type_id_idx" ON "component_spec_definitions"("component_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "component_spec_definitions_component_type_id_key_key" ON "component_spec_definitions"("component_type_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "cpu_specs_product_id_key" ON "cpu_specs"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "gpu_specs_product_id_key" ON "gpu_specs"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "motherboard_specs_product_id_key" ON "motherboard_specs"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "ram_specs_product_id_key" ON "ram_specs"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "storage_specs_product_id_key" ON "storage_specs"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "psu_specs_product_id_key" ON "psu_specs"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "case_specs_product_id_key" ON "case_specs"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "cooler_specs_product_id_key" ON "cooler_specs"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "fan_specs_product_id_key" ON "fan_specs"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "monitor_specs_product_id_key" ON "monitor_specs"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "peripheral_specs_product_id_key" ON "peripheral_specs"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_name_key" ON "suppliers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_code_key" ON "suppliers"("code");

-- CreateIndex
CREATE INDEX "suppliers_is_active_idx" ON "suppliers"("is_active");

-- CreateIndex
CREATE INDEX "inventory_product_id_idx" ON "inventory"("product_id");

-- CreateIndex
CREATE INDEX "inventory_supplier_id_idx" ON "inventory"("supplier_id");

-- CreateIndex
CREATE INDEX "inventory_quantity_idx" ON "inventory"("quantity");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_product_id_variant_id_supplier_id_key" ON "inventory"("product_id", "variant_id", "supplier_id");

-- CreateIndex
CREATE INDEX "prices_product_id_idx" ON "prices"("product_id");

-- CreateIndex
CREATE INDEX "prices_variant_id_idx" ON "prices"("variant_id");

-- CreateIndex
CREATE INDEX "prices_currency_idx" ON "prices"("currency");

-- CreateIndex
CREATE INDEX "prices_is_active_idx" ON "prices"("is_active");

-- CreateIndex
CREATE INDEX "prices_product_id_is_active_idx" ON "prices"("product_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "prices_product_id_variant_id_price_type_currency_key" ON "prices"("product_id", "variant_id", "price_type", "currency");

-- CreateIndex
CREATE INDEX "price_history_product_id_idx" ON "price_history"("product_id");

-- CreateIndex
CREATE INDEX "price_history_created_at_idx" ON "price_history"("created_at");

-- CreateIndex
CREATE INDEX "price_history_product_id_effective_date_idx" ON "price_history"("product_id", "effective_date");

-- CreateIndex
CREATE INDEX "price_history_variant_id_effective_date_idx" ON "price_history"("variant_id", "effective_date");

-- CreateIndex
CREATE INDEX "builds_user_id_idx" ON "builds"("user_id");

-- CreateIndex
CREATE INDEX "builds_is_public_idx" ON "builds"("is_public");

-- CreateIndex
CREATE INDEX "builds_status_idx" ON "builds"("status");

-- CreateIndex
CREATE INDEX "builds_deleted_at_idx" ON "builds"("deleted_at");

-- CreateIndex
CREATE INDEX "builds_user_id_deleted_at_created_at_idx" ON "builds"("user_id", "deleted_at", "created_at");

-- CreateIndex
CREATE INDEX "build_items_build_id_idx" ON "build_items"("build_id");

-- CreateIndex
CREATE INDEX "build_items_product_id_idx" ON "build_items"("product_id");

-- CreateIndex
CREATE INDEX "build_items_component_type_idx" ON "build_items"("component_type");

-- CreateIndex
CREATE INDEX "saved_builds_user_id_idx" ON "saved_builds"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_builds_user_id_build_id_key" ON "saved_builds"("user_id", "build_id");

-- CreateIndex
CREATE INDEX "build_versions_build_id_idx" ON "build_versions"("build_id");

-- CreateIndex
CREATE UNIQUE INDEX "build_versions_build_id_version_number_key" ON "build_versions"("build_id", "version_number");

-- CreateIndex
CREATE UNIQUE INDEX "shared_build_links_token_key" ON "shared_build_links"("token");

-- CreateIndex
CREATE INDEX "shared_build_links_token_idx" ON "shared_build_links"("token");

-- CreateIndex
CREATE INDEX "shared_build_links_build_id_idx" ON "shared_build_links"("build_id");

-- CreateIndex
CREATE UNIQUE INDEX "build_templates_slug_key" ON "build_templates"("slug");

-- CreateIndex
CREATE INDEX "build_templates_is_active_idx" ON "build_templates"("is_active");

-- CreateIndex
CREATE INDEX "build_templates_is_featured_idx" ON "build_templates"("is_featured");

-- CreateIndex
CREATE UNIQUE INDEX "compatibility_rules_name_key" ON "compatibility_rules"("name");

-- CreateIndex
CREATE INDEX "compatibility_rules_is_active_idx" ON "compatibility_rules"("is_active");

-- CreateIndex
CREATE INDEX "compatibility_rules_rule_type_idx" ON "compatibility_rules"("rule_type");

-- CreateIndex
CREATE INDEX "compatibility_rules_severity_idx" ON "compatibility_rules"("severity");

-- CreateIndex
CREATE INDEX "compatibility_rule_conditions_rule_id_idx" ON "compatibility_rule_conditions"("rule_id");

-- CreateIndex
CREATE UNIQUE INDEX "compatibility_rule_results_rule_id_key" ON "compatibility_rule_results"("rule_id");

-- CreateIndex
CREATE INDEX "compatibility_warnings_build_id_idx" ON "compatibility_warnings"("build_id");

-- CreateIndex
CREATE INDEX "compatibility_warnings_rule_id_idx" ON "compatibility_warnings"("rule_id");

-- CreateIndex
CREATE UNIQUE INDEX "power_requirements_product_id_key" ON "power_requirements"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "physical_dimensions_product_id_key" ON "physical_dimensions"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_code_idx" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_is_active_idx" ON "coupons"("is_active");

-- CreateIndex
CREATE INDEX "coupon_usages_coupon_id_idx" ON "coupon_usages"("coupon_id");

-- CreateIndex
CREATE INDEX "coupon_usages_user_id_idx" ON "coupon_usages"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_usages_coupon_id_order_id_key" ON "coupon_usages"("coupon_id", "order_id");

-- CreateIndex
CREATE UNIQUE INDEX "carts_session_token_key" ON "carts"("session_token");

-- CreateIndex
CREATE INDEX "carts_user_id_idx" ON "carts"("user_id");

-- CreateIndex
CREATE INDEX "carts_session_token_idx" ON "carts"("session_token");

-- CreateIndex
CREATE INDEX "cart_items_cart_id_idx" ON "cart_items"("cart_id");

-- CreateIndex
CREATE INDEX "cart_items_product_id_idx" ON "cart_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cart_id_product_id_variant_id_key" ON "cart_items"("cart_id", "product_id", "variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_order_number_idx" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_payment_id_key" ON "payments"("provider_payment_id");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_provider_payment_id_idx" ON "payments"("provider_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_tracking_number_key" ON "shipments"("tracking_number");

-- CreateIndex
CREATE INDEX "shipments_order_id_idx" ON "shipments"("order_id");

-- CreateIndex
CREATE INDEX "shipments_status_idx" ON "shipments"("status");

-- CreateIndex
CREATE INDEX "shipments_tracking_number_idx" ON "shipments"("tracking_number");

-- CreateIndex
CREATE INDEX "shipment_events_shipment_id_idx" ON "shipment_events"("shipment_id");

-- CreateIndex
CREATE INDEX "reviews_product_id_idx" ON "reviews"("product_id");

-- CreateIndex
CREATE INDEX "reviews_user_id_idx" ON "reviews"("user_id");

-- CreateIndex
CREATE INDEX "reviews_status_idx" ON "reviews"("status");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE INDEX "reviews_product_id_deleted_at_created_at_idx" ON "reviews"("product_id", "deleted_at", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_product_id_user_id_key" ON "reviews"("product_id", "user_id");

-- CreateIndex
CREATE INDEX "review_images_review_id_idx" ON "review_images"("review_id");

-- CreateIndex
CREATE INDEX "wishlists_user_id_idx" ON "wishlists"("user_id");

-- CreateIndex
CREATE INDEX "wishlist_items_wishlist_id_idx" ON "wishlist_items"("wishlist_id");

-- CreateIndex
CREATE INDEX "wishlist_items_product_id_idx" ON "wishlist_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_wishlist_id_product_id_variant_id_key" ON "wishlist_items"("wishlist_id", "product_id", "variant_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "banners_position_is_active_idx" ON "banners"("position", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "homepage_sections_section_key_key" ON "homepage_sections"("section_key");

-- CreateIndex
CREATE UNIQUE INDEX "community_builds_slug_key" ON "community_builds"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "community_builds_build_id_key" ON "community_builds"("build_id");

-- CreateIndex
CREATE INDEX "community_builds_slug_idx" ON "community_builds"("slug");

-- CreateIndex
CREATE INDEX "community_builds_is_featured_idx" ON "community_builds"("is_featured");

-- CreateIndex
CREATE INDEX "community_builds_moderation_status_idx" ON "community_builds"("moderation_status");

-- CreateIndex
CREATE INDEX "community_builds_use_case_idx" ON "community_builds"("use_case");

-- CreateIndex
CREATE INDEX "community_builds_total_price_idx" ON "community_builds"("total_price");

-- CreateIndex
CREATE INDEX "community_builds_author_id_idx" ON "community_builds"("author_id");

-- CreateIndex
CREATE INDEX "community_builds_published_at_idx" ON "community_builds"("published_at");

-- CreateIndex
CREATE INDEX "community_builds_moderation_status_published_at_idx" ON "community_builds"("moderation_status", "published_at");

-- CreateIndex
CREATE INDEX "community_builds_moderation_status_like_count_idx" ON "community_builds"("moderation_status", "like_count");

-- CreateIndex
CREATE INDEX "community_builds_moderation_status_is_featured_idx" ON "community_builds"("moderation_status", "is_featured");

-- CreateIndex
CREATE INDEX "community_builds_moderation_status_total_price_idx" ON "community_builds"("moderation_status", "total_price");

-- CreateIndex
CREATE INDEX "community_build_likes_build_id_idx" ON "community_build_likes"("build_id");

-- CreateIndex
CREATE INDEX "community_build_likes_user_id_idx" ON "community_build_likes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_build_likes_build_id_user_id_key" ON "community_build_likes"("build_id", "user_id");

-- CreateIndex
CREATE INDEX "community_build_comments_build_id_idx" ON "community_build_comments"("build_id");

-- CreateIndex
CREATE INDEX "community_build_comments_user_id_idx" ON "community_build_comments"("user_id");

-- CreateIndex
CREATE INDEX "community_build_reports_build_id_idx" ON "community_build_reports"("build_id");

-- CreateIndex
CREATE INDEX "community_build_reports_status_idx" ON "community_build_reports"("status");

-- CreateIndex
CREATE INDEX "community_build_reports_user_id_idx" ON "community_build_reports"("user_id");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_specifications" ADD CONSTRAINT "product_specifications_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "component_spec_definitions" ADD CONSTRAINT "component_spec_definitions_component_type_id_fkey" FOREIGN KEY ("component_type_id") REFERENCES "component_type_defs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cpu_specs" ADD CONSTRAINT "cpu_specs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gpu_specs" ADD CONSTRAINT "gpu_specs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "motherboard_specs" ADD CONSTRAINT "motherboard_specs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ram_specs" ADD CONSTRAINT "ram_specs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_specs" ADD CONSTRAINT "storage_specs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "psu_specs" ADD CONSTRAINT "psu_specs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_specs" ADD CONSTRAINT "case_specs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cooler_specs" ADD CONSTRAINT "cooler_specs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fan_specs" ADD CONSTRAINT "fan_specs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitor_specs" ADD CONSTRAINT "monitor_specs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peripheral_specs" ADD CONSTRAINT "peripheral_specs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "builds" ADD CONSTRAINT "builds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_items" ADD CONSTRAINT "build_items_build_id_fkey" FOREIGN KEY ("build_id") REFERENCES "builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_items" ADD CONSTRAINT "build_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_items" ADD CONSTRAINT "build_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_builds" ADD CONSTRAINT "saved_builds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_builds" ADD CONSTRAINT "saved_builds_build_id_fkey" FOREIGN KEY ("build_id") REFERENCES "builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_versions" ADD CONSTRAINT "build_versions_build_id_fkey" FOREIGN KEY ("build_id") REFERENCES "builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_build_links" ADD CONSTRAINT "shared_build_links_build_id_fkey" FOREIGN KEY ("build_id") REFERENCES "builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compatibility_rule_conditions" ADD CONSTRAINT "compatibility_rule_conditions_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "compatibility_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compatibility_rule_results" ADD CONSTRAINT "compatibility_rule_results_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "compatibility_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compatibility_warnings" ADD CONSTRAINT "compatibility_warnings_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "compatibility_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "power_requirements" ADD CONSTRAINT "power_requirements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_dimensions" ADD CONSTRAINT "physical_dimensions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_build_id_fkey" FOREIGN KEY ("build_id") REFERENCES "builds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_address_id_fkey" FOREIGN KEY ("shipping_address_id") REFERENCES "user_addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_images" ADD CONSTRAINT "review_images_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "wishlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_builds" ADD CONSTRAINT "community_builds_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_builds" ADD CONSTRAINT "community_builds_build_id_fkey" FOREIGN KEY ("build_id") REFERENCES "builds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_build_likes" ADD CONSTRAINT "community_build_likes_build_id_fkey" FOREIGN KEY ("build_id") REFERENCES "community_builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_build_likes" ADD CONSTRAINT "community_build_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_build_comments" ADD CONSTRAINT "community_build_comments_build_id_fkey" FOREIGN KEY ("build_id") REFERENCES "community_builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_build_comments" ADD CONSTRAINT "community_build_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_build_reports" ADD CONSTRAINT "community_build_reports_build_id_fkey" FOREIGN KEY ("build_id") REFERENCES "community_builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_build_reports" ADD CONSTRAINT "community_build_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
