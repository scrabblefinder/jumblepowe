import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from './utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let targetDate: Date;
    
    // Parse the request body for a specific date
    if (req.method === 'POST') {
      const { date } = await req.json();
      if (date) {
        targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
          throw new Error('Invalid date format');
        }
      } else {
        targetDate = new Date();
      }
    } else {
      targetDate = new Date();
    }

    console.log('Fetching puzzle for date:', targetDate.toISOString());

    // Format date for the API request (YYYYMMDD)
    const formattedDate = targetDate.toISOString().slice(0, 10).replace(/-/g, '');
    const timestamp = Date.now();
    
    // Construct the URL with the formatted date
    const url = `https://gamedata.services.amuniversal.com/c/uupuz/l/U2FsdGVkX1+b5Y+X7zaEFHSWJrCGS0ZTfgh8ArjtJXrQId7t4Y1oVKwUDKd4WyEo%0A/g/tmjms/d/${formattedDate}/data.json?callback=jsonCallback&_=${timestamp}`;
    
    console.log('Fetching from URL:', url);

    const response = await fetch(url, {
      headers: {
        'Accept': '*/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.uclick.com/',
        'Origin': 'https://www.uclick.com',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    console.log('Received response:', text.slice(0, 100) + '...');

    // Remove the jsonCallback wrapper and parse the JSON
    const jsonData = JSON.parse(text.replace(/^\/\*\*\/jsonCallback\((.*)\)$/, '$1'));
    console.log('Parsed JSON data:', jsonData);
    
    // Connect to Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Format the date for database insertion (YYYY-MM-DD)
    const dbDate = targetDate.toISOString().slice(0, 10);

    // Check if puzzle already exists
    const { data: existingPuzzle } = await supabase
      .from('daily_puzzles')
      .select()
      .eq('date', dbDate)
      .maybeSingle();

    if (existingPuzzle) {
      return new Response(
        JSON.stringify({ message: `Puzzle for ${dbDate} already exists` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert new puzzle
    const { data: puzzle, error: puzzleError } = await supabase
      .from('daily_puzzles')
      .insert({
        date: dbDate,
        caption: jsonData.Caption.v1,
        image_url: jsonData.Image,
        solution: jsonData.Solution.s1,
        final_jumble: jsonData.Solution?.j1 || null,
        final_jumble_answer: jsonData.Solution?.s1 || null
      })
      .select()
      .single();

    if (puzzleError) throw puzzleError;

    // Insert jumble words
    const jumbleWords = [
      {
        puzzle_id: puzzle.id,
        jumbled_word: jsonData.Clues.c1,
        answer: jsonData.Clues.a1
      },
      {
        puzzle_id: puzzle.id,
        jumbled_word: jsonData.Clues.c2,
        answer: jsonData.Clues.a2
      },
      {
        puzzle_id: puzzle.id,
        jumbled_word: jsonData.Clues.c3,
        answer: jsonData.Clues.a3
      },
      {
        puzzle_id: puzzle.id,
        jumbled_word: jsonData.Clues.c4,
        answer: jsonData.Clues.a4
      }
    ];

    const { error: wordsError } = await supabase
      .from('jumble_words')
      .insert(jumbleWords);

    if (wordsError) throw wordsError;

    return new Response(
      JSON.stringify({ message: 'Puzzle added successfully', puzzle }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: `Failed to fetch puzzle: ${error.message}` }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});