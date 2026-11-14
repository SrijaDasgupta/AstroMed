import Link from "next/link";
import { PhotoImportCard } from "@/components/astromed";
import { requireViewer } from "@/lib/session";

export default async function PhotoImportPage() {
  const viewer = await requireViewer();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-sky-400">Personalized</p>
        <h1 className="mt-1 text-2xl font-semibold">Photo import</h1>
        <p className="mt-1 max-w-3xl text-slate-400">
          Snap a reading instead of typing it. AstroMed reads the text and numbers in the photo right here on your device, then you check and correct them before anything is saved.
        </p>
      </div>

      <PhotoImportCard demo={viewer.kind === "demo"} />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
          <h2 className="font-medium text-white">What it can read</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong className="text-white">Dosimeter or radiation report:</strong> the total dose (mSv, µSv or Sv) and the exposure time. Saved to <Link href="/hazards" className="text-sky-300 hover:text-sky-200">My exposure</Link>.</li>
            <li><strong className="text-white">Sleep tracker screen:</strong> labelled bedtime and wake time with dates. Saved to the <Link href="/vitals" className="text-sky-300 hover:text-sky-200">Sleep orbit</Link>.</li>
            <li><strong className="text-white">Any other health photo,</strong> such as a blood pressure monitor, thermometer, scale or lab report: the text plus any readings it finds (like &ldquo;Blood pressure: 120/80 mmHg&rdquo;), saved in <Link href="/records" className="text-sky-300 hover:text-sky-200">My records</Link>{viewer.kind === "demo" ? " (the photo itself is kept only with an account)" : " with the photo"}.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
          <h2 className="font-medium text-white">Good to know</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>The photo is read on your device and isn&apos;t sent anywhere to be read. No AI and no key are needed.</li>
            <li>Reading text can mistake digits, especially on glare or small screens, so always compare with the photo before saving.</li>
            <li>It reads text, not pictures of the body. For a rash, wound or eye, report it in <Link href="/problems" className="text-sky-300 hover:text-sky-200">Problems &amp; advice</Link>, where you can add a photo and, with your own AI connected, have it analyzed.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
