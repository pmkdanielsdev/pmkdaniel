"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, X } from "lucide-react";

export interface PopoverSelectOption<T extends string = string> {
  value: T;
  label: string;
  badgeClassName?: string;
}

interface PopoverSelectProps<T extends string = string> {
  value: T;
  options: PopoverSelectOption<T>[];
  onChange: (value: T) => void;
  title: string;
  placeholder?: string;
  triggerClassName?: string;
  menuWidthClassName?: string;
  align?: "left" | "right";
  disabled?: boolean;
}

export function PopoverSelect<T extends string = string>({
  value,
  options,
  onChange,
  title,
  placeholder = "Pilih opsi...",
  triggerClassName = "",
  menuWidthClassName = "w-64",
  align = "left",
  disabled = false,
}: PopoverSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; openUp: boolean } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useLayoutEffect(() => {
    if (!open) return;
    const btn = triggerRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const estimatedHeight = Math.min(300, options.length * 36 + 56);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < estimatedHeight && rect.top > estimatedHeight;
    const top = openUp ? Math.max(12, rect.top - 8) : Math.min(window.innerHeight - 12, rect.bottom + 8);
    const left = align === "right" ? rect.right : rect.left;
    setCoords({ top, left, width: rect.width, openUp });
  }, [open, options.length, align]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    const handleScrollOrResize = (e: Event) => {
      if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open]);

  const menuNode =
    open && coords && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            data-lenis-prevent="true"
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              minWidth: Math.max(coords.width, 224),
              transform: `${align === "right" ? "translateX(-100%)" : "translateX(0)"} ${
                coords.openUp ? "translateY(-100%)" : "translateY(0)"
              }`,
            }}
            className={`z-[70] ${menuWidthClassName} max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-xl border border-gray-200 p-3 flex flex-col gap-2 animate-scaleUp`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-bold text-slate-800 truncate">{title}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md cursor-pointer"
                aria-label="Tutup dropdown"
              >
                <X size={14} />
              </button>
            </div>

            <div
              data-lenis-prevent="true"
              className="max-h-60 overflow-y-auto overscroll-contain flex flex-col gap-1 pr-0.5"
            >
              {options.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">Tidak ada pilihan</div>
              ) : (
                options.map((opt) => {
                  const isActive = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 text-left text-xs px-2.5 py-2 rounded-xl transition-colors cursor-pointer ${
                        isActive
                          ? "bg-primary/10 text-primary font-bold"
                          : "text-slate-700 hover:bg-slate-50 font-medium"
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        {opt.badgeClassName ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${opt.badgeClassName}`}
                          >
                            {opt.label}
                          </span>
                        ) : (
                          <span className="truncate">{opt.label}</span>
                        )}
                      </span>
                      {isActive && <Check size={14} className="text-primary shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex items-center justify-between gap-2 transition-all cursor-pointer disabled:opacity-50 ${triggerClassName}`}
        aria-expanded={open}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={13}
          className={`shrink-0 opacity-70 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {menuNode}
    </>
  );
}
