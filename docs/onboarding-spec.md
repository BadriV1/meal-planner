# Meal Planner — Onboarding & Settings Spec (Beta)

**Target user:** busy families with kids, one primary planner.
**Success:** a ready weekly menu every weekend (breakfast, lunch, snack, dinner) that is easy to cook and enjoyable; add Instagram recipe reels in 3 clicks.
**Stack:** Tauri + React + TypeScript, modular. Menu engine: hybrid (rules pick from known meals, LLM fills gaps).

## Onboarding flow (5 screens)

| # | Screen | Required | Notes |
|---|---|---|---|
| 1 | Welcome | — | Value prop |
| 2 | Household | Yes | Pre-selected: 2 adults + 2 toddlers. Members are removable chips; add Toddler (1–4), Kid (5–12), Teen (13–17). Min 1 adult. |
| 3 | Food rules | Yes | Diet type (household-level), allergies, foods to skip |
| 4 | Select your favorite meals | Nudged | Standard meals by Breakfast / Lunch / Snack / Dinner; below: free text + photos of existing meal plans |
| 5 | Sample Monday | — | Adults vs Kids columns; 👍/👎 per meal; signals only (no reasons, no swaps) |

### Screen 3 — Food rules
- **Diet type** (single select, default Non-vegetarian): Vegan · Lacto-vegetarian · Ovo-vegetarian · Lacto-ovo vegetarian · Pescatarian · Non-vegetarian
- **Allergies** (default None): Milk, Eggs, Peanuts, Tree nuts, Wheat/Gluten, Soy, Sesame, Fish, Shellfish, Other. Hard constraint incl. derivatives. Note: "Always check ingredient labels." Conflict notice if diet depends on allergen (e.g. Lacto-veg + Milk).
- **Foods to skip** (optional): soft constraint; saved favorites may still include them.

### Screen 4 — Photos of meal plans
AI extracts meal names (and day, if shown) from a photo of an existing plan (e.g. handwritten weekly menu). Extracted meals appear as pre-selected chips the user can remove. No separate review screen.

### Screen 5 — Sample Monday
- Kids column shown only if household has kids; one Kids column for beta, tuned to youngest age group.
- Same dish can appear in both columns (one-pot dinners).
- Each 👍/👎 stored as a signal tied to meal attributes (cuisine, main ingredient, prep time), per audience (adult/kid).

## After onboarding
- **Menu:** weekly or daily view toggle.
- **Home:** "+ Add reel" (Instagram recipe import, 3 clicks).

## Settings & defaults

| Setting | Default |
|---|---|
| Meals & days | Breakfast, lunch, snack, dinner · 7 days |
| Equipment | Stovetop + oven |
| Batch cooking (main meals) | Off |
| Menu arrives | Saturday 9am |
| Grocery day | Sunday |

### Cooking time

| Block | Weekdays | Weekends | Options |
|---|---|---|---|
| Breakfast + Lunch (combined) | 30 min | 60 min | 15 · 30 · 45 · 60 · 90 |
| Snack | 10 min | 10 min | 10 · 15 · 30 |
| Dinner | 30 min | 60 min | 15 · 30 · 45 · 60 · 90 |

Snacks can be batch-prepped (multi-day) or same-day, regardless of the main-meal batch setting.
