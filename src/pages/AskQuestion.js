import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { database } from '../firebase';
import { ref, push, serverTimestamp } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import TagInput from '../components/TagInput';

const modules = {
  toolbar: [
    [{ 'header': [1, 2, false] }],
    ['bold', 'italic', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'image'],
    [{ 'align': [] }],
    ['clean']
  ],
  clipboard: {
    matchVisual: false,
  }
};

const formats = [
  'header',
  'bold', 'italic', 'strike',
  'list', 'bullet',
  'link', 'image',
  'align'
];

function AskQuestion() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    if (tags.length === 0) {
      setError('At least one tag is required');
      return;
    }
    if (!currentUser) {
      setError('You must be logged in to ask a question');
      return;
    }

    const questionData = {
      title,
      description,
      tags,
      authorId: currentUser.uid,
      authorName: currentUser.email,
      createdAt: serverTimestamp(),
      answers: {},
      votes: 0,
      acceptedAnswerId: null,
    };

    try {
      const questionsRef = ref(database, 'questions');
      await push(questionsRef, questionData);
      alert('Question submitted successfully');
      navigate('/');
    } catch (error) {
      setError('Error submitting question: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 p-8 flex justify-center">
      <div className="max-w-3xl w-full bg-gradient-to-br from-purple-800 to-indigo-800 rounded-3xl shadow-xl p-8 animate-fadeIn">
        <h1 className="text-4xl font-extrabold text-white mb-6">Ask a New Question</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-lg font-medium text-pink-300 mb-2">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a short and descriptive title"
              className="w-full p-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-pink-500 transition duration-300 text-lg"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-lg font-medium text-pink-300 mb-2">Description</label>
            <ReactQuill
              id="description"
              value={description}
              onChange={setDescription}
              modules={modules}
              formats={formats}
              placeholder="Write a detailed description"
              className="bg-white rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="tags" className="block text-lg font-medium text-pink-300 mb-2">Tags</label>
            <TagInput tags={tags} setTags={setTags} />
          </div>
          {error && <p className="text-red-400 font-semibold">{error}</p>}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-full shadow-lg hover:from-pink-600 hover:to-purple-700 transition duration-300"
          >
            Submit Question
          </button>
        </form>
      </div>
    </div>
  );
}

export default AskQuestion;
