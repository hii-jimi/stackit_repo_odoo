import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { database } from '../../firebase';
import { ref, push, serverTimestamp, get } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const modules = {
  toolbar: [
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
  'bold', 'italic', 'strike',
  'list', 'bullet',
  'link', 'image',
  'align'
];

function AnswerQuestion() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const questionRef = ref(database, `questions/${id}`);
    get(questionRef).then(snapshot => {
      if (snapshot.exists()) {
        setQuestion({ id, ...snapshot.val() });
      } else {
        setQuestion(null);
      }
      setLoading(false);
    });
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!answerText.trim()) {
      setError('Answer cannot be empty');
      return;
    }
    if (!currentUser) {
      setError('You must be logged in to submit an answer');
      return;
    }

    const answersRef = ref(database, `questions/${id}/answers`);
    const answerData = {
      content: answerText,
      authorId: currentUser.uid,
      authorName: currentUser.email,
      createdAt: serverTimestamp(),
      votes: 0,
      voters: {},
      comments: {},
    };

    try {
      await push(answersRef, answerData);
      alert('Answer submitted successfully');
      navigate(`/admin/question/${id}`);
    } catch (error) {
      setError('Error submitting answer: ' + error.message);
    }
  };

  if (loading) {
    return <p className="p-4 animate-pulse text-center text-white">Loading question...</p>;
  }

  if (!question) {
    return <p className="p-4 text-center text-red-600">Question not found.</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 p-8 flex justify-center">
      <div className="max-w-3xl w-full bg-gradient-to-br from-purple-800 to-indigo-800 rounded-3xl shadow-xl p-8 animate-fadeIn">
        <nav className="mb-6">
          <Link to={`/admin/question/${id}`} className="text-pink-300 hover:underline transition duration-300">
            {"< Back to question"}
          </Link>
        </nav>
        <h1 className="text-4xl font-extrabold text-white mb-8">{question.title}</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <label htmlFor="answer" className="block text-lg font-medium text-pink-300">
            Write Your Answer
          </label>
          <ReactQuill
            id="answer"
            value={answerText}
            onChange={setAnswerText}
            modules={modules}
            formats={formats}
            placeholder="Write your answer here..."
            className="bg-white rounded-lg"
          />
          {error && <p className="text-red-400 font-semibold">{error}</p>}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-full shadow-lg hover:from-pink-600 hover:to-purple-700 transition duration-300"
          >
            Submit Your Answer
          </button>
        </form>
        {!currentUser && (
          <div className="mt-6 p-4 bg-pink-900 bg-opacity-30 rounded-lg text-center text-pink-300 font-medium shadow animate-pulse">
            Please log in to submit an answer.
          </div>
        )}
      </div>
    </div>
  );
}

export default AnswerQuestion;
