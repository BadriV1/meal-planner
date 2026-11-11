# Meal Planner (prototype)

Desktop app (Tauri + React + TypeScript) that gives busy families a ready weekly menu every weekend.
This first slice is the **onboarding flow**. Spec: [`docs/onboarding-spec.md`](docs/onboarding-spec.md).

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
    menu/                rulesEngine (hard/soft rules, sample day) + aiFill (LLM stub)
    signals/             👍/👎 feedback stored with meal attributes
    mealPlanImport/      photo-of-meal-plan extraction (mocked)
    settings/            agreed defaults (cooking time, rhythm, equipment)
    home/                placeholder Home: menu weekly/daily, + Add reel, settings
src-tauri/               Tauri v2 shell
```

## Onboarding (5 steps)

1. Welcome
2. Household — pre-set 2 adults + 2 toddlers; remove or add toddler/kid/teen
3. Food rules — household diet type, allergies (hard rule), foods to skip (soft rule)
4. Select your favorite meals — standard meals by type, free text, photo of a meal plan
5. Sample Monday — adults vs kids, 👍/👎 per meal saved as signals

## Stubs / next up

- `mealPlanImport/extractFromPhoto.ts` returns mock meals → wire to a vision LLM
- `menu/aiFill.ts` → Claude API for slots the rules can't fill
- Storage uses localStorage → swap `core/storage.ts` for tauri-plugin-store/SQLite
- Home, weekly/daily menu, Settings editing, Instagram reel import
