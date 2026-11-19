import { useState } from "react";
import { storage } from "@/core/storage";
import { Home } from "@/modules/home/Home";
import { clearWeek } from "@/modules/menu/weekPlanner";
import { OnboardingFlow } from "@/modules/onboarding/OnboardingFlow";
import { ProfileProvider, useProfile } from "@/modules/profile/ProfileContext";

function Router() {
  const { reset } = useProfile();
  const [onboarded, setOnboarded] = useState(() => storage.get("onboarded", false));

  if (!onboarded) {
    return (
      <OnboardingFlow
        onComplete={() => {
          storage.set("onboarded", true);
          setOnboarded(true);
        }}
      />
    );
  }
  return (
    <Home
      onRestart={() => {
        storage.set("onboarded", false);
        storage.remove("signals");
        clearWeek();
        reset();
        setOnboarded(false);
      }}
    />
  );
}

export default function App() {
  return (
    <ProfileProvider>
      <Router />
    </ProfileProvider>
  );
}
