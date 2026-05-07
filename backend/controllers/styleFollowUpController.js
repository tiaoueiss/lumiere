const { askStyleFollowUp } = require('../services/styleFollowUpClient');

const STYLE_RELEVANCE_TERMS = [
  'style', 'styled', 'styling', 'wear', 'outfit', 'outfits', 'clothes', 'clothing', 'dress',
  'dresses', 'shirt', 'top', 'tops', 'pants', 'jeans', 'skirt', 'suit', 'blazer', 'jacket',
  'wardrobe', 'palette', 'color', 'colors', 'colour', 'colours', 'shade', 'shades', 'tone',
  'undertone', 'season', 'autumn', 'winter', 'spring', 'summer', 'warm', 'cool', 'neutral',
  'gold', 'silver', 'metal', 'metals', 'jewelry', 'jewellery', 'necklace', 'necklaces',
  'earrings', 'bracelet', 'ring', 'rose gold', 'white gold', 'hair', 'blonde', 'brown',
  'brunette', 'black', 'red', 'copper', 'auburn', 'makeup', 'lipstick', 'blush', 'foundation',
  'contour', 'highlight', 'eyeshadow', 'face shape', 'neckline', 'necklines', 'capsule',
  'formal', 'casual', 'wedding', 'graduation', 'date', 'interview', 'work', 'evening',
  'event', 'occasion', 'match', 'matches', 'flatter', 'flatters', 'suit', 'suits', 'avoid',
  'recommend', 'recommendation', 'look', 'looks', 'aesthetic',
];

const OFF_TOPIC_BOUNDARY =
  'I can only answer follow-up questions about your style analysis, such as your colors, outfits, metals, hair shades, makeup, face shape, or jewelry. Try asking something like: "What should I wear to a wedding?" or "Can I wear silver?"';

function hasUsableAnalysis(analysis) {
  return Boolean(
    analysis &&
    typeof analysis === 'object' &&
    (analysis.undertone || analysis.faceShape || analysis.outfitColors || analysis.jewelryMetal || analysis.hairColor)
  );
}

function isStyleRelatedQuestion(question) {
  const normalized = question.toLowerCase();
  return STYLE_RELEVANCE_TERMS.some((term) => normalized.includes(term));
}

async function styleFollowUpHandler(req, res) {
  try {
    const { analysis, question, history } = req.body;
    const cleanQuestion = String(question || '').trim();

    if (!hasUsableAnalysis(analysis)) {
      return res.status(400).json({
        success: false,
        message: 'A style analysis result is required before asking follow-up questions.',
      });
    }

    if (cleanQuestion.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Please ask a longer follow-up question.',
      });
    }

    if (cleanQuestion.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Please keep follow-up questions under 500 characters.',
      });
    }

    if (!isStyleRelatedQuestion(cleanQuestion)) {
      return res.json({
        success: true,
        data: {
          answer: OFF_TOPIC_BOUNDARY,
          offTopic: true,
        },
      });
    }

    const answer = await askStyleFollowUp({
      analysis,
      question: cleanQuestion,
      history: Array.isArray(history) ? history : [],
    });

    return res.json({
      success: true,
      data: { answer },
    });
  } catch (err) {
    console.error('[style-follow-up] Error:', err.message || err);

    if (err.status === 401) {
      return res.status(500).json({
        success: false,
        message: 'AI API key is invalid or missing. Check your .env file.',
      });
    }

    if (err.status === 429) {
      return res.status(429).json({
        success: false,
        message: 'The AI service is rate limited right now. Please wait a moment and try again.',
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || 'Something went wrong while answering your follow-up question.',
    });
  }
}

module.exports = styleFollowUpHandler;
