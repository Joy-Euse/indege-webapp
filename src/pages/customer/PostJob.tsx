import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { JobForm } from "../../components/JobForm";
import { Dual } from "../../components/Text";
import { api } from "../../lib/api";
import { isOfferedCategory, type Job } from "../../lib/jobs";
import { useJobsKey } from "../../lib/useJobs";
import type { JobValues } from "../../lib/validation";

/** The form holds local time. The API stores an exact moment. */
export function toJobPayload(values: JobValues) {
  return { ...values, startsAt: new Date(values.startsAt).toISOString() };
}

export function PostJob() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const jobsKey = useJobsKey();
  const [params] = useSearchParams();
  const category = params.get("category");

  const post = useMutation({
    mutationFn: async (values: JobValues) => (await api<{ job: Job }>("/jobs", "POST", toJobPayload(values))).job,
    onSuccess: async (job) => {
      await queryClient.invalidateQueries({ queryKey: jobsKey });
      navigate(`/customer/jobs/${job.id}`, { replace: true, state: { notice: "jobPosted" } });
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-extrabold">
        <Dual k="postJob" />
      </h1>
      <JobForm
        initial={isOfferedCategory(category) ? { category } : undefined}
        submitLabel="postJobAction"
        busy={post.isPending}
        error={post.error}
        onSubmit={(values) => post.mutate(values)}
      />
    </div>
  );
}
