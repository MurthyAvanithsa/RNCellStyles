// services/componentMapping.ts
import HorizontalList from '../components/HorizontalList';
import VerticalList from '../components/VerticalList';

/** A single entry from Strapi's pageLayout array */
export type PageLayoutComponent = {
  __component: string; // e.g. "mobile.horizontal-list"
  id: number;
  name?: string;
  playlistUrl?: string;
  cardStyle?: any; // may already be normalized or nested (e.g. { cardStyle: {...} })
  snap?: boolean;
  itemWidthPct?: number;
  itemSpacing?: number;
  showTitle?: boolean; // <-- used by HorizontalList to show a rail title
  titleKey?: string | null; // <-- field name to read from first item (e.g. "title")
  [k: string]: any;
};

/** What the mapper returns */
export type ResolvedComponent =
  | { kind: 'horizontal'; Component: typeof HorizontalList }
  | { kind: 'vertical'; Component: typeof VerticalList };

/**
 * Map a Strapi component type → your React component (constructor).
 * No data fetching here, just type-to-component mapping.
 */
export function resolveComponentForBlock(
  block: PageLayoutComponent,
): ResolvedComponent | null {
  switch (block.__component) {
    case 'mobile.horizontal-list':
      return { kind: 'horizontal', Component: HorizontalList };
    case 'mobile.vertical-list':
      return { kind: 'vertical', Component: VerticalList };
    default:
      console.warn('Unknown block type:', block.__component, block);
      return null;
  }
}
