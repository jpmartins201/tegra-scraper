
const finalItemsToUpdate = [];


const mainInput = $input.first().json
if (mainInput) {
  finalItemsToUpdate.push({ json: mainInput });
} else {
  console.warn("⚠️ Nenhum dado da página principal encontrado.");
}


const subInput = $input.last().json.data 
if (subInput && Array.isArray(subInput.data)) {
  for (const subpage of subInput.data) {
    finalItemsToUpdate.push({ json: subpage });
  }
} else if (Array.isArray(subInput)) {
  // Caso o input já seja um array direto (sem wrapper data)
  for (const subpage of subInput) {
    finalItemsToUpdate.push({ json: subpage });
  }
} else if (subInput && typeof subInput === 'object') {
  // Caso seja apenas um objeto único
  finalItemsToUpdate.push({ json: subInput });
} else {
  console.warn("⚠️ Nenhum dado de subpáginas encontrado na entrada 1.");
}

return finalItemsToUpdate;
