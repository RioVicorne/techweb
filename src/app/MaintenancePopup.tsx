"use client";

import { useCallback, useEffect, useState } from "react";

export function MaintenancePopup() {
  const [open, setOpen] = useState(true);

  const showPopup = useCallback(() => {
    setOpen(true);
  }, []);

  useEffect(() => {
    document.body.classList.add("maintenance-active");
    window.addEventListener("click", showPopup, true);
    window.addEventListener("keydown", showPopup, true);

    return () => {
      document.body.classList.remove("maintenance-active");
      window.removeEventListener("click", showPopup, true);
      window.removeEventListener("keydown", showPopup, true);
    };
  }, [showPopup]);

  if (!open) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="maintenance-popup fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950 px-4"
      role="dialog"
    >
      <div className="w-full max-w-lg rounded-[2rem] border border-white/20 bg-white p-8 text-center shadow-2xl shadow-black/30 sm:p-10">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">
          ⚠️
        </div>
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.35em] text-amber-600">
          Thông báo bảo trì
        </p>
        <h1 className="mb-4 text-3xl font-black text-slate-950 sm:text-4xl">
          Website đang tạm thời đóng
        </h1>
        <p className="text-base leading-7 text-slate-600 sm:text-lg">
          RioShop hiện đang bảo trì và nâng cấp hệ thống. Vui lòng quay lại sau.
        </p>
        <div className="mt-8 rounded-2xl bg-slate-100 px-5 py-4 text-sm font-semibold text-slate-700">
          Popup này sẽ luôn hiển thị trong thời gian bảo trì.
        </div>
      </div>
    </div>
  );
}
