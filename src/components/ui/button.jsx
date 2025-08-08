// src/components/ui/button.jsx
export const Button = ({ children, ...props }) => (
  <button className="px-4 py-2 rounded bg-blue-500 text-white" {...props}>
    {children}
  </button>
);
