import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { database } from '../firebase';
import { ref, get, update, push, serverTimestamp } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
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

function QuestionDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();

  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answerText, setAnswerText] = useState('');

  useEffect(() => {
    if (!id) return;
    const questionRef = ref(database, `questions/${id}`);
    get(questionRef).then(snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setQuestion({ id, ...data });
        setAnswers(data.answers || {});
      } else {
        setQuestion(null);
      }
      setLoading(false);
    });
  }, [id]);

  const handleVote = async (answerId, delta) => {
    if (!currentUser) {
      alert('Please log in to vote');
      return;
    }
    const answer = answers[answerId];
    if (!answer) return;

    if (answer.voters && answer.voters[currentUser.uid]) {
      alert('You have already voted on this answer');
      return;
    }

    const answerRef = ref(database, `questions/${id}/answers/${answerId}`);
    const updatedVotes = (answer.votes || 0) + delta;
    const updatedVoters = { ...(answer.voters || {}) };
    updatedVoters[currentUser.uid] = true;

    try {
      await update(answerRef, {
        votes: updatedVotes,
        voters: updatedVoters,
      });
      setAnswers(prev => ({
        ...prev,
        [answerId]: {
          ...answer,
          votes: updatedVotes,
          voters: updatedVoters,
        }
      }));
    } catch (err) {
      alert('Error updating vote: ' + err.message);
    }
  };

  const handleAccept = async (answerId) => {
    if (!currentUser || currentUser.uid !== question.authorId) {
      alert('Only question owner can accept an answer');
      return;
    }
    const questionRef = ref(database, `questions/${id}`);
    try {
      await update(questionRef, { acceptedAnswerId: answerId });
      setQuestion(prev => ({ ...prev, acceptedAnswerId: answerId }));
    } catch (err) {
      alert('Error accepting answer: ' + err.message);
    }
  };

  if (loading) {
    return <p className="p-4 animate-pulse text-center text-white">Loading question...</p>;
  }

  if (!question) {
    return <p className="p-4 text-center text-red-600">Question not found.</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-4xl mx-auto bg-gradient-to-br from-purple-800 to-indigo-800 rounded-3xl shadow-xl p-8 animate-fadeIn">
        <nav className="mb-6">
          <Link to="/" className="text-pink-300 hover:underline transition duration-300">
            {"< Back to Home"}
          </Link>
        </nav>
        <h1 className="text-5xl font-bold mb-6 text-white">{question.title}</h1>
        <div className="mb-8 text-pink-200" dangerouslySetInnerHTML={{ __html: question.description }} />
        <div className="mb-8">
          {question.tags && question.tags.map((tag, idx) => (
            <span key={idx} className="inline-block bg-pink-600 bg-opacity-30 text-pink-300 px-3 py-1 rounded-full mr-2 text-sm">
              {tag}
            </span>
          ))}
        </div>
        <h2 className="text-3xl font-semibold mb-6 text-white">Answers</h2>
        {Object.keys(answers).length === 0 && <p className="text-pink-300">No answers yet.</p>}
        <ul>
          {Object.entries(answers).map(([answerId, answer]) => (
            <li key={answerId} className={`mb-6 p-6 rounded-2xl shadow-lg transition duration-300 ${question.acceptedAnswerId === answerId ? 'border-4 border-green-500 bg-green-50' : 'bg-white border border-gray-300'}`}>
              <div dangerouslySetInnerHTML={{ __html: answer.content }} />
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">By: {answer.authorName}</div>
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => handleVote(answerId, 1)}
                    className="text-green-600 hover:text-green-800"
                    title="Upvote"
                  >
                    ▲ {answer.votes || 0}
                  </button>
                  <button
                    onClick={() => handleVote(answerId, -1)}
                    className="text-red-600 hover:text-red-800"
                    title="Downvote"
                  >
                    ▼
                  </button>
                  {currentUser && currentUser.uid === question.authorId && question.acceptedAnswerId !== answerId && (
                    <button
                      onClick={() => handleAccept(answerId)}
                      className="text-blue-600 hover:underline"
                    >
                      Mark as Accepted
                    </button>
                  )}
                  {question.acceptedAnswerId === answerId && (
                    <span className="text-green-700 font-semibold">Accepted Answer</span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {currentUser ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!answerText.trim()) {
                alert('Answer cannot be empty');
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
                setAnswerText('');
                const questionRef = ref(database, `questions/${id}`);
                const snapshot = await get(questionRef);
                if (snapshot.exists()) {
                  const data = snapshot.val();
                  setAnswers(data.answers || {});
                }
              } catch (error) {
                alert('Error submitting answer: ' + error.message);
              }
            }}
            className="mt-8"
          >
            <label htmlFor="answer" className="block text-lg font-medium text-pink-300 mb-2">
              Write Your Answer
            </label>
            <ReactQuill
              id="answer"
              value={answerText}
              onChange={setAnswerText}
              modules={modules}
              formats={formats}
              placeholder="Write your answer here..."
              className="mb-6 bg-white rounded-lg"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full shadow-lg hover:from-pink-600 hover:to-purple-700 transition duration-300"
            >
              Submit Your Answer
            </button>
          </form>
        ) : (
          <p className="mt-8 text-center text-pink-300">Please log in to submit an answer.</p>
        )}
      </div>
    </div>
  );
}

export default QuestionDetail;
