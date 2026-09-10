import { CandidateBuild } from '../domain/interfaces';
import { RecommendationInput } from '@pc-platform/types';

export class PreferenceScorer {
  /**
   * Evaluates alignment with explicit user preferences:
   * Wi-Fi, storage capacity, RGB style, streaming capabilities.
   * Returns a score between 0 and 100.
   */
  public static score(build: CandidateBuild, input: RecommendationInput): number {
    let wifiScore = 100;
    let storageScore = 100;
    let rgbScore = 100;
    let featureScore = 100;

    const mbSpecs = build.motherboard?.specifications || {};
    const mbName = (build.motherboard?.name || '').toUpperCase();

    // 1. Wi-Fi Requirement
    if (input.wifiRequirement) {
      const hasWifi =
        mbSpecs.wifi === true ||
        mbSpecs.hasWifi === true ||
        mbName.includes('WIFI') ||
        mbName.includes('WI-FI') ||
        mbName.includes('AX') ||
        mbName.includes('AC');

      wifiScore = hasWifi ? 100 : 40;
    }

    // 2. Storage Requirement (in GB)
    if (input.storageRequirement && input.storageRequirement > 0) {
      const storageSpecs = build.storage?.specifications || {};
      const capStr = String(storageSpecs.capacity || storageSpecs.size || '1000');
      let capacityGb = parseInt(capStr, 10);
      if (capStr.toLowerCase().includes('tb')) {
        capacityGb = (parseFloat(capStr) || 1) * 1000;
      }

      if (capacityGb >= input.storageRequirement) {
        storageScore = 100;
      } else {
        storageScore = Math.max(30, Math.round((capacityGb / input.storageRequirement) * 90));
      }
    }

    // 3. RGB Preference ('none', 'subtle', 'maximum')
    if (input.rgbPreference) {
      const pref = input.rgbPreference;
      const components = [build.case, build.cooling, build.ram, build.gpu].filter(Boolean);

      let rgbComponentCount = 0;
      for (const c of components) {
        const name = (c?.name || '').toUpperCase();
        const specs = c?.specifications || {};
        if (
          name.includes('RGB') ||
          name.includes('ARGB') ||
          specs.rgb === true ||
          specs.lighting === 'RGB'
        ) {
          rgbComponentCount++;
        }
      }

      if (pref === 'none') {
        // User prefers stealth/no-RGB
        rgbScore = rgbComponentCount === 0 ? 100 : Math.max(40, 100 - rgbComponentCount * 20);
      } else if (pref === 'maximum') {
        // User loves RGB lighting
        rgbScore = rgbComponentCount >= 2 ? 100 : 60 + rgbComponentCount * 15;
      } else {
        // Subtle / neutral
        rgbScore = 90;
      }
    }

    // 4. Streaming / Creator feature compliance
    if (input.streamingRequirement) {
      const gpuName = (build.gpu?.name || '').toLowerCase();
      // NVIDIA NVENC is industry benchmark for streaming; AMD AV1 is also supported
      const hasTopEncoder =
        gpuName.includes('rtx') ||
        gpuName.includes('geforce') ||
        gpuName.includes('7800') ||
        gpuName.includes('7900');
      featureScore = hasTopEncoder ? 100 : 75;
    }

    const total = Math.round(
      wifiScore * 0.35 + storageScore * 0.25 + rgbScore * 0.20 + featureScore * 0.20,
    );

    return Math.min(100, Math.max(20, total));
  }
}
