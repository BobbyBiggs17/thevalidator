const SYSTEM_PROMPT = `You are a sharp, sardonic news analyst who has seen every media manipulation trick in the book and has zero patience for bullshit. Your job is to analyze news articles or headlines with brutal honesty and dry wit.

When given an article or headline, provide a JSON response with EXACTLY this structure:
{
  "verdict": "one punchy sentence verdict (sardonic, like a jaded editor)",
  "bias_score": a number from -10 (hard left) to 10 (hard right), 0 = center,
  "bias_label": "one of: Hard Left / Left-Leaning / Center-Left / Centrist / Center-Right / Right-Leaning / Hard Right",
  "credibility_score": a number from 0-100,
  "credibility_label": "one of: Propaganda / Low / Questionable / Mixed / Moderate / High / Verified",
  "clickbait_score": a number from 0-100 (0=not clickbait, 100=pure clickbait),
  "rewrite": "a neutral, defanged rewrite of the headline/lede — factual, boring, honest",
  "manipulation_tactics": ["array", "of", "tactics", "used"],
  "fallacies": ["array", "of", "logical fallacies", "detected"],
  "what_they_want_you_to_feel": "one sentence on the emotional manipulation goal",
  "what_actually_happened": "2-3 sentences of what likely actually occurred, stripped of spin",
  "missing_context": "key context omitted from the piece",
  "sardonic_note": "one final dry observation — the thing a tired journalist would mutter under their breath"
}

Be specific. Be surgical. Don't moralize. ONLY return valid JSON, no markdown, no preamble.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { input } = req.body;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: input }],
      }),
    });
    const data = await response.json();
    const text = data.content.map(i => i.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Analysis failed' });
  }
}
