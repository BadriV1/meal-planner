import { Chip, Stepper } from "@/core/ui/components";
import { newId, useProfile } from "@/modules/profile/ProfileContext";
import { MEMBER_AGES, MEMBER_LABEL } from "@/modules/profile/rules";
import type { Member, MemberType } from "@/modules/profile/types";

type KidType = Exclude<MemberType, "adult">;
const KID_TYPES: KidType[] = ["toddler", "kid", "teen"];

export function Household() {
  const { profile, update } = useProfile();
  const adults = profile.members.filter((m) => m.type === "adult");
  const kids = profile.members.filter((m) => m.type !== "adult");

  const setAdults = (n: number) => {
    const next: Member[] = Array.from({ length: n }, (_, i) => adults[i] ?? { id: newId("a"), type: "adult" });
    update({ members: [...next, ...kids] });
  };
  const removeKid = (id: string) => update({ members: profile.members.filter((m) => m.id !== id) });
  const addKid = (type: KidType) => update({ members: [...profile.members, { id: newId("k"), type }] });

  // "Toddler 1", "Toddler 2", "Kid 1"… numbered within each type.
  const labelFor = (m: Member) => {
    const sameType = kids.filter((k) => k.type === m.type);
    return `${MEMBER_LABEL[m.type]} ${sameType.indexOf(m) + 1}`;
  };

  return (
    <div>
      <h1>Who are we cooking for?</h1>
      <p className="sub">We've started you with a family of 4. Adjust if needed.</p>

      <div className="row">
        <strong>Adults</strong>
        <Stepper label="adults" value={adults.length} min={1} max={8} onChange={setAdults} />
      </div>

      <h2>Kids</h2>
      <div className="chips">
        {kids.map((k) => (
          <Chip key={k.id} on onClick={() => removeKid(k.id)}>
            ✓ {labelFor(k)} <small>tap to remove</small>
          </Chip>
        ))}
        {kids.length === 0 && <p className="hint" style={{ marginTop: 6 }}>No kids added.</p>}
      </div>
      <div className="chips" style={{ marginTop: 12 }}>
        {KID_TYPES.map((t) => (
          <Chip key={t} variant="add" onClick={() => addKid(t)}>
            + Add {MEMBER_LABEL[t].toLowerCase()} <small>{MEMBER_AGES[t]}</small>
          </Chip>
        ))}
      </div>
    </div>
  );
}
