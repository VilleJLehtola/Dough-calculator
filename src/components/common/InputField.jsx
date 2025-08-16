import React, { forwardRef } from "react";
import clsx from "clsx";
import { AlertCircle } from "lucide-react";

/**
 * Props:
 * - id, name, label, type, value, onChange, placeholder
 * - unit (string shown on the right, e.g. "%", "g")
 * - leftIcon, rightIcon (lucide icons)
 * - helpText, error (string)
 * - disabled, readOnly, required, min, max, step
 * - size: 'sm' | 'md' | 'lg'  (default 'md')
 * - className, inputClassName, containerClassName
 * - ...rest (passed to <input/>)
 */
const SIZES = {
  sm: { field: "h-9 text-sm px-3", unit: "right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5" },
  md: { field: "h-11 text-base px-3.5", unit: "right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5" },
  lg: { field: "h-12 text-base px-4", unit: "right-3 top-1/2 -translate-y-1/2 text-sm px-2.5 py-0.5" },
};

const InputField = forwardRef(function InputField(
  {
    id,
    name,
    label,
    type = "text",
    value,
    onChange,
    placeholder,
    unit,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    helpText,
    error,
    disabled,
    readOnly,
    required,
    min,
    max,
    step,
    size = "md",
    className,
    inputClassName,
    containerClassName,
    ...rest
  },
  ref
) {
  const sizeCls = SIZES[size] ?? SIZES.md;

  return (
    <div className={clsx("w-full", containerClassName)}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200"
        >
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}

      <div
        className={clsx(
          "relative rounded-2xl transition-[box-shadow,background-color,border-color]",
          "ring-1 ring-gray-300 bg-white",
          "dark:ring-gray-600 dark:bg-gray-700",
          "focus-within:ring-2 focus-within:ring-blue-500/40",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
          disabled && "opacity-60 pointer-events-none",
          error && "ring-red-400 focus-within:ring-red-400",
          className
        )}
      >
        {LeftIcon && (
          <LeftIcon
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70"
            aria-hidden="true"
          />
        )}

        <input
          id={id}
          name={name}
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={!!error}
          className={clsx(
            "block w-full rounded-2xl outline-none bg-transparent",
            // correct dark-mode text & placeholder colors
            "text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500",
            sizeCls.field,
            (LeftIcon) ? "pl-10" : "pl-4",
            (RightIcon || unit) ? "pr-14" : "pr-4",
            inputClassName
          )}
          {...rest}
        />

        {unit && (
          <span
            className={clsx(
              "absolute inline-flex items-center justify-center rounded-full",
              "bg-gray-100 text-gray-700 border border-gray-200",
              "dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500",
              sizeCls.unit
            )}
          >
            {unit}
          </span>
        )}

        {RightIcon && (
          <RightIcon
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70"
            aria-hidden="true"
          />
        )}
      </div>

      {error ? (
        <div className="mt-1.5 flex items-center gap-1.5 text-sm text-red-500">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      ) : helpText ? (
        <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{helpText}</div>
      ) : null}
    </div>
  );
});

export default InputField;
