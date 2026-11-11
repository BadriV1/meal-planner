import type { CustomMeal } from "@/modules/profile/types";

/**
 * Reads a photo of an existing meal plan (e.g. handwritten weekly menu)
 * and returns meals by type, keeping the day when the photo shows it.
 *
 * Prototype: returns mock results after a short delay.
 * Next: send the image to a vision-capable LLM and parse structured output.
 */
export async function extractMealsFromPhoto(
  _file: File,
  newId: (p: string) => string,
): Promise<CustomMeal[]> {
  await new Promise((r) => setTimeout(r, 900));
  const mock: Omit<CustomMeal, "id">[] = [
    { name: "Masala dosa", mealType: "breakfast", day: "Sunday", source: "photo" },
    { name: "Sambar rice", mealType: "lunch", day: "Monday", source: "photo" },
    { name: "Pasta night", mealType: "dinner", day: "Friday", source: "photo" },
    { name: "Banana bread", mealType: "snack", source: "photo" },
  ];
  return mock.map((x) => ({ ...x, id: newId("cm") }));
}
