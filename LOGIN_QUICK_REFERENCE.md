# Login Page - Quick Reference Guide

## Responsive Breakpoints at a Glance

| Screen Size | Layout | Form Width | Image Width | Image Height | Logo Size |
|------------|--------|-----------|-----------|-------------|-----------|
| 1440px+ | Split | 45% | 55% | 100vh | 60x60 |
| 1200px | Split | 48% | 52% | 100vh | 60x60 |
| 1024px | Split | 50% | 50% | 100vh | 60x60 |
| 768px | Stacked | 100% | 100% | 300px | 60x60 |
| 640px | Stacked | 100% | 100% | 250px | 50x50 |
| 480px | Stacked | 100% | 100% | 200px | 45x45 |

## CSS Classes

### Main Containers
- `.login-split-container` - Main flex container
- `.login-left` - Form side
- `.login-right` - Image side
- `.login-card` - Form wrapper

### Form Elements
- `.form-group` - Input field wrapper
- `.input-icon` - Icon container
- `.password-wrapper` - Password field
- `.password-toggle` - Eye icon button

### Buttons
- `.btn-login-primary` - Main button
- `.social-btn` - Social buttons
- `.google-btn` - Google button
- `.apple-btn` - Apple button

### Text & Links
- `.login-header` - Header section
- `.login-logo` - Logo container
- `.login-divider` - Divider line
- `.login-signin-link` - Sign in link
- `.login-footer` - Footer section

### Image
- `.hotel-image-container` - Image wrapper
- `.hotel-image` - Image element
- `.image-overlay` - Overlay gradient

## Media Query Breakpoints

```css
/* Desktop (1440px+) */
/* Default styles */

/* Large Desktop (1200px-1440px) */
@media (max-width: 1440px)

/* Desktop (1024px-1200px) */
@media (max-width: 1200px)

/* Tablet (768px-1024px) */
@media (max-width: 1024px)

/* Large Mobile (640px-768px) */
@media (max-width: 768px)

/* Mobile (480px-640px) */
@media (max-width: 640px)

/* Small Mobile (<480px) */
@media (max-width: 480px)
```

## Key CSS Properties

### Split Container
```css
.login-split-container {
  display: flex;
  height: 100vh;
  width: 100%;
}
```

### Form Side
```css
.login-left {
  flex: 0 0 45%;  /* 45% on desktop */
  width: 45%;
  padding: 30px;
}
```

### Image Side
```css
.login-right {
  flex: 0 0 55%;  /* 55% on desktop */
  width: 55%;
  height: 100vh;
}
```

### Form Card
```css
.login-card {
  max-width: 380px;  /* Desktop */
  gap: 18px;
}
```

## Responsive Sizing

### Font Sizes
- Heading: 2rem → 1.75rem → 1.5rem → 1.35rem → 1.2rem
- Paragraph: 0.95rem → 0.9rem → 0.85rem → 0.8rem
- Footer: 0.8rem → 0.75rem → 0.7rem

### Padding
- Container: 30px → 25px → 20px → 16px 12px
- Form Group: 12px 16px → 11px 14px → 10px 12px

### Gaps
- Form: 18px → 16px → 14px → 12px
- Header: 16px → 12px → 10px

### Button Sizes
- Desktop: 14px 24px
- Tablet: 12px 20px
- Mobile: 11px 18px
- Small Mobile: 10px 16px

## Testing Commands

### Browser DevTools
1. Open DevTools (F12)
2. Click responsive design mode (Ctrl+Shift+M)
3. Test different screen sizes:
   - 1440px (Ultra-wide)
   - 1200px (Large desktop)
   - 1024px (Desktop)
   - 768px (Tablet)
   - 640px (Large mobile)
   - 480px (Mobile)
   - 375px (Small mobile)

### Real Device Testing
- Desktop: 1920x1080, 1440x900, 1024x768
- Tablet: iPad (768x1024), iPad Pro (1024x1366)
- Mobile: iPhone 12 (390x844), iPhone SE (375x667)

## Common Issues & Solutions

### Horizontal Scrolling
- Check if max-width is set correctly
- Verify padding doesn't exceed container
- Ensure image has object-fit: cover

### Text Too Small
- Check font-size at breakpoint
- Verify line-height is set
- Ensure contrast is sufficient

### Image Not Showing
- Check image URL is correct
- Verify object-fit: cover is set
- Check image height at breakpoint

### Buttons Not Clickable
- Verify padding is sufficient (min 44px)
- Check z-index if overlapping
- Ensure cursor: pointer is set

## Performance Tips

1. **Minimize Media Queries**
   - Use mobile-first approach
   - Only override what changes

2. **Optimize Images**
   - Use appropriate image size
   - Consider lazy loading
   - Use modern formats (WebP)

3. **CSS Efficiency**
   - Use flexbox for layout
   - Avoid fixed widths
   - Use relative units (%, rem)

4. **JavaScript**
   - Minimal JS needed
   - Use CSS for responsiveness
   - Avoid layout thrashing

## Accessibility Checklist

✅ Text readable at all sizes
✅ Buttons min 44px (touch-friendly)
✅ Proper color contrast
✅ Semantic HTML
✅ Keyboard navigation
✅ Focus states visible
✅ No horizontal scrolling
✅ Proper spacing

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Files to Check

1. `hotel-ui/index.html` - Login page HTML
2. `hotel-ui/style.css` - Responsive CSS
3. `hotel-ui/logo.png` - Logo image

## Quick Customization

### Change Colors
```css
.login-split-container {
  background: white;  /* Change form background */
}

.login-right {
  background: #2c3e50;  /* Change image background */
}

.btn-login-primary {
  background: #000000;  /* Change button color */
}
```

### Change Image
```html
<img src="YOUR_IMAGE_URL" alt="Luxury Hotel" class="hotel-image">
```

### Change Widths
```css
.login-left {
  flex: 0 0 40%;  /* Change form width */
  width: 40%;
}

.login-right {
  flex: 0 0 60%;  /* Change image width */
  width: 60%;
}
```

## Support

For issues or questions:
1. Check responsive design guide
2. Verify CSS is loaded
3. Test in different browsers
4. Check browser console for errors
5. Verify image URL is correct
