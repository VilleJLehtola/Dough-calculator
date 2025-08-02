// TitleAndTags.jsx

import CreatableSelect from 'react-select/creatable';

export function TitleAndTags({
  title,
  setTitle,
  description,
  setDescription,
  selectedTags,
  setSelectedTags,
  tagOptions
}) {
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="Reseptin nimi"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        required
      />
      <input
        type="text"
        placeholder="Kuvaus"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
      />
      <label className="block mb-1">Tagit</label>
      <CreatableSelect
        isMulti
        options={tagOptions}
        value={selectedTags}
        onChange={(selected) => setSelectedTags(selected || [])}
        className="text-black dark:text-white"
        classNamePrefix="react-select"
        placeholder="Valitse tai kirjoita tagit..."
        styles={{
          control: (base, state) => ({
            ...base,
            backgroundColor: isDarkMode ? '#374151' : '#ffffff',
            borderColor: isDarkMode ? '#4B5563' : '#d1d5db',
            color: isDarkMode ? '#ffffff' : '#000000'
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#000000'
          }),
          multiValue: (base) => ({
            ...base,
            backgroundColor: isDarkMode ? '#2563eb' : '#dbeafe',
            color: isDarkMode ? '#ffffff' : '#1e3a8a'
          }),
          multiValueLabel: (base) => ({
            ...base,
            color: isDarkMode ? '#ffffff' : '#1e3a8a'
          }),
          multiValueRemove: (base) => ({
            ...base,
            color: isDarkMode ? '#ffffff' : '#1e3a8a',
            ':hover': {
              backgroundColor: isDarkMode ? '#1d4ed8' : '#93c5fd',
              color: '#ffffff'
            }
          }),
          placeholder: (base) => ({
            ...base,
            color: isDarkMode ? '#9CA3AF' : '#6B7280'
          }),
          input: (base) => ({
            ...base,
            color: isDarkMode ? '#ffffff' : '#000000'
          })
        }}
      />
      <div className="flex flex-wrap gap-2 mt-2">
        {selectedTags.map((tag) => (
          <span
            key={tag.value}
            className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm dark:bg-blue-900 dark:text-white"
          >
            {tag.label}
          </span>
        ))}
      </div>
    </div>
  );
}
