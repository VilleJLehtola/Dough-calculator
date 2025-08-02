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
            backgroundColor: '#374151', // Tailwind gray-700
            borderColor: '#4B5563',     // Tailwind gray-600
            color: '#fff'
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: '#1f2937', // Tailwind gray-800
            color: '#fff'
          }),
          multiValue: (base) => ({
            ...base,
            backgroundColor: '#2563eb', // Tailwind blue-600
            color: '#fff'
          }),
          multiValueLabel: (base) => ({
            ...base,
            color: '#fff'
          }),
          multiValueRemove: (base) => ({
            ...base,
            color: '#fff',
            ':hover': {
              backgroundColor: '#1d4ed8', // Tailwind blue-700
              color: '#fff'
            }
          }),
          placeholder: (base) => ({
            ...base,
            color: '#9CA3AF' // Tailwind gray-400
          }),
          input: (base) => ({
            ...base,
            color: '#fff'
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
