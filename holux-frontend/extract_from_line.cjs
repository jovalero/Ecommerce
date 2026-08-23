const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function run() {
  const logPath = 'C:/Users/Valero/.gemini/antigravity/brain/a6845a6d-edd9-4df6-adee-7cd8b3b2be62/.system_generated/logs/transcript_full.jsonl';
  const fileStream = fs.createReadStream(logPath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  let targetLine = null;
  for await (const line of rl) {
    lineCount++;
    if (lineCount === 11131 || (line.includes('"source":"USER_EXPLICIT"') && line.includes('hero_slides'))) {
      targetLine = line;
      console.log('Found target line at index:', lineCount);
    }
  }

  if (!targetLine) {
    console.log('Line not found');
    return;
  }

  const obj = JSON.parse(targetLine);
  const content = obj.content;
  console.log('Content length:', content.length);

  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) {
    console.log('No JSON object found');
    return;
  }

  const jsonStr = content.substring(firstBrace, lastBrace + 1);
  const configData = JSON.parse(jsonStr);
  console.log('Parsed config keys:', Object.keys(configData));

  const bannersDir = 'c:/Users/Valero/Desktop/Webecommerce/holux-frontend/public/banners';
  fs.mkdirSync(bannersDir, { recursive: true });

  if (Array.isArray(configData.hero_slides)) {
    console.log('Hero slides count:', configData.hero_slides.length);
    configData.hero_slides.forEach((slide, i) => {
      console.log(`Hero slide [${i}]: title="${slide.title}", span="${slide.span}", cta="${slide.cta}", desc="${slide.desc}"`);
      if (slide.image && slide.image.startsWith('data:image')) {
        const matches = slide.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const ext = matches[1].includes('png') ? 'png' : (matches[1].includes('webp') ? 'webp' : 'jpg');
          const buffer = Buffer.from(matches[2], 'base64');
          const filename = `hero_slide_${i + 1}.${ext}`;
          fs.writeFileSync(path.join(bannersDir, filename), buffer);
          slide.image = `/banners/${filename}`;
          console.log(`Saved hero slide ${i + 1} image -> /banners/${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
        }
      }
      if (slide.mobileImage && slide.mobileImage.startsWith('data:image')) {
        const matches = slide.mobileImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const ext = matches[1].includes('png') ? 'png' : 'jpg';
          const buffer = Buffer.from(matches[2], 'base64');
          const filename = `hero_slide_mobile_${i + 1}.${ext}`;
          fs.writeFileSync(path.join(bannersDir, filename), buffer);
          slide.mobileImage = `/banners/${filename}`;
          console.log(`Saved mobile slide ${i + 1} image -> /banners/${filename}`);
        }
      }
    });
  }

  if (Array.isArray(configData.grid_cards)) {
    console.log('Grid cards count:', configData.grid_cards.length);
    configData.grid_cards.forEach((card, i) => {
      console.log(`Grid card [${i}]: title="${card.title}", span="${card.span}"`);
      if (card.image && card.image.startsWith('data:image')) {
        const matches = card.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const ext = matches[1].includes('png') ? 'png' : 'jpg';
          const buffer = Buffer.from(matches[2], 'base64');
          const filename = `grid_card_${i + 1}.${ext}`;
          fs.writeFileSync(path.join(bannersDir, filename), buffer);
          card.image = `/banners/${filename}`;
          console.log(`Saved grid card ${i + 1} image -> /banners/${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
        }
      }
    });
  }

  const configDir = 'c:/Users/Valero/Desktop/Webecommerce/holux-frontend/src/config';
  fs.mkdirSync(configDir, { recursive: true });

  const code = 'export const initialStoreData = ' + JSON.stringify(configData, null, 2) + ';\n';
  fs.writeFileSync(path.join(configDir, 'initialStoreData.js'), code, 'utf8');
  console.log('SUCCESS: Saved config to src/config/initialStoreData.js');
}

run().catch(console.error);
