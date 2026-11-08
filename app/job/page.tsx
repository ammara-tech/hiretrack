"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import JobPage from "@/components/JobPage";

/*
  /job?id=… shows one job. The id is in the address after a "?" rather than in the path, so the
  app needs no server code for each job: everything comes from your saved jobs in the browser.
*/
function ByAddress() {
  const id = useSearchParams().get("id") ?? "";
  return <JobPage id={id} />;
}

export default function Job() {
  return (
    <Suspense fallback={null}>
      <ByAddress />
    </Suspense>
  );
}
