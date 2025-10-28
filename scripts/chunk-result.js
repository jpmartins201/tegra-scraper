// Este código roda para CADA item (URL) do nó anterior
const item = $json;
const outputItems = [];


const chunks = item.content.split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0);

const totalChunks = chunks.length;

for (let i = 0; i < chunks.length; i++) {
  const chunkText = chunks[i];
  
  // Formato obrigatório para o nó 'Supabase Vector Store'
  const newItem = {

    chunk_text: chunkText,
    source_url: item.url,
    chunk_index: i,
    total_chunks: totalChunks,
    last_updated: item.last_updated,
    metadata: {
      instructions: item.instructions,
      status: item.status           
    }
  };

  outputItems.push({ json: newItem });
}
return {json: {outputItems}};