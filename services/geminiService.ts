
// Service for OpenRouter API (DeepSeek R1)
// Replaces the previous Google Gemini implementation

const API_KEY = "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";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Analyzes an image using DeepSeek R1 via OpenRouter.
 * @param base64Image The base64 string of the image (without prefix)
 * @param mimeType The mime type of the image
 */
export const analyzeReturnProof = async (base64Image: string, mimeType: string) => {
  if (!API_KEY) {
    console.warn("No API Key found. Returning mock data.");
    return {
      title: "Manual Entry Required",
      description: "API Key missing. Please add title and description manually."
    };
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "ReturnOS",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1:free",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "You are an AI assistant for a Return Service Management System. Analyze the attached image of a return proof. Identify the product (Title) and describe its condition/details (Description). \n\nOutput MUST be a raw JSON object with exactly two keys: 'title' and 'description'. \n\nIMPORTANT: If the image is blank, blurry, completely unclear, or contains no text/identifiable objects, you must output: \n{\"title\": \"Analysis Failed\", \"description\": \"no words or letters detected\"}\n\nDo not include markdown formatting like ```json in the final output."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouter API Error:", errorData);
      throw new Error(errorData.error?.message || "API Request failed");
    }

    const data = await response.json();
    let content = data.choices[0]?.message?.content || "";

    // DeepSeek R1 often includes reasoning inside <think> tags. We must strip them.
    content = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    
    // Remove potential markdown code block syntax
    content = content.replace(/```json/g, "").replace(/```/g, "").trim();

    // Find the JSON object in the string
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const jsonString = content.substring(jsonStart, jsonEnd + 1);
      return JSON.parse(jsonString) as { title: string; description: string };
    } else {
      // If no valid JSON is found, assume analysis failed or no text was found
      return {
        title: "Analysis Failed",
        description: "no words or letters detected"
      };
    }

  } catch (error) {
    console.error("Analysis Error:", error);
    // Fallback as requested by user logic
    return {
      title: "Analysis Failed",
      description: "no words or letters detected"
    };
  }
};
