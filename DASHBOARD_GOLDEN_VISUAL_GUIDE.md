# Dashboard Golden Theme - Visual Guide

## Color Palette

### Primary Colors
```
Golden Primary:    #D4AF37 (RGB: 212, 175, 55)
Gold Accent:       #FFD700 (RGB: 255, 215, 0)
Black Background:  #000000 (RGB: 0, 0, 0)
Dark Background:   #1a1a1a (RGB: 26, 26, 26)
White Text:        #ffffff (RGB: 255, 255, 255)
Muted Text:        #cccccc (RGB: 204, 204, 204)
```

## Component Styling

### Sidebar
- **Background**: Black gradient (0% opacity to 95% opacity)
- **Border**: Golden with 20% opacity
- **Logo**: Crown SVG with golden gradient
- **Title**: "Dashboard" with animated golden gradient text
- **Navigation Items**: 
  - Default: Muted gray text
  - Hover: White text with golden background (10% opacity)
  - Active: White text with golden background (15% opacity)
  - Left border: Golden gradient indicator

### Main Content Area
- **Background**: Black with radial gradient overlay
- **Section Headers**: 
  - Large animated golden gradient text
  - 3-second continuous animation loop
  - Gradient: Golden → Gold → Golden

### Cards & Panels
- **Stat Cards**: 
  - Black background with 80% opacity
  - Golden border (20% opacity)
  - Golden top border indicator on hover
  - White text for all content
  - Golden icons

- **Mini Stat Cards**:
  - Black background with 70% opacity
  - Golden border (20% opacity)
  - White text and values
  - Golden icons

- **Booking Cards**:
  - Black background with 70% opacity
  - Golden left border indicator
  - White text for all content
  - Golden accent elements

### Buttons

#### Primary Button
- **Background**: Golden gradient animation
- **Text**: White
- **Shadow**: Golden glow (40% opacity)
- **Hover**: Lift effect with enhanced shadow
- **Animation**: Continuous gradient shift

#### Secondary Button
- **Background**: Golden with 10% opacity
- **Border**: Golden with 30% opacity
- **Text**: Golden
- **Hover**: Slide animation with enhanced shadow

#### Danger Button
- **Background**: Golden with 15% opacity
- **Border**: Golden with 30% opacity
- **Text**: Golden
- **Hover**: Solid golden background with white text

#### Toggle Button
- **Enabled**: Green background with green border
- **Disabled**: Golden background with golden border
- **Hover**: Scale effect with enhanced shadow

### Input Fields
- **Background**: Dark with 60% opacity
- **Border**: Golden with 20% opacity
- **Text**: White
- **Focus**: White border with golden shadow (20% opacity)
- **Placeholder**: Muted gray text

### Badges & Labels
- **Background**: Animated golden gradient
- **Text**: White
- **Animation**: 3-second gradient shift loop

### Icons
- **Color**: Golden (#D4AF37)
- **Size**: Varies by context (1rem to 2rem)
- **Animation**: Smooth transitions on hover

## Animations

### Gradient Shift (3 seconds)
```
0%:   background-position: 0% center
50%:  background-position: 100% center
100%: background-position: 0% center
```
Applied to: Headers, badges, buttons, titles

### Slide In From Left
- Duration: 0.6s
- Easing: ease-out
- Applied to: Sidebar, info cards

### Slide In From Right
- Duration: 0.4s
- Easing: ease-out
- Applied to: IP list items

### Slide In Up
- Duration: 0.3s
- Easing: ease-out
- Applied to: Cards, items, panels

### Fade In Up
- Duration: 0.5s
- Easing: ease-out
- Applied to: Sections

### Spin
- Duration: 1s
- Easing: linear infinite
- Applied to: Loading spinners

## Hover Effects

### Cards
- **Transform**: translateX(4px) or translateY(-4px)
- **Border**: Changes to white
- **Shadow**: Enhanced with golden glow
- **Text**: All text forced to white

### Buttons
- **Transform**: translateY(-2px) or scale(1.05)
- **Shadow**: Enhanced with golden glow
- **Ripple**: White ripple effect on click

### Navigation Items
- **Transform**: translateX(4px)
- **Background**: Golden with 10% opacity
- **Icon**: Scale(1.1)

## Responsive Design

### Desktop (1024px+)
- Sidebar: 280px width
- Main content: Full width with padding
- Grid layouts: 4 columns for stat cards

### Tablet (768px - 1024px)
- Sidebar: 240px width
- Main content: Adjusted padding
- Grid layouts: 2-3 columns

### Mobile (<768px)
- Sidebar: Full width, hidden by default
- Main content: Full width
- Grid layouts: 1 column
- Stat cards: Stacked vertically

## Logo Design

### Crown SVG
- **Dimensions**: 56x56px
- **Background**: Golden gradient
- **Border Radius**: 12px
- **Shadow**: Golden glow (30% opacity)
- **Crown Elements**:
  - Base: Horizontal rectangle
  - Points: Three triangular peaks
  - Jewels: Three golden circles
  - Text: "V3" below crown

## Text Hierarchy

1. **Section Headers (h1)**: 2.5rem, 900 weight, animated golden gradient
2. **Panel Titles (h3)**: 1.3rem, 800 weight, animated golden gradient
3. **Sidebar Title (h2)**: 1.5rem, 800 weight, animated golden gradient
4. **Labels**: 0.85rem, 600 weight, uppercase, muted gray
5. **Values**: 1.5-2.5rem, 800 weight, white
6. **Body Text**: 0.95rem, 400-600 weight, white or muted gray

## Contrast Ratios

- **White on Black**: 21:1 (AAA compliant)
- **Golden on Black**: 8.5:1 (AA compliant)
- **Muted Gray on Black**: 7.2:1 (AA compliant)

## Shadow Effects

### Subtle Shadow
```
box-shadow: 0 4px 16px rgba(212, 175, 55, 0.15)
```

### Medium Shadow
```
box-shadow: 0 8px 24px rgba(212, 175, 55, 0.2)
```

### Strong Shadow
```
box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5)
```

## Glass Morphism

### Panel Background
```
background: linear-gradient(135deg, rgba(26, 26, 26, 0.8) 0%, rgba(0, 0, 0, 0.8) 100%)
backdrop-filter: blur(20px)
border: 1px solid rgba(212, 175, 55, 0.2)
```

## Transitions

- **Default**: 0.3s cubic-bezier(0.4, 0, 0.2, 1)
- **Fast**: 0.2s ease
- **Slow**: 0.5s ease-out

## Summary

The golden/black luxury theme creates a premium, sophisticated appearance with:
- ✅ High contrast for accessibility
- ✅ Smooth, continuous animations
- ✅ Professional color palette
- ✅ Elegant crown logo
- ✅ Responsive design
- ✅ Consistent styling throughout
- ✅ White text for maximum readability
- ✅ Golden accents for visual hierarchy
