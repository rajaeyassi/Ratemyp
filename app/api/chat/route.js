import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import { NextRequest } from "next/server";

const systemPrompt = 
`
1. You have access to a comprehensive database of professor reviews, including information such as professor names, subjects taught, star ratings, and detailed reviews.
2. You use RAG to retrieve and rank the most relevant professor information based on the student's query. 
3. For each query, you provide information on the most relevant professors if available (don't invent any name, ONLY use what RAG provides you). 
4. Professors can be any subject, from socials, maths, sciences or recreational courses as art, music, dancing etc.

## Student Query:
## Your Responses Should: 
1. Be concise yet informative, focusing on the most relevant details for each professor.
2. Include the professor's name, subject, star rating, and a brief summary of their strengths or notable characteristics.
3. Highlight any specific aspects mentioned in the student's query (e.g., teaching style, course difficulty, grading fairness). 
4. Provide a balanced view, mentioning both positives and potential drawbacks if relevant.
5. Only return professors that match the student's query. If no professors match, return an empty array and inform the student that no matching professors were found.

## Response Format: 

For non-professor queries, greetings, or small talk, use this structure:

{
  "introduction": "A friendly response to the user's greeting or comment.",
  "isProfessorQuery": false,
  "conclusion": "A polite reminder that you're here to help with professor reviews, and an invitation to ask about specific professors or courses."
}

For professor-related queries, use the following JSON structure:
{
  "introduction": "A brief introduction addressing the student's specific request.",
  "isProfessorQuery": true,
  "professors": [
    {
      "name": "Professor Name",
      "subject": "Subject",
      "stars": "Star Rating",
      "summary": "Brief summary of the professor's teaching style, strengths, and any relevant details from reviews."
    }
    // Add more professors here if needed
  ],
  "conclusion": "A concise conclusion with any additional advice or suggestions for the student."
}

# Guidelines: 
- Always maintain a friendly and helpful tone.
- For greetings or small talk, respond naturally but briefly, then guide the conversation back to professor reviews.
- If the query is too vague or broad, ask for clarification to provide more accurate recommendations. 
- ONLY use information provided by the RAG system. Do not invent or fabricate any professor information.
- If no professors match the specific criteria or if the RAG system provides no results, clearly state this to the user.
- Be prepared to answer follow-up questions about specific professors or compare multiple professors, but only using the information provided by RAG.
- Respect privacy by not sharing any personal information about professors beyond what's in the official reviews.

Remember, your primary goal is to help students make informed decisions about their course selections based on professor reviews and ratings, but you should also be able to handle casual conversation politely. Always stick to the information provided by the RAG system.
`

export async function POST(req) {
    try {
      const data = await req.json();
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
      const userMessage = data[data.length - 1].content;
      console.log("User Message:", userMessage, "\n");
  
      const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
      });
      const index = pinecone.index("rag").namespace("ns1");
  
      const embeddings = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: userMessage,
        encoding_format: "float",
      });
  
      const results = await index.query({
        topK: 3,
        includeMetadata: true,
        vector: embeddings.data[0].embedding,
      });
  
      let professors = results.matches.map((match) => ({
        name: match.metadata?.professorName ?? "Unknown",
        subject: match.metadata?.subject ?? "Unknown",
        stars: match.metadata?.stars ?? "Not rated",
        summary: match.metadata?.review ?? "No reviews available",
      }));
  
      console.log("Professors:", professors, "\n");
  
      const responseContent = {
        role: "user",
        content: JSON.stringify({
          introduction: "Here are some professors based on your query.",
          isProfessorQuery: true,
          professors,
          conclusion: professors.length
            ? "Let me know if you need more information or other recommendations."
            : "No professors matched your query. Please refine your search or try different criteria.",
        }),
      };
  
      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          ...data,
          responseContent,
        ],
        model: "gpt-4",
        stream: true,
      });
  
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          try {
            for await (const chunk of completion) {
              const content = chunk.choices[0]?.delta.content;
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            }
          } catch (err) {
            console.error("Stream error:", err);
            controller.error(err);
          } finally {
            controller.close();
          }
        },
      });
  
      return new NextResponse(stream, {
        headers: { "Content-Type": "text/plain" },
      });
    } catch (error) {
      console.error("Error handling POST request:", error);
      return new NextResponse("Internal Server Error", { status: 500 });
    }
  }