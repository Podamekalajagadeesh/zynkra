const fs = require('fs');
const path = 'src/users/entities/user.entity.ts';
const text = fs.readFileSync(path, 'utf8');
const names = [...text.matchAll(/@Column\([^)]*\)\s*(?:\n\s*|\s*)\w+\??\s*[:=]/g)].map(m => {
  const line = m[0].split('\n').slice(-1)[0];
  const n = line.match(/\b([A-Za-z0-9_]+)\??\s*[:=]/);
  return n ? n[1] : null;
}).filter(Boolean);
const extra = [...text.matchAll(/\b([A-Za-z0-9_]+)\s*:\s*[^\n;]+;/g)].map(m => m[1]).filter(v => !['id','createdAt','updatedAt','posts','stories','authenticators','savedMarketplaceListings','products','liveShoppingEvents','lifeEvents','sales','purchases','ratingsGiven','ratingsReceived','followedTrends','nonprofits','affiliateLinks','reputation','manyToOne','oneToOne','oneToMany','manyToMany','Array','Date','number','string','boolean','null','undefined'].includes(v));
const combined = [...new Set([...names, ...extra])];
console.log('ENTITY_COUNT', combined.length);
console.log(combined.slice(0,200).join('\n'));
