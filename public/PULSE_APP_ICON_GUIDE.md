# Pulse App Icon Guide

## ✅ What You Have

**`pulse-logo-circular.svg`** - Your circular, scalable Pulse logo optimized for app icons

This SVG is:
- Perfectly circular (1024x1024)
- Scalable to any size without quality loss
- Optimized for both iOS and Android
- Features the neon green pulse rings on dark background

## 📱 Required Icon Sizes

### iOS App Icon Sizes

Your app needs these sizes for iOS (all in PNG format):

| File Name | Size | Purpose |
|-----------|------|---------|
| `icon-1024.png` | 1024x1024 | **App Store (Required)** |
| `icon-60@3x.png` | 180x180 | iPhone app icon |
| `icon-60@2x.png` | 120x120 | iPhone app icon |
| `icon-40@2x.png` | 80x80 | iPhone Spotlight |
| `icon-29@3x.png` | 87x87 | iPhone Settings |
| `icon-29@2x.png` | 58x58 | iPhone Settings |
| `icon-83.5@2x.png` | 167x167 | iPad Pro |
| `icon-76@2x.png` | 152x152 | iPad |
| `icon-76.png` | 76x76 | iPad |
| `icon-40.png` | 40x40 | iPad Spotlight |
| `icon-29.png` | 29x29 | iPad Settings |

### Android App Icon Sizes

Your app needs these sizes for Android (all in PNG format):

| File Name | Size | Purpose |
|-----------|------|---------|
| `playstore-icon-512.png` | 512x512 | **Google Play Store (Required)** |
| `mipmap-xxxhdpi.png` | 192x192 | Extra extra extra high density |
| `mipmap-xxhdpi.png` | 144x144 | Extra extra high density |
| `mipmap-xhdpi.png` | 96x96 | Extra high density |
| `mipmap-hdpi.png` | 72x72 | High density |
| `mipmap-mdpi.png` | 48x48 | Medium density (baseline) |

## 🛠️ How to Generate PNG Icons

### Option 1: Online Tool (Easiest)
1. Go to **https://www.figma.com/** or **https://www.photopea.com/**
2. Upload `pulse-logo-circular.svg`
3. Export at each required size as PNG
4. Download all files

### Option 2: Using Figma (Recommended for Designers)
1. Import `pulse-logo-circular.svg` into Figma
2. Create a frame for each size needed
3. Use "Export" panel to batch export all sizes
4. Select PNG format with 2x quality

### Option 3: Using ImageMagick (Command Line)
```bash
# Install ImageMagick with SVG support
brew install imagemagick librsvg  # macOS
# or
sudo apt-get install imagemagick librsvg2-bin  # Linux

# Generate all iOS icons
convert pulse-logo-circular.svg -resize 1024x1024 icon-1024.png
convert pulse-logo-circular.svg -resize 180x180 icon-60@3x.png
convert pulse-logo-circular.svg -resize 120x120 icon-60@2x.png
convert pulse-logo-circular.svg -resize 80x80 icon-40@2x.png
convert pulse-logo-circular.svg -resize 87x87 icon-29@3x.png
convert pulse-logo-circular.svg -resize 58x58 icon-29@2x.png
convert pulse-logo-circular.svg -resize 167x167 icon-83.5@2x.png
convert pulse-logo-circular.svg -resize 152x152 icon-76@2x.png
convert pulse-logo-circular.svg -resize 76x76 icon-76.png
convert pulse-logo-circular.svg -resize 40x40 icon-40.png
convert pulse-logo-circular.svg -resize 29x29 icon-29.png

# Generate all Android icons
convert pulse-logo-circular.svg -resize 512x512 playstore-icon-512.png
convert pulse-logo-circular.svg -resize 192x192 mipmap-xxxhdpi.png
convert pulse-logo-circular.svg -resize 144x144 mipmap-xxhdpi.png
convert pulse-logo-circular.svg -resize 96x96 mipmap-xhdpi.png
convert pulse-logo-circular.svg -resize 72x72 mipmap-hdpi.png
convert pulse-logo-circular.svg -resize 48x48 mipmap-mdpi.png
```

### Option 4: Using React Native Tool
```bash
# Install app icon generator
npm install -g app-icon

# Generate all sizes automatically
app-icon generate -i pulse-logo-circular.svg
```

## 📂 How to Add Icons to Your App

### iOS (Xcode)
1. Open your Xcode project
2. Go to `Assets.xcassets` → `AppIcon`
3. Drag and drop each PNG into its corresponding slot
4. Make sure the 1024x1024 icon is in the "App Store" slot

### iOS (React Native)
1. Place icons in `ios/YourApp/Images.xcassets/AppIcon.appiconset/`
2. Update the `Contents.json` file with correct filenames

### Android (React Native)
1. Copy icons to these folders:
   ```
   android/app/src/main/res/mipmap-mdpi/ic_launcher.png (48x48)
   android/app/src/main/res/mipmap-hdpi/ic_launcher.png (72x72)
   android/app/src/main/res/mipmap-xhdpi/ic_launcher.png (96x96)
   android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png (144x144)
   android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png (192x192)
   ```

### Android (Native)
1. Same as React Native above
2. Also copy `playstore-icon-512.png` for Google Play Console upload

## 🎨 Design Notes

Your Pulse logo features:
- **Centered design** - Works perfectly in a circle
- **High contrast** - Neon green (#30C476) on dark background (#12100D)
- **Concentric rings** - The pulse wave effect
- **Glowing core** - Bright center point
- **No text** - Icon-only for app launcher (text appears in app name)

## ✅ Quality Checklist

Before submitting to app stores:
- [ ] All icons are exactly the right dimensions
- [ ] Icons are PNG format (not JPEG)
- [ ] Icons have NO transparency for iOS (solid background)
- [ ] 1024x1024 icon looks sharp (for App Store)
- [ ] 512x512 icon looks sharp (for Play Store)
- [ ] Icons look good on both light and dark backgrounds
- [ ] Test on actual device to verify clarity

## 🚀 Quick Start (React Native)

If you're using React Native, use this automated tool:

```bash
# Install
npm install -g react-native-make

# Generate all icons from your SVG
npx react-native set-icon --path pulse-logo-circular.svg
```

This will automatically create all sizes and place them in the correct folders!

## 📞 Need Help?

If you need the PNG files generated for you:
1. Use an online SVG to PNG converter like https://cloudconvert.com/svg-to-png
2. Upload the SVG and select each size you need
3. Download the batch of PNGs

---

**Pro Tip**: Keep the original SVG file in your project repository. You can always regenerate icons if needed!
