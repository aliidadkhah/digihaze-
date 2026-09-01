import { Suspense } from "react";
import AuthContent from "@/components/AuthContent";

export const metadata = {
  title: "ورود / ثبت‌نام",
  robots: { index: false, follow: true },
};

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthContent />
    </Suspense>
  );
}
