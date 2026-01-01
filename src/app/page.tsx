import Timer from '@/components/app/timer/timer';

export default function Home() {
  return (
    <div className="container mx-auto flex max-w-2xl flex-col items-center justify-center gap-8 px-4 py-12">
      <Timer />
    </div>
  );
}
