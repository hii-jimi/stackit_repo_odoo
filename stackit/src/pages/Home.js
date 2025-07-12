import React, { useEffect, useState } from 'react';
import { database } from '../firebase';
import { ref, onValue, query, orderByChild, limitToFirst } from 'firebase/database';
import { Link, useNavigate } from 'react-router-dom';

function Home() {
  const [questions, setQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const questionsRef = ref(database, 'questions');
    const q = query(questionsRef, orderByChild('createdAt'), limitToFirst(20));
    const unsubscribe = onValue(q, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const questionsArray = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));
        setQuestions(questionsArray.reverse());
      } else {
        setQuestions([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredQuestions = questions.filter(q =>
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-extrabold text-white tracking-wide animate-fadeIn">StackIt</h1>
          <button
            onClick={() => navigate('/ask')}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg hover:from-pink-600 hover:to-purple-700 transition duration-300 animate-fadeIn"
          >
            Ask New Question
          </button>
        </div>
        <div className="mb-8 flex space-x-4">
          <input
            type="text"
            placeholder="Search questions..."
            className="flex-grow rounded-lg px-5 py-4 focus:outline-none focus:ring-4 focus:ring-pink-500 focus:border-pink-500 transition duration-300 text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {loading ? (
          <p className="text-center text-white text-xl animate-pulse">Loading questions...</p>
        ) : filteredQuestions.length === 0 ? (
          <p className="text-center text-white text-xl">No questions found.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredQuestions.map((question) => (
              <li key={question.id} className="bg-gradient-to-br from-purple-800 to-indigo-800 rounded-3xl shadow-xl p-6 hover:shadow-2xl transition duration-300 animate-fadeIn">
                <Link to={`/question/${question.id}`} className="text-2xl font-bold text-white hover:underline">
                  {question.title}
                </Link>
                <p className="text-gray-300 mt-3" dangerouslySetInnerHTML={{ __html: question.description.substring(0, 150) + '...' }} />
                <div className="mt-4">
                  {question.tags.map((tag, idx) => (
                    <span key={idx} className="inline-block bg-pink-600 bg-opacity-30 text-pink-300 text-xs px-3 py-1 rounded-full mr-2">
                      {tag}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Home;
