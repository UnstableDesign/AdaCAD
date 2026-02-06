# Media Directory

This directory contains type definitions and interfaces for handling images and color data in AdaCAD. The media system supports image analysis, color extraction, and rendering color definitions for draft visualization.

## Directory Structure

### Core Files

#### `types.ts`
Defines all TypeScript interfaces and types for media handling:

- **`Img`**: Wrapper for an analyzed image:
  - `id`: Unique string identifier
  - `data`: The analyzed image data (or null if not loaded)

- **`AnalyzedImage`**: Complete image analysis data structure:
  - `name`: Original filename
  - `data`: Raw ImageData from the image
  - `colors`: Array of unique hex color values found in the image
  - `colors_mapping`: Array mapping color indices to grouped color indices (for color reduction)
  - `proximity_map`: Array of color proximity relationships `{a: number, b: number, dist: number}`
  - `image`: HTMLImageElement for rendering
  - `image_map`: 2D array mapping each pixel to a color index in the colors array
  - `width`: Image width in pixels
  - `height`: Image height in pixels
  - `type`: Image file type/format
  - `warning`: Optional warning message if image violates rules

- **`Color`**: RGB color representation:
  - `r`: Red component (0-255)
  - `g`: Green component (0-255)
  - `b`: Blue component (0-255)
  - `hex`: Hex color string (e.g., "#FF0000")

- **`DraftCellColor`**: Color definition for rendering draft cells:
  - `id`: String identifier (e.g., 'up', 'down', 'unset', 'edge')
  - `r`: Red component (0-255)
  - `g`: Green component (0-255)
  - `b`: Blue component (0-255)
  - `a`: Alpha component (0-255)

- **`SingleImage`**: Simplified image structure without analysis:
  - `name`: Filename
  - `data`: ImageData
  - `image`: HTMLImageElement
  - `width`: Image width
  - `height`: Image height
  - `type`: Image type
  - `warning`: Optional warning

#### `index.ts`
Exports all types from the media directory.

## Usage

The media types are primarily used for:

1. **Image Import**: When users upload images to convert to drafts, the image is analyzed and stored as an `AnalyzedImage`
2. **Color Extraction**: The `colors` array contains all unique colors found in the image
3. **Color Mapping**: The `colors_mapping` allows grouping similar colors together
4. **Draft Rendering**: `DraftCellColor` defines how different cell states are rendered

## Example Usage

```typescript
import { AnalyzedImage, DraftCellColor } from './media';

// Draft cell color definitions
const cellColors: Array<DraftCellColor> = [
  {
    id: 'up',
    r: 0,
    g: 0,
    b: 0,
    a: 255  // Black for heddle up
  },
  {
    id: 'down',
    r: 255,
    g: 255,
    b: 255,
    a: 255  // White for heddle down
  }
];

// Working with analyzed images
function processImage(img: AnalyzedImage) {
  // Access unique colors
  const uniqueColors = img.colors;
  
  // Map pixels to colors
  const pixelColor = img.colors[img.image_map[0][0]];
  
  // Check for warnings
  if (img.warning) {
    console.warn(img.warning);
  }
}
```

## Integration

The media types integrate with:

- **Image Operations**: Used by operations that convert images to drafts
- **Draft Rendering**: `DraftCellColor` is used in `draft.ts`'s `getDraftAsImage()` function
- **Color Effects**: Operations that manipulate colors use these types

## Extending Media Types

To add new color or image properties:

```typescript
// In types.ts
export interface ExtendedColor extends Color {
  hsl?: { h: number, s: number, l: number };
  lab?: { l: number, a: number, b: number };
}

export interface ExtendedAnalyzedImage extends AnalyzedImage {
  dominantColors?: Array<Color>;
  colorHistogram?: Map<string, number>;
}
```
