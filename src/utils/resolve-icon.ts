import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/**
 * Returns true if the SVG body contains explicit color fills (hex, CSS vars,
 * gradient refs, named colors) — i.e. anything other than "none" or "currentColor".
 */
export function hasExplicitColors(body: string): boolean {
  const fills = body.match(/fill="([^"]*)"/g) || [];
  return fills.some(f => f !== 'fill="none"' && f !== 'fill="currentColor"');
}

/**
 * Resolves a `prefix:name` icon identifier to a complete SVG string
 * using the installed Iconify JSON packages. Designed for synchronous
 * use at module scope (e.g. in config.ts default values).
 */
export function resolveIcon(name: string): string {
  const colonIndex = name.indexOf(':');
  if (colonIndex === -1) {
    throw new Error(`Invalid icon name "${name}". Expected "prefix:name" format.`);
  }
  const prefix = name.slice(0, colonIndex);
  const iconName = name.slice(colonIndex + 1);

  let iconData: any;
  switch (prefix) {
    case 'lucide':
      iconData = require('@iconify-json/lucide/icons.json');
      break;
    case 'carbon':
      iconData = require('@iconify-json/carbon/icons.json');
      break;
    case 'mdi':
      iconData = require('@iconify-json/mdi/icons.json');
      break;
    case 'phosphor':
      iconData = require('@iconify-json/ph/icons.json');
      break;
    case 'tabler':
      iconData = require('@iconify-json/tabler/icons.json');
      break;
    case 'f5-brand':
      iconData = require('@robinmordasiewicz/icons-f5-brand/icons.json');
      break;
    case 'f5xc':
      iconData = require('@robinmordasiewicz/icons-f5xc/icons.json');
      break;
    case 'hashicorp-flight':
      iconData = require('@robinmordasiewicz/icons-hashicorp-flight/icons.json');
      break;
    default:
      throw new Error(
        `Unknown icon prefix "${prefix}". Available: lucide, carbon, mdi, phosphor, tabler, f5-brand, f5xc, hashicorp-flight`
      );
  }

  const icon = iconData.icons?.[iconName];
  if (!icon) {
    throw new Error(`Icon "${iconName}" not found in "${prefix}" icon set.`);
  }

  const w = icon.width ?? iconData.width ?? 24;
  const h = icon.height ?? iconData.height ?? 24;
  const isPalette = iconData.info?.palette === true || hasExplicitColors(icon.body);
  const fillAttr = isPalette ? '' : ' fill="currentColor"';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 ${w} ${h}"${fillAttr}>${icon.body}</svg>`;
}
