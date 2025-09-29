// types/strapitypes.ts

export type StrapiListResponse<T> = { data: T[]; meta?: any };

// ── shared bits ───────────────────────────────────────────────────────────────

export type border = {
  id?: number | string;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | string | null;
  borderWidth?: number | null;
  borderColor?: string | null;
  borderRadius?: number | string | null;
};

export type margin = {
  id?: number | string;
  top?: number | null;
  right?: number | null;
  bottom?: number | null;
  left?: number | null;
};
export type Padding = {
  id?: number | string;
  top?: number | null;
  right?: number | null;
  bottom?: number | null;
  left?: number | null;
};
export type focusedBorder = {
  id: number | string;
  borderStyle: string | null;
  borderWidth: number | null;
  borderColor: string | null;
  borderRadius: number | string | null;
};

export type fontStyle = {
  id?: number | string;
  fontSize?: number | null;
  fontWeight?: string | null;
  fontStyle?: string | null;
  lineHeight?: number | null;
  textTransform?: string | null;
  textDecoration?: string | null;
  color?: string | null;
};

export type badge = {
  id?: number | string;
  label?: string | null;
  position?: string | null;
  height?: number | null;
  width?: number | null;
  labelStyle?: labelStyle | null;
  margin?: margin | null;
};
export type labelStyle = {
  id?: number | string;
  color?: string | null;
  height?: number | null;
  width?: number | null;
  align?: string | null;
  fontStyle?: fontStyle | null;
};
export type secondaryImage = {
  id?: number | string;
  sourceKey?: string | null;
  height?: number | null;
  width?: number | null;
  imagePosition?: string | null;
  margin?: margin | null;
  padding?: Padding | null;
  opacity?: number | null;
};
export type image = {
  id?: number | string;
  sourceKey?: string | null;
  aspectRatio?: string | null;
  width?: number | null;
  height?: number | null;
  margin?: margin | null;
  padding?: Padding | null;
};
export type titleStyle = {
  id?: number | string;
  color?: string | null;
  height?: number | null;
  width?: number | null;
  align?: string | null;
  fontStyle?: fontStyle | null;
};
export type descriptionStyle = {
  id?: number | string;
  color?: string | null;
  height?: number | null;
  width?: number | null;
  align?: string | null;
  fontStyle?: fontStyle | null;
};
export type cardStyle = {
  id?: number | string;
  height?: number | null;
  useSecondaryImage?: boolean | null;
  backgroundColor?: string | null;
  showTitle?: boolean | null;
  titleSourceKey?: string | null;
  showDescription?: boolean | null;
  descriptionSourceKey?: string | null;
  showBadges?: boolean | null;
  width?: number | null;
  titleStyle?: titleStyle | null;
  descriptionStyle?: descriptionStyle | null;
  badgestyle?: badge | null;
  borderStyle?: border | null;
  focusedBorderStyle?: focusedBorder | null;
  image?: image | null;
  secondaryImage?: secondaryImage | null;
};
export type MCardStyle = {
  id?: number | string;
  documentId?: string;
  name?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
  cardStyle?: cardStyle | null;
};

export type AcardStyle = {
  presetName: string;
  imageKey?: string | null;
  secondaryImageKey?: string | null;

  /** Overall card size (explicit, if Strapi provided) */
  container: {
    width?: number | null;
    height?: number | null;
  };

  /** How to render the main (poster) image */
  mainImage: {
    sourceKey?: string | null;
    aspectRatio?: string | null;
    height?: number | null;
    width?: number | null;
    mainImageMargin: {
      id?: number | string;
      top?: number | null;
      right?: number | null;
      bottom?: number | null;
      left?: number | null;
    };
    mainImagePadding: {
      id?: number | string;
      top?: number | null;
      right?: number | null;
      bottom?: number | null;
      left?: number | null;
    };
  };

  /** How to render the secondary image (logo / numeral strip) */
  secondaryImage: {
    sourceKey?: string | null;
    height?: number | null;
    width?: number | null;
    imagePosition?: string | null;
    imageMargin: {
      id?: number | string;
      top?: number | null;
      right?: number | null;
      bottom?: number | null;
      left?: number | null;
    };
    imagePadding: {
      id?: number | string;
      top?: number | null;
      right?: number | null;
      bottom?: number | null;
      left?: number | null;
    };
  };

  /** Behavior flags */
  useSecondaryAsBackground: boolean;
  titleSourceKey?: string | null;
  descriptionSourceKey?: string | null;
  showTitle: boolean;
  showDescription: boolean;
  showBadges: boolean;
  /** Optional border & padding info (already combined) */
  borderStyle?: border;

  titleStyle?: titleStyle | null;
  descriptionStyle?: descriptionStyle | null;
  badgeStyle?: badge | null;
};

// ── List settings (kept separate; you will look up card style by preset name) ─
export type ListSetting = {
  id: number | string;
  documentId: string;
  presetName: string;
  titleKey?: string;
  tilesToShow?: number;
  showTitle?: boolean;
  isBanner?: boolean;
  isFeatured?: boolean;

  /** Some APIs embed a cardStyle, but your app should fetch the real card by preset name from card-settings. */
  cardStyle?: MCardStyle | null;
};

// ── Playlist item shape ───────────────────────────────────────────────────────
export type PlaylistItem = {
  id: number | string;
  title?: string;
  desc?: string;
  media_group?: Array<{
    type: string;
    media_item: Array<{ key: string; src: string }>;
  }>;
  images?: Record<string, string>;
  extensions?: Record<string, string>;
  [k: string]: any;
};
