"use client";

import { useState } from "react";
import { PlusIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { UpgradePrompt } from "@/features/billing/components/UpgradePrompt";
import type { PaidPlanKey } from "@/features/billing/plans";

type NewProjectButtonProps = {
  /** The plan allows no more active projects: the button opens the upgrade pop-up (12). */
  limitReached: boolean;
  planIds: Record<PaidPlanKey, string | null>;
};

/** "+ New project": new projects start from a client invite, unless the plan's project limit is reached. */
export function NewProjectButton({ limitReached, planIds }: NewProjectButtonProps) {
  const [upgrade, setUpgrade] = useState(false);

  if (!limitReached) {
    return (
      <Button href="/clients" icon={<PlusIcon />}>
        New project
      </Button>
    );
  }
  return (
    <>
      <Button icon={<PlusIcon />} onClick={() => setUpgrade(true)}>
        New project
      </Button>
      <UpgradePrompt open={upgrade} onClose={() => setUpgrade(false)} planIds={planIds} />
    </>
  );
}
