"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export type StyledSelectOption = {
  value: string;
  label: string;
};

type StyledSelectProps = {
  id?: string;
  value: string;
  options: StyledSelectOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
};

export function StyledSelect({ id, value, options, onChange, ariaLabel }: StyledSelectProps) {
  const generatedId = useId().replaceAll(":", "");
  const controlId = id || `select-${generatedId}`;
  const listboxId = `${controlId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selected = options[selectedIndex] || options[0];
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePress);
  }, [open]);

  useEffect(() => {
    if (!open) setActiveIndex(selectedIndex);
  }, [open, selectedIndex]);

  const activeOptionId = useMemo(
    () => `${listboxId}-option-${Math.max(0, activeIndex)}`,
    [activeIndex, listboxId],
  );

  const choose = (nextIndex: number) => {
    const nextOption = options[nextIndex];
    if (!nextOption) return;
    onChange(nextOption.value);
    setActiveIndex(nextIndex);
    setOpen(false);
  };

  const move = (step: number) => {
    if (!options.length) return;
    setActiveIndex((current) => (current + step + options.length) % options.length);
  };

  return (
    <div className={`styled-select ${open ? "is-open" : ""}`} ref={rootRef}>
      <button
        id={controlId}
        className="styled-select-trigger"
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open ? activeOptionId : undefined}
        onClick={() => {
          setActiveIndex(selectedIndex);
          setOpen((current) => !current);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) {
              setActiveIndex(selectedIndex);
              setOpen(true);
            } else {
              move(event.key === "ArrowDown" ? 1 : -1);
            }
          } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (open) choose(activeIndex);
            else setOpen(true);
          } else if (event.key === "Escape" && open) {
            event.preventDefault();
            setOpen(false);
          } else if (event.key === "Home" && open) {
            event.preventDefault();
            setActiveIndex(0);
          } else if (event.key === "End" && open) {
            event.preventDefault();
            setActiveIndex(options.length - 1);
          }
        }}
      >
        <span>{selected?.label || "Select"}</span>
        <i aria-hidden="true" />
      </button>

      {open ? (
        <div className="styled-select-menu" id={listboxId} role="listbox" aria-labelledby={controlId}>
          {options.map((option, index) => (
            <button
              className={`styled-select-option ${option.value === value ? "is-selected" : ""} ${index === activeIndex ? "is-active" : ""}`}
              id={`${listboxId}-option-${index}`}
              type="button"
              role="option"
              aria-selected={option.value === value}
              key={option.value}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(index)}
            >
              <span>{option.label}</span>
              {option.value === value ? <b aria-hidden="true">✓</b> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
