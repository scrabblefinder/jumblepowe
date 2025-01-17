import { Link, useNavigate } from 'react-router-dom';
import { format, parse } from 'date-fns';
import { JumbleWord } from '@/integrations/supabase/types';

interface JumblePuzzleProps {
  date: string;
  dateUrl: string;
  words: JumbleWord[];
  caption: string;
  imageUrl: string;
  solution?: string;
  finalJumble?: string;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const JumblePuzzle = ({ 
  date, 
  dateUrl,
  words, 
  caption, 
  imageUrl, 
  solution, 
  finalJumble,
  isExpanded, 
  onToggle 
}: JumblePuzzleProps) => {
  const navigate = useNavigate();
  
  const createSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const countLetters = (word: string) => {
    return word.replace(/\s/g, '').length;
  };

  const handleCaptionClick = () => {
    const slug = createSlug(caption);
    navigate(`/clue/${slug}`);
  };

  const handleDateClick = () => {
    try {
      const parsedDate = parse(date, 'MMMM dd yyyy', new Date());
      const formattedDate = format(parsedDate, 'yyyyMMdd');
      navigate(`/daily-jumble/${formattedDate}`);
    } catch (error) {
      console.error('Error formatting date:', error);
    }
  };

  // Filter out the final jumble from regular words
  const regularWords = words.filter(word => word.id !== 'final-jumble');
  const finalJumbleWord = words.find(word => word.id === 'final-jumble') || {
    jumbled_word: finalJumble,
    answer: solution
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden mb-8">
      <div className="bg-[#0275d8] text-white p-4 text-xl flex justify-between items-center">
        <button 
          onClick={handleDateClick}
          className="hover:underline w-full text-left text-white"
        >
          Daily Jumble {date} Answers
        </button>
        {onToggle && (
          <button 
            onClick={onToggle} 
            className="text-2xl hover:opacity-80 transition-opacity focus:outline-none ml-2"
          >
            {isExpanded ? '-' : '+'}
          </button>
        )}
      </div>
      <div className={`${!isExpanded ? 'hidden' : ''}`}>
        <div className="p-4 space-y-4 border-x border-b">
          <div className="flex gap-8">
            <div className="w-3/4 space-y-4">
              {regularWords.map((word) => (
                <Link 
                  key={word.id}
                  to={`/jumble/${word.jumbled_word.toLowerCase()}`}
                  className="block bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-[#0275d8]">
                      {word.jumbled_word}
                    </span>
                    <span className="text-sm text-gray-500">
                      {countLetters(word.jumbled_word)} letters
                    </span>
                  </div>
                </Link>
              ))}
              {finalJumbleWord && finalJumbleWord.jumbled_word && (
                <Link 
                  to={`/jumble/${finalJumbleWord.jumbled_word.toLowerCase()}`}
                  className="block bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors mt-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-[#0275d8]">
                      {finalJumbleWord.jumbled_word}
                    </span>
                    <span className="text-sm text-blue-600 bg-white px-3 py-1 rounded-full">
                      {countLetters(finalJumbleWord.jumbled_word)} letters
                    </span>
                  </div>
                </Link>
              )}
            </div>
            <div className="w-1/4 flex flex-col items-center space-y-4">
              <div className="w-[74%]">
                <img 
                  src={imageUrl}
                  alt="Daily Jumble Puzzle" 
                  className="w-full rounded-lg shadow-lg"
                />
              </div>
              <div className="border-t pt-4 w-full">
                <button 
                  onClick={handleCaptionClick}
                  className="block text-[#0275d8] text-lg hover:underline text-left w-full"
                >
                  {caption}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JumblePuzzle;