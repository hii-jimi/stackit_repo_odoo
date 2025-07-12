import React, { useState } from 'react';

function TagInput({ tags, setTags }) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const newTag = input.trim();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setInput('');
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg p-2 flex flex-wrap gap-2">
      {tags.map((tag, idx) => (
        <div key={idx} className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full flex items-center space-x-2">
          <span>{tag}</span>
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="text-blue-600 hover:text-blue-900 font-bold"
            aria-label={`Remove tag ${tag}`}
          >
            &times;
          </button>
        </div>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add tag and press Enter"
        className="flex-grow p-1 outline-none"
      />
    </div>
  );
}

export default TagInput;
