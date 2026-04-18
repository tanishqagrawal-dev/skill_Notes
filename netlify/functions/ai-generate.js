const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { subject, type, syllabus } = JSON.parse(event.body);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "GEMINI_API_KEY is not configured in Netlify settings." })
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const isMST = type.includes('MST');
    
    let structureInstructions = "";
    if (isMST) {
        structureInstructions = `
        STRICT MST STRUCTURE (20 Marks Total):
        - NO MCQS.
        - Q1: i (2 marks), ii (3 marks), iii (5 marks) OR iv (5 marks). Total: 10.
        - Q2: i (2 marks), ii (3 marks), iii (5 marks) OR iv (5 marks). Total: 10.
        - SUM: 10 + 10 = 20 marks.
        - Sections: "Section A" for Q1, "Section B" for Q2.
        - DO NOT INCLUDE unit names or numbers in Section titles.
        `;
    } else {
        structureInstructions = `
        STRICT END SEM STRUCTURE (60 Marks Total):
        - 5 Sections (Section A to E). 12 Marks per section.
        - Absolute numbering from Q1 to Q15 across all sections.
        - Each Section has exactly 3 questions:
          - First: 2 marks.
          - Second: 4 marks.
          - Third: "a" (6 marks) OR "b" (6 marks).
        - Example Section A: Q1 (2), Q2 (4), Q3 a (6) OR Q3 b (6).
        - Example Section B: Q4 (2), Q5 (4), Q6 a (6) OR Q6 b (6).
        - Total per section: 12. SUM: 12 * 5 = 60 marks.
        - DO NOT INCLUDE unit names or numbers in Section titles. Just use "Section A", "Section B", etc.
        `;
    }

    const prompt = `You are an expert exam paper setter for SKiL MATRiX. 
    Create a high-quality Model Question Paper for "${subject}" (${type}). 
    Syllabus Context (Use ONLY these units): ${syllabus || "Official university pattern"}.
    
    ${structureInstructions}
    
    Guidelines:
    1. If MST 1: Include only questions from Unit 1 and Unit 2.
    2. If MST 2: Include only questions from Unit 3 and Unit 4.
    3. If End Sem: Include questions from all 5 Units.
    4. EVERY sub-question and OR-question must include: marks, bl (01-04), co (01-05), po (1-12), pso (1-3).
    5. Structure the questions professionally as requested.
    
    Format: JSON only.
    Structure: {
        "university": "SKiL MATRiX",
        "examTitle": "${type} 2026",
        "subjectCode": "SKL-MOD",
        "subjectName": "${subject}",
        "sections": [
            {
                "title": "Section A",
                "questions": [
                    {
                        "id": "1",
                        "subQuestions": [
                            {"id": "i", "text": "...", "marks": "...", "bl": "01", "co": "01", "po": "1", "pso": "1"}
                        ],
                        "orQuestion": {"id": "...", "text": "...", "marks": "...", "bl": "02", "co": "01", "po": "1", "pso": "1"}
                    }
                ]
            }
        ]
    }`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

    const paper = JSON.parse(text);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paper)
    };

  } catch (error) {
    console.error("Netlify Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
