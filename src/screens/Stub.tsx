// Temporary placeholder for screens delivered in later milestones.
// Each milestone replaces its stub with the real screen — none survive to M7.
import { Button, Card } from "../components/ui";
import { useUi } from "../store/ui";

export function Stub({ title }: { title: string }) {
  const { go } = useUi();
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-5 pb-28 pt-10">
      <Card className="p-6 text-center">
        <p className="text-3xl" aria-hidden="true">🚧</p>
        <h1 className="mt-2 text-xl font-bold">{title}</h1>
        <p className="mt-1 text-sm text-muted">Coming in a later build milestone.</p>
      </Card>
      <Button variant="ghost" onClick={() => go({ name: "home" })}>
        ← Home
      </Button>
    </div>
  );
}
