import { LoginClient } from "@/app/login/LoginClient";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="min-h-screen">
      <div className="pt-24">
        <Suspense fallback={null}>
          <LoginClient />
        </Suspense>
      </div>
    </div>
  );
}

