 export default function ToggleButton({
   active = false,
   className = '',
   ...props
 }) {
   return (

  <button
     aria-pressed={active}
       className={[
         'px-3 py-1.5 rounded-md text-sm border transition',
         active
           ? 'bg-blue-600 text-white border-blue-600'
           : 'border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200',
         className,
       ].join(' ')}
       {...props}
     />
   );
 }
