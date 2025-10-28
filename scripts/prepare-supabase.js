const item = $('Split Out2').item.json.json

const embeddingVector = $json.embedding.values;

const metadata = {
  instructions: item.metadata.instructions,
  status: item.metadata.status,
  last_updated: item.last_updated

};

const rowData = {
  source_url: item.source_url,
  chunk_text: item.chunk_text,
  chunk_index: item.chunk_index,
  total_chunks: item.total_chunks,
  embedding: embeddingVector, 
  metadata: metadata
};

return { json: rowData };