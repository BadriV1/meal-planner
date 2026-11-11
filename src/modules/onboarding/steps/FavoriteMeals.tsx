import { useState } from "react";
import { Chip } from "@/core/ui/components";
import { MEAL_TYPES } from "@/modules/catalog/meals";
import { extractMealsFromPhoto } from "@/modules/mealPlanImport/extractFromPhoto";
import { allowedMeals } from "@/modules/menu/rulesEngine";
import { newId, useProfile } from "@/modules/profile/ProfileContext";

export function FavoriteMeals() {
  const { profile, update } = useProfile();
  const [reading, setReading] = useState(false);
  const [photoName, setPhotoName] = useState<string | null>(null);

  const toggleFav = (id: string) =>
    update({
      favoriteMealIds: profile.favoriteMealIds.includes(id)
        ? profile.favoriteMealIds.filter((x) => x !== id)
        : [...profile.favoriteMealIds, id],
    });
  const removeCustom = (id: string) => update({ customMeals: profile.customMeals.filter((c) => c.id !== id) });

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoName(file.name);
    setReading(true);
    const found = await extractMealsFromPhoto(file, newId);
    update({ customMeals: [...profile.customMeals, ...found] });
    setReading(false);
  };

  return (
    <div>
      <h1>Select your favorite meals</h1>
      <p className="sub">Pick what your family already loves. We'll build menus around these.</p>

      {MEAL_TYPES.map((t) => {
        const standard = allowedMeals(profile, t.id);
        const custom = profile.customMeals.filter((c) => c.mealType === t.id);
        return (
          <section key={t.id}>
            <h2>{t.label}</h2>
            <div className="chips">
              {standard.map((m) => (
                <Chip key={m.id} on={profile.favoriteMealIds.includes(m.id)} onClick={() => toggleFav(m.id)}>
                  {m.name}
                </Chip>
              ))}
              {custom.map((c) => (
                <Chip key={c.id} on onClick={() => removeCustom(c.id)}>
                  {c.name}
                  {c.day && <small>{c.day}</small>} ✕
                </Chip>
              ))}
            </div>
          </section>
        );
      })}

      <h2>Add your own</h2>
      <textarea
        placeholder="e.g. Dal rice, aloo paratha, pasta on Fridays"
        value={profile.favoritesFreeText}
        onChange={(e) => update({ favoritesFreeText: e.target.value })}
      />
      <label className="dropzone" style={{ marginTop: 10 }}>
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => onPhoto(e.target.files?.[0])}
          data-testid="photo-input"
        />
        {reading
          ? `Reading ${photoName}…`
          : "📷 Upload a photo of your meal plan (e.g. handwritten weekly menu)"}
      </label>
      <p className="hint">Meals we find are added above as selected — tap any we got wrong to remove it.</p>
    </div>
  );
}
