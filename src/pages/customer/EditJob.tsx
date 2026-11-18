import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { JobForm } from "../../components/JobForm";
import { LoadError, Loading } from "../../components/JobParts";
import { Dual } from "../../components/Text";
import { api } from "../../lib/api";
import { type District, isOfferedCategory, type Job, toLocalInput } from "../../lib/jobs";
import { useJob, useJobsKey } from "../../lib/useJobs";
import type { JobValues } from "../../lib/validation";
import { toJobPayload } from "./PostJob";

export function EditJob() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const jobsKey = useJobsKey();
  const job = useJob(id);

  const save = useMutation({
    mutationFn: (values: JobValues) => api<{ job: Job }>(`/jobs/${id}`, "PUT", toJobPayload(values)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: jobsKey });
      navigate(`/customer/jobs/${id}`, { replace: true, state: { notice: "jobSaved" } });
    },
  });

  if (job.isPending) return <Loading />;
  if (job.isError) return <LoadError error={job.error} onRetry={() => void job.refetch()} />;
  if (job.data.status !== "OPEN") return <Navigate to={`/customer/jobs/${id}`} replace />;

  const { category, description, district, sector, landmark, startsAt, durationHours, wageRwf } = job.data;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-extrabold">
        <Dual k="editJobTitle" />
      </h1>
      <JobForm
        initial={{
          // A category no longer on offer stays unselected, so the first step asks for a new one.
          category: isOfferedCategory(category) ? category : undefined,
          description,
          district: district as District,
          sector,
          landmark,
          startsAt: toLocalInput(startsAt),
          durationHours,
          wageRwf,
        }}
        submitLabel="saveChanges"
        busy={save.isPending}
        error={save.error}
        onSubmit={(values) => save.mutate(values)}
      />
    </div>
  );
}
