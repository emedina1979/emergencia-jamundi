export function WizardProgress({ paso, total }: { paso: number; total: number }) {
  return (
    <div className="mb-4 flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${i < paso ? 'bg-alcaldia-600' : 'bg-gray-200'}`}
        />
      ))}
    </div>
  );
}
