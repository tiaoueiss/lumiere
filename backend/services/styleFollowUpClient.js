const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

function compactAnalysis(analysis) {
  return {
    undertone: analysis?.undertone && {
      result: analysis.undertone.result,
      confidence: analysis.undertone.confidence,
      details: analysis.undertone.details,
      indicators: analysis.undertone.indicators,
      scores: analysis.undertone.scores,
      season: analysis.undertone.season,
      subtype: analysis.undertone.subtype,
      skinDepth: analysis.undertone.skinDepth,
      contrastLevel: analysis.undertone.contrastLevel,
      makeup: analysis.undertone.makeup,
      colorsToAvoid: analysis.undertone.colorsToAvoid,
    },
    faceShape: analysis?.faceShape && {
      shape: analysis.faceShape.shape,
      confidence: analysis.faceShape.confidence,
      features: analysis.faceShape.features,
      recommendations: analysis.faceShape.recommendations,
    },
    jewelryMetal: analysis?.jewelryMetal && {
      best: analysis.jewelryMetal.best,
      alternatives: analysis.jewelryMetal.alternatives,
      reasoning: analysis.jewelryMetal.reasoning,
    },
    outfitColors: analysis?.outfitColors && {
      season: analysis.outfitColors.season,
      subtype: analysis.outfitColors.subtype,
      bestColors: analysis.outfitColors.bestColors,
      accentColors: analysis.outfitColors.accentColors,
      neutrals: analysis.outfitColors.neutrals,
      colorsToAvoid: analysis.outfitColors.colorsToAvoid,
      summary: analysis.outfitColors.summary,
    },
    hairColor: analysis?.hairColor && {
      currentHair: analysis.hairColor.currentHair,
      category: analysis.hairColor.category,
      recommended: analysis.hairColor.recommended,
      avoid: analysis.hairColor.avoid,
      seasonalNotes: analysis.hairColor.seasonalNotes,
    },
    skinDepth: analysis?.skinDepth,
    contrastLevel: analysis?.contrastLevel,
  };
}

function compactHistory(history = []) {
  return history
    .filter((message) => ['user', 'assistant'].includes(message?.role) && message?.content)
    .slice(-6)
    .map((message) => ({
      role: message.role,
      content: String(message.content).slice(0, 800),
    }));
}

function stripMarkdown(text) {
  return String(text || '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`{1,3}([^`]+)`{1,3}/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function askStyleFollowUp({ analysis, question, history }) {
  const styleContext = JSON.stringify(compactAnalysis(analysis), null, 2);
  const recentHistory = compactHistory(history);

  const response = await groq.chat.completions.create({
    model: MODEL,
    max_tokens: 600,
    temperature: 0.35,
    messages: [
      {
        role: 'system',
        content: [
          'You are Lumiere, a warm personal style assistant.',
          'Answer follow-up questions using only the provided style analysis context and recent chat history.',
          'Do not re-analyze the user image and do not claim to see the user.',
          'Only answer style-related questions. If a question is unrelated to style, fashion, beauty, colors, hair, makeup, jewelry, or occasions, politely redirect them back to style questions.',
          'If the question asks for something not supported by the analysis, say what can be inferred and what cannot.',
          'Avoid medical, dermatological, or identity claims. Keep advice practical, kind, and confidence-building.',
          'Use plain text only. Do not use Markdown, asterisks, bullet symbols, numbered lists, headings, or code formatting.',
          'Use concise paragraphs. Recommend colors, metals, hair shades, outfits, or jewelry when relevant.',
        ].join(' '),
      },
      {
        role: 'user',
        content: `Style analysis context:\n${styleContext}`,
      },
      ...recentHistory,
      {
        role: 'user',
        content: String(question),
      },
    ],
  });

  const answer = response.choices[0]?.message?.content?.trim();
  return stripMarkdown(answer) || 'I could not generate a follow-up answer. Please try again.';
}

module.exports = { askStyleFollowUp };
