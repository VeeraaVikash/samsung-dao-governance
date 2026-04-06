interface StepPillsProps {
  current: 1 | 2;
  done?: number[];
}

export function StepPills({ current, done = [] }: StepPillsProps) {
  return (
    <div className="flex justify-center gap-2 mb-6">
      {[1, 2].map((step) => (
        <div
          key={step}
          className={`w-10 h-1 rounded-sm ${
            done.includes(step)
              ? "bg-success"
              : step === current
              ? "bg-samsung-primary"
              : "bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}
