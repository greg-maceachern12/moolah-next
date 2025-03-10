// app/api/financial-analyze/route.ts
import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { OpenAIError, Transaction } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `
You are a financial analyst AI. Analyze the transaction data and provide actionable insights.

Focus on:
- Spending patterns and trends
- Opportunities to save money
- Financial habits and behaviors
- Unusual or concerning transactions
- Recommendations for financial improvement

Provide 3-5 meaningful insights that can help the user improve their financial situation.

Your response must follow this JSON structure exactly:
{
  "insights": [
    {
      "title": "Clear, concise title of the insight",
      "category": "one of: spending_pattern, savings_opportunity, risk_alert, behavioral_pattern, optimization",
      "description": "Detailed explanation of the insight",
      "recommendation": "Specific action the user can take"
    }
  ]
}
`;

export async function POST(req: Request) {
  try {
    const body = await req.json() as { transactions: Transaction[] };
    const { transactions } = body;

    if (!transactions || transactions.length === 0) {
      return NextResponse.json(
        { error: "No transaction data provided" },
        { status: 400 }
      );
    }

    // Find date range for context
    const dates = transactions.map(t => new Date(t.date));
    const startDate = new Date(Math.min(...dates.map(d => d.getTime()))).toISOString().split('T')[0];
    const endDate = new Date(Math.max(...dates.map(d => d.getTime()))).toISOString().split('T')[0];

    // Call OpenAI API with structured output
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: JSON.stringify({
            transactions,
            date_range: { start_date: startDate, end_date: endDate }
          })
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const chatReply = chatResponse.choices[0]?.message?.content;
    if (!chatReply) {
      throw new Error('No response content from OpenAI');
    }

    // Parse response and return
    const parsedResponse = JSON.parse(chatReply);
    return NextResponse.json(parsedResponse, {
      status: 200,
      headers: {
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error in financial analysis:", error);

    let errorMessage = "An error occurred while analyzing the transactions.";
    const err = error as OpenAIError;

    if (err.response) {
      errorMessage = `OpenAI API error: ${err.response.data.error.message}`;
    } else if (err.request) {
      errorMessage = "No response received from OpenAI API. Please try again later.";
    } else {
      errorMessage = `Error processing request: ${err.message}`;
    }

    return NextResponse.json(
      { error: errorMessage },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

// app/api/financial-analyze/route.ts - CORS options handler
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
