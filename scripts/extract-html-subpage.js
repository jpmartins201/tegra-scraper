
const data = $json.data

function extractTextFromHTML(html) {
  if (typeof html !== 'string') return '';

  const cleanedHTML = html
    // Remove blocos de conteúdo não visíveis ou indesejados
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<head[\s\S]*?>[\s\S]*?<\/head>/gi, ' ')
    .replace(/<nav[\s\S]*?>[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?>[\s\S]*?<\/footer>/gi, ' ')
    
    // Substitui todas as tags HTML restantes por um espaço
    // Isso evita que palavras se juntem (ex: <p>Olá</p><p>Mundo</p> -> "Olá Mundo")
    .replace(/<[^>]+>/g, ' ')
    
    // Substitui múltiplos espaços, tabs ou quebras de linha por um único espaço
    .replace(/\s+/g, ' ')
    .trim();
    
  return cleanedHTML;
}


function extractLinksFromHTML(html) {
  if (typeof html !== 'string') return [];
  
  const links = [];
  // Regex para encontrar tags <a> e capturar o atributo href
  // Lida com aspas simples ou duplas
  const linkRegex = /<a\s+[^>]*?href\s*=\s*["']([^"']*)["']/gi;
  
  // Usamos matchAll para encontrar todas as ocorrências
  const matches = html.matchAll(linkRegex);

  for (const match of matches) {
    const url = match[1]; // O grupo capturado (a URL)
    
    // Filtra links vazios, âncoras de página (#) ou ações javascript
    if (url && !url.startsWith('#') && !url.toLowerCase().startsWith('javascript:')) {
      links.push(url);
    }
    // Para o loop assim que atingir 10 links
    if (links.length >= 10) {
      break;
    }
  }
  
  return [...new Set(links)];
}


const extractedText = extractTextFromHTML(data);
const extractedLinks = extractLinksFromHTML(data);

return {
  success: $json.data ? true : false,
  content: extractedText,
  links: extractedLinks
};