# Design system

Two themes, one component library (`apps/mobile/src/design`, `src/components/ui`).

## References

* **Duolingo** – chunky buttons with a 4px darker edge that collapses on press, streak flame, zig-zag lesson path with a bouncing "START" node, gold for completed nodes. → `Button`, `StreakChip`, `LessonNode`.
* **Greenlight / GoHenry** – parent dashboard with per-kid cards, approval queue, allowance rules; kid-side goal cards with progress bars and parent match. → `KidSummaryCard`, `ApprovalCard`, `GoalCard`.
* **ClassDojo** – monster avatars and a profile picker that kids recognise. → `Avatar`, `/who`.
* **Khan Academy Kids / Kutuki** – warm cream backgrounds, big emoji illustrations, short "story · fact · tip" lesson cards. → kid theme, lesson player.

## Tokens

| | Kid | Parent |
|---|---|---|
| Background | cream `#FFF8EE` | grey `#F7F7FB` |
| Primary | Chillar violet `#5B4DFF` (edge `#3B2EC2`) | same |
| Accent | coin gold `#FFC233` | same |
| Headline font | Baloo 2 ExtraBold | Nunito ExtraBold |
| Body font | Nunito 600/700 | Nunito 600/700 |
| Button radius | pill | 16px |
| Jar colours | Spend coral `#FF6B6B` · Save teal `#14B8A6` · Share pink `#EC4899` · Grow violet `#8B5CF6` | same |
| Premium | gold gradient `#FFE08A → #FFB020` | same |

Spacing scale 4/8/12/16/20/24/32/48; radii 8–36 + pill; shadows `card`, `raised`, `float` (box-shadow on web, elevation on Android).

## Components

`Text` (12 variants, theme-aware headline family) · `Money` (₹ with Indian grouping, tabular numerals) · `Button` (3D edge, 7 variants, haptics) · `Card` · `Screen` (safe area, phone-width column on web) · `ProgressBar` (animated) · `ProgressRing` (SVG) · `Chip` · `Avatar` · `ListRow` · `SectionHeader` · `EmptyState` · `Icon`/`IconButton` (Ionicons) · `Toast` (queue, spring in) · `Confetti` (Reanimated).

Kid: `JarCard`, `GoalCard`, `ChoreCard`, `StreakChip`, `LevelBadge`, `LessonNode`, `MascotBubble`.
Parent: `StatTile`, `KidSummaryCard`, `ApprovalCard`.
Monetization: `AdSlot`, `PremiumBadge`, `UpsellCard`.
Navigation: `AppTabs` (headless expo-router tabs; floating pill for kids, flat bar for parents, badge support).

## Motion

Entering animations (FadeInUp/ZoomIn) on welcome, profile picker, lesson cards and results; pulsing streak flame when the streak is at risk; bouncing next-lesson node; PIN shake on error; confetti on lesson complete, goal reached and Premium purchase. All animations run on Reanimated 4 and work on web.
