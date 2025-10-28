function parseAiOutput(aiItemJson) {
  try {
    const jsonString = aiItemJson.output.replace(/```json\n|```/g, '').trim();
    const parsed = JSON.parse(jsonString);
    // Retorna o primeiro item (ou vazio)
    return (parsed.extracted_data && parsed.extracted_data[0]) ? parsed.extracted_data[0] : {};
  } catch (e) {
    console.error("Falha ao parsear JSON da IA (Subpage):", e.message, aiItemJson.output);
    return {};
  }
}


const aiOutput = $json
const aiData = parseAiOutput(aiOutput);

const startData = $('GetPendingURL').item.json
const instructions = startData.instructions;

const scrapeData = $('Subpage Scrapper').item.json

const now = new Date().toISOString();

return {
  json: {
    url: scrapeData.url, 
    instructions: instructions, 
    status: scrapeData.success ? 'completed' : 'failed', 
    last_updated: now,
    error_notes: scrapeData.error_notes || '', 
    content: aiData.extracted_content || '' 
  }
};