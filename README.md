# Meal Planner (prototype)

Desktop app (Tauri + React + TypeScript) that gives busy families a ready weekly menu every weekend.
Built so far: the **onboarding flow** and the **weekly menu**. Spec: [`docs/onboarding-spec.md`](docs/onboarding-spec.md).

## Run it

Prereqs: Node 20+, Rust (https://rustup.rs), and the Tauri prerequisites for your OS
(https://tauri.app/start/prerequisites/).

```bash
npm install
npm run tauri dev      # desktop app
# or
npm run dev            # browser only, http://localhost:1420
```

Regenerate the full icon set (icns/ico) before bundling: `npx tauri icon src-tauri/icons/icon.png`.

## Structure

```
src/
  core/                  storage adapter, shared UI + styles
  modules/
    onboarding/          OnboardingFlow + stepRegistry (add/reorder steps here) + steps/
    profile/             HouseholdProfile types, diet/allergen rules, context
    catalog/             standard meal catalog with attributes
    menu/                rulesEngine (hard/soft rules, sample day), weekPlanner (7-day menu),
                         WeeklyMenu screen, aiFill (LLM stub)
    signals/             👍/👎 feedback stored with meal attributes
    mealPlanImport/      photo-of-meal-plan extraction (mocked)
    settings/            agreed defaults (cooking time, rhythm, equipment)
    home/                Home: weekly menu, + Add reel, household + settings summary
src-tauri/               Tauri v2 shell
```

## Onboarding (5 steps)

1. Welcome
2. Household — pre-set 2 adults + 2 toddlers; remove or add toddler/kid/teen
3. Food rules — household diet type, allergies (hard rule), foods to skip (soft rule)
4. Select your favorite meals — standard meals by type, free text, photo of a meal plan
5. Sample Monday — adults vs kids, 👍/👎 per meal saved as signals

## Weekly menu

`menu/weekPlanner.ts` builds 7 days × breakfast/lunch/snack/dinner × adults/kids from the rules layer.

- **Hard rules** (never broken): diet type and allergies, via `rulesEngine.candidates`.
- **Exact 👎** on a dish (per audience) rules it out unless nothing else fits.
- **Score:** favorites +4, 👍 dish +3, 👍/👎 on same main ingredient ±1 and cuisine ±0.5, −3 per repeat this week,
  −4 if served yesterday, max 2 servings/week. Seeded jitter so **Re-plan week** gives a different week.
- **Cooking time** is budgeted per block (breakfast+lunch, snack, dinner) across adults *and* kids, using
  weekday/weekend settings. Lunch time is held back when breakfast is picked.
- **One family dish first:** kids share the adults' dish when it suits their age group and they haven't 👎'd it.
  If a separate kid dish won't fit the time left, both columns switch to a dish the whole family can eat.
- **Batch snacks** (`batchDays`) are prepped once and carried over the following days; follow-on days cost 0 min.
- Stores meal ids only; empty slots (`mealId: null`) are left for the AI layer.

The screen has Weekly (grid, click a cell for that day) and Daily (day tabs, Adults vs Kids, tags: ★ Favorite /
👍 Liked / New) views. As a stand-in for the Saturday 9am run, a menu is generated when Home opens if none exists
for the planning week (Sat/Sun plan next week; weekdays plan the current week).

## Stubs / next up

- `mealPlanImport/extractFromPhoto.ts` returns mock meals → wire to a vision LLM
- `menu/aiFill.ts` → Claude API for slots the rules can't fill
- Storage uses localStorage → swap `core/storage.ts` for tauri-plugin-store/SQLite
- Next screens in order: Meal actions (swap, lock, 👍/👎 on menu meals), Home, Settings editing, Grocery list, Add reel
- Saturday 9am menu run is simulated on open → move to a server job (see agents plan)
