
function parseAiOutput(aiItemJson) {
  try {
    const jsonString = aiItemJson.output.replace(/```json\n|```/g, '').trim();
    const parsed = JSON.parse(jsonString);

    return (parsed.extracted_data && parsed.extracted_data[0]) ? parsed.extracted_data[0] : {};
  } catch (e) {
    console.error("Falha ao parsear JSON da IA (Main):", e.message, aiItemJson.output);
    return {};
  }
}

const aiOutput = $input.first().json;
const aiData = parseAiOutput(aiOutput);

const startData = $node["GetPendingURL"].json;
const instructions = startData.instructions;

const mainPageScrapeData = $node["Merge"].json;
if (!mainPageScrapeData) {
    throw new Error("Não foi possível encontrar os dados de scrape da Página Principal no nó Merge_Main_Scrape.");
}
const page = mainPageScrapeData;


const now = new Date().toISOString();

return {
  json: {
    url: page.url,
    instructions: instructions,
    status: page.success ? 'completed' : 'failed',
    last_updated: now,
    error_notes: page.error_notes || '',
    extracted_content: aiData.extracted_content || ''
  }
};