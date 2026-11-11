export function SimulatedNote({ envName }: { envName: string }) {
  return (
    <p className="text-xs text-slate-500">
      Baselines are real 24-hour recordings from the MMASH dataset (Rossi et al., 2020). Mission days in {envName} are
      simulated from those baselines for demonstration and are not medical advice.
    </p>
  );
}
