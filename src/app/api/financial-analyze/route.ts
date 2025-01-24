// app/api/financial-analyze/route.ts
import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { OpenAIError, Transaction} from '@/lib/types'


// Initialize OpenAI outside the handler to reuse the instance
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `
Analyze the uploaded transaction data to generate 3-5 high-impact and difficult-to-discover financial insights. Focus on discovering significant patterns or suggestions that may not be immediately obvious.

# Steps

1. **Data Analysis**: Examine the uploaded transaction data thoroughly. Look for trends, outliers, and patterns that are not immediately evident.
2. **Pattern Recognition**: Identify high-impact financial insights by recognizing patterns that could suggest opportunities for financial improvement or flagging areas of concern.
3. **Insight Development**: Translate these patterns into meaningful insights that could have significant financial implications.
4. **Recommendation Crafting**: Based on each insight, create actionable recommendations for improvement.

# Output Format
Keep each insight concise, ideally 2-3 sentences.
Use clear, jargon-free language.
Respond ONLY with the insights and a reccomendation, no commentary.
# Format example:

**Behavioral Patterns**:  Frequent purchases from Tompkins Square Bagels, occurring nearly weekly, indicate a habitual preference
    **Recommendation**: Consider a loyalty program or subscription service for potential savings and additional perks.
    
# Notes

- Ensure that the insights are actionable and based on accurate analysis.
- Provide recommendations that are achievable and practical for implementation.
- Maintain clarity and succinctness in both insights and recommendations.
`;

export async function POST(req: Request) {
    try {
      const body = await req.json() as { transactions: Transaction[] };
      const { transactions } = body;
  
      if (!transactions) {
        return NextResponse.json(
          { error: "No transaction data provided" },
          { status: 400 }
        );
      }
  
      const transactionsString = JSON.stringify(transactions);
      console.log("Processing transactions:", transactionsString);
  
      // Call OpenAI API
      const chatResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: transactionsString,
              },
            ],
          },
        ],
      });
  
      // Add null checks and provide default value
      const chatReply = chatResponse.choices[0]?.message?.content?.trim() ?? '';
      if (!chatReply) {
        throw new Error('No response content from OpenAI');
      }
  
      console.log("AI Response:", chatReply);
  
      // Return successful response
      return NextResponse.json(
        { response: chatReply },
        {
          status: 200,
          headers: {
            "Access-Control-Allow-Methods": "POST",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }
      );
    } catch (error: unknown) {
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
