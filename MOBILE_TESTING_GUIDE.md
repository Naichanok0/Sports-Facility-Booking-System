# 📱 Mobile Responsive Testing Guide

## Overview
Sports Facility Booking System is now fully optimized for mobile devices. This guide covers testing procedures for different screen sizes.

## Screen Size Categories

### 📱 Mobile (< 640px)
- iPhones: SE, 12 Mini, 13 Mini
- Android: Most phones (320px - 640px width)
- **Features**: Hamburger menu, dropdown tabs, card-based tables, single column layouts

### 📱 Tablet (640px - 1024px)
- iPad Mini, iPad Air (landscape)
- Large Android tablets
- **Features**: Side-by-side content, 2-column grids, scrollable tabs

### 💻 Desktop (> 1024px)
- Desktop computers, laptops
- iPad (landscape)
- **Features**: Full navigation, all columns visible, horizontal scrolling tables

## Component Testing Checklist

### ✅ MobileNav (Header)

**Desktop View (640px+)**
```
┌─────────────────────────────────────┐
│ 📋 ระบบจองสนามกีฬา    [Logout Button] │
│ ยินดีต้อนรับ, สมชาย ใจดี              │
└─────────────────────────────────────┘
```

Test Points:
- [ ] Logo visible
- [ ] Subtitle shows
- [ ] Logout button visible
- [ ] No text overlap

**Mobile View (< 640px)**
```
┌──────────────────────────┐
│ 📋 ระบบจอง [☰]           │
│ ยินดีต้อนรับ, ส...        │
├──────────────────────────┤
│ [Logout]                 │
└──────────────────────────┘
```

Test Points:
- [ ] Hamburger menu appears
- [ ] Text truncates with `line-clamp`
- [ ] Menu button clickable
- [ ] Touch target ≥ 44px

### ✅ MobileTabs (Tab Navigation)

**Desktop View (640px+)**
```
[📌 จองสนาม] [📌 เข้าร่วม] [📌 ประวัติ] [👤 ข้อมูล] [📈 คิวสำรอง]
```

Test Points:
- [ ] All tabs visible
- [ ] Icons show properly
- [ ] Active tab highlighted
- [ ] Tab scrolls horizontally if needed

**Mobile View (< 640px)**
```
┌──────────────────────────┐
│ 📌 จองสนาม [▼]           │
├──────────────────────────┤
│ 📌 จองสนาม       ✓ (active)
│ 📌 เข้าร่วม            │
│ 📌 ประวัติ              │
│ 👤 ข้อมูล               │
│ 📈 คิวสำรอง             │
└──────────────────────────┘
```

Test Points:
- [ ] Dropdown appears
- [ ] All options accessible
- [ ] Click to switch tab works
- [ ] Dropdown closes after selection
- [ ] Touch target ≥ 44px

### ✅ MobileTable (Data Display)

**Desktop View (768px+)**
```
┌─────────┬──────┬─────────┬────────┬────────┬───────────┐
│ วันที่   │ เวลา  │ สนาม    │ ผู้จอง │ สถานะ  │ การดำเนิน │
├─────────┼──────┼─────────┼────────┼────────┼───────────┤
│ 24 เม.ย. │08:00 │ สนาม 1  │ สมชาย │ จองแล้ว │ [เช็คอิน] │
│ 25 เม.ย. │10:00 │ สนาม 2  │ สมหญิง│ เช็คอิน │ [ยกเลิก]  │
└─────────┴──────┴─────────┴────────┴────────┴───────────┘
```

Test Points:
- [ ] All columns visible
- [ ] Data aligned properly
- [ ] Buttons inline
- [ ] Can scroll horizontally if needed

**Mobile View (< 768px)**
```
┌────────────────────────────┐
│ วันที่: 24 เม.ย. 2026      │
│ เวลา: 08:00 - 10:00        │
│ สนาม: สนาม 1               │
│ ผู้จอง: สมชาย               │
│ สถานะ: จองแล้ว             │
│ [เช็คอิน] [ยกเลิก] [ลบ]    │
└────────────────────────────┘
┌────────────────────────────┐
│ วันที่: 25 เม.ย. 2026      │
│ เวลา: 10:00 - 12:00        │
│ สนาม: สนาม 2               │
│ ผู้จอง: สมหญิง             │
│ สถานะ: เช็คอิน              │
│ [เช็คอิน] [ยกเลิก] [ลบ]    │
└────────────────────────────┘
```

Test Points:
- [ ] Each field visible
- [ ] Card layout looks good
- [ ] Buttons stack or inline
- [ ] No horizontal overflow
- [ ] Touch targets adequate

### ✅ Forms (BookingPage)

**Desktop View (640px+)**
```
┌─────────────────────────────────────────────────┐
│ จองสนามกีฬา                                      │
│ ┌──────────────┐  ┌──────────────────────────┐ │
│ │ เลือกวันที่    │  │ เลือกสนาม              │ │
│ │ [Calendar]   │  │ [สนาม 1] [สนาม 2]      │ │
│ │              │  │ เลือกช่วงเวลา          │ │
│ │              │  │ [08:00] [10:00]         │ │
│ └──────────────┘  │ [12:00] [14:00]         │ │
│                   └──────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Mobile View (< 640px)**
```
┌──────────────────────────────┐
│ จองสนามกีฬา                   │
│ ┌──────────────────────────┐ │
│ │ เลือกวันที่               │ │
│ │ [Calendar - Compact]     │ │
│ │ กรองตามชนิดกีฬา           │ │
│ │ [Dropdown]               │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ เลือกสนาม                │ │
│ │ [สนาม 1]                │ │
│ │ [สนาม 2]                │ │
│ │ เลือกช่วงเวลา             │ │
│ │ [08:00] [10:00]         │ │
│ │ [12:00] [14:00]         │ │
│ │ [สรุป] [จอง]             │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

Test Points:
- [ ] Form elements full width on mobile
- [ ] Calendar fits on screen
- [ ] Selects responsive
- [ ] Buttons large enough to tap
- [ ] No text overlap
- [ ] Labels visible

## Browser DevTools Testing

### Chrome/Edge DevTools
1. Press `F12` to open DevTools
2. Click Device Toggle Toolbar (Ctrl+Shift+M)
3. Select device presets:
   - iPhone 12: 390x844
   - iPad: 768x1024
   - Desktop: 1440x900

### Firefox DevTools
1. Press `F12` to open DevTools
2. Click Responsive Design Mode (Ctrl+Shift+M)
3. Manually resize window or select presets

### Safari DevTools
1. Enable Developer Menu (Safari > Preferences > Advanced)
2. Develop > Enter Responsive Design Mode
3. Select from presets

## Manual Testing Procedure

### Test on Real Devices

**iPhone/iPod Touch**
```
1. Open browser
2. Navigate to app URL
3. Check horizontal/vertical orientation
4. Test all touch interactions
5. Verify no horizontal scrolling
6. Check text readability
7. Test all buttons and links
```

**Android Phone**
```
1. Open Chrome or Firefox
2. Navigate to app URL
3. Check portrait/landscape mode
4. Test all touch interactions
5. Verify no horizontal scrolling
6. Check text readability
7. Test all buttons and links
```

**Tablet**
```
1. Same as phone, but check:
   - 2-column layouts appear
   - Side-by-side content
   - Touch targets still accessible
```

## Specific Features to Test

### 🔐 Login Page
```
Test Matrix:
┌─────────────┬──────────┬────────┐
│ Component   │ Mobile   │ Result │
├─────────────┼──────────┼────────┤
│ Input fields│ Keyboard │   ✓    │
│ Buttons     │ Tappable │   ✓    │
│ Links       │ Tappable │   ✓    │
│ Error text  │ Readable │   ✓    │
└─────────────┴──────────┴────────┘
```

- [ ] Inputs expand properly
- [ ] Keyboard doesn't hide button
- [ ] Error messages visible
- [ ] Links tappable

### 👤 User Dashboard
- [ ] Header hamburger works
- [ ] Tabs change with dropdown
- [ ] Tab content loads
- [ ] No content jumps
- [ ] Back navigation works

### 📋 Admin Dashboard
- [ ] Header responsive
- [ ] Tabs dropdown on mobile
- [ ] Tables card view on mobile
- [ ] Buttons stack properly
- [ ] Filters accessible

### 🏟️ Booking Page
- [ ] Calendar fits screen
- [ ] Selects dropdown properly
- [ ] Facility cards responsive
- [ ] Time slots grid properly
- [ ] Summary visible
- [ ] Booking button accessible

### 📊 Tables
- [ ] Desktop: all columns visible
- [ ] Tablet: 2-3 columns visible
- [ ] Mobile: card layout
- [ ] Buttons not overlapping
- [ ] No horizontal scroll

## Common Issues & Solutions

### ❌ Text Too Small
**Solution**: Use responsive sizes `text-xs sm:text-sm md:text-base`
**Check**: Text should be ≥ 14px on mobile

### ❌ Buttons Not Tappable
**Solution**: Ensure minimum height of 44px
**Check**: `h-8 sm:h-9 md:h-10` or equivalent

### ❌ Horizontal Scrolling
**Solution**: Use `overflow-hidden` or responsive widths
**Check**: Test on iPhone SE (375px width)

### ❌ Form Inputs Collapse
**Solution**: Use full width on mobile `w-full`
**Check**: Inputs should stretch to edges with padding

### ❌ Images Not Responsive
**Solution**: Add `max-w-full` and height auto
**Check**: Images scale with container

## Performance Testing

### Lighthouse Audit (Chrome DevTools)
1. Open DevTools
2. Go to Lighthouse tab
3. Click "Generate report"
4. Check:
   - [ ] Mobile Friendly score
   - [ ] Performance score
   - [ ] Accessibility score
   - [ ] Best Practices score

### Mobile Accessibility
- [ ] Font size readable without zoom
- [ ] Colors have sufficient contrast
- [ ] Touch targets ≥ 44x44 px
- [ ] Text spacing adequate
- [ ] No content hidden on mobile

## Network Testing

### Simulate Slow Network
1. DevTools > Network tab
2. Change throttle to:
   - **Slow 4G**: 400 kb/s down
   - **Fast 3G**: 1.6 Mb/s down
3. Test page loads
4. Check for loading states

- [ ] Page loads under 3 seconds
- [ ] Loading indicators visible
- [ ] Content doesn't shift
- [ ] Buttons don't change position

## Orientation Testing

### Portrait to Landscape
```
Test on real device:
1. App open in portrait
2. Rotate to landscape
3. Check layout adjusts
4. Content remains accessible
5. Rotate back to portrait
6. Verify no errors
```

- [ ] Text wraps properly
- [ ] Images scale
- [ ] Buttons stay tappable
- [ ] No content hidden
- [ ] No layout breaks

## Final QA Checklist

### Before Production

**Mobile (< 640px)**
- [ ] No horizontal scrolling
- [ ] All text readable
- [ ] Touch targets ≥ 44px
- [ ] Images scale properly
- [ ] Forms work with keyboard
- [ ] Navigation clear
- [ ] Loading states visible

**Tablet (640px - 1024px)**
- [ ] 2-column layouts work
- [ ] Side-by-side content readable
- [ ] Touch targets accessible
- [ ] Forms fill properly
- [ ] Navigation intuitive

**Desktop (> 1024px)**
- [ ] All columns visible
- [ ] Layout spread out
- [ ] Typography optimal
- [ ] No excessive whitespace
- [ ] Responsive design visible

## Success Criteria

✅ All pages load under 3 seconds on 4G
✅ No horizontal scrolling on mobile
✅ Text readable without zoom
✅ All buttons tappable (≥ 44px)
✅ Forms usable with mobile keyboard
✅ Tables display as cards on mobile
✅ Navigation accessible on all sizes
✅ Images scale with layout
✅ No layout shifts on scroll
✅ Lighthouse score ≥ 90

## Support

For issues or questions:
1. Check MOBILE_RESPONSIVE_SUMMARY.md
2. Review component source code
3. Test with DevTools
4. Check console for errors

---

**Last Updated**: February 24, 2026
**Version**: 1.0 - Mobile Responsive Complete
