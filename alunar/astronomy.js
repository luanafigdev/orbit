const LUNATION = 29.530588853;
const DAY = 86400000;
const NEW_MOON_EPOCH = Date.UTC(2000, 0, 6, 18, 14);

export const PHASE_NAMES = [
  'Lua Nova', 'Lua Crescente', 'Quarto Crescente', 'Gibosa Crescente',
  'Lua Cheia', 'Gibosa Minguante', 'Quarto Minguante', 'Lua Minguante'
];

export const PHASE_DETAILS = [
  'A face voltada para a Terra está praticamente sem iluminação solar.',
  'O trecho iluminado cresce aos poucos, noite após noite.',
  'Vemos aproximadamente metade do disco iluminada, em crescimento.',
  'Mais da metade do disco está iluminada; aproxima-se a Lua Cheia.',
  'O disco lunar aparece quase completamente iluminado pelo Sol.',
  'A iluminação aparente começa a diminuir após a Lua Cheia.',
  'Aproximadamente metade do disco aparece iluminada, em declínio.',
  'Um fino arco iluminado antecede a próxima Lua Nova.'
];

const fractional = (n) => ((n % 1) + 1) % 1;

export function phaseAt(date = new Date()) {
  const elapsed = (date.getTime() - NEW_MOON_EPOCH) / DAY;
  const fraction = fractional(elapsed / LUNATION);
  const index = Math.floor(fraction * 8 + .5) % 8;
  const illuminated = (1 - Math.cos(fraction * Math.PI * 2)) / 2;
  return {
    fraction, index, name: PHASE_NAMES[index],
    age: fraction * LUNATION,
    illuminated,
    description: PHASE_DETAILS[index]
  };
}

export function nextMajorPhase(date = new Date()) {
  const current = (date.getTime() - NEW_MOON_EPOCH) / DAY / LUNATION;
  const nextQuarter = Math.floor(current * 4 + 0.00000001) + 1;
  const fraction = fractional(nextQuarter / 4);
  const index = Math.round(fraction * 8) % 8;
  const when = new Date(NEW_MOON_EPOCH + nextQuarter / 4 * LUNATION * DAY);
  return { name: PHASE_NAMES[index], when };
}

export function dateFromInput(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function inputDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const formatDate = (date, options = { day: 'numeric', month: 'long', year: 'numeric' }) =>
  new Intl.DateTimeFormat('pt-BR', options).format(date);

export function paintPhase(canvas, fraction, southern = true) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const size = Math.min(canvas.width, canvas.height);
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const radius = size * .458;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const image = ctx.createImageData(canvas.width, canvas.height);
  const pixels = image.data;
  const sunX = Math.sin(fraction * Math.PI * 2) * (southern ? -1 : 1);
  const sunZ = -Math.cos(fraction * Math.PI * 2);
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const px = (x - cx) / radius;
      const py = (cy - y) / radius;
      const r2 = px * px + py * py;
      if (r2 > 1) continue;
      const z = Math.sqrt(1 - r2);
      const light = px * sunX + z * sunZ;
      const lit = Math.max(0, Math.min(1, light * 9 + .5));
      const grain = Math.sin(px * 31 + py * 43) * 3 + Math.sin(px * 61 - py * 18) * 2;
      const limb = .65 + z * .35;
      const tone = (29 + lit * 182 + grain) * limb;
      const i = (y * canvas.width + x) * 4;
      pixels[i] = Math.round(tone * .95);
      pixels[i + 1] = Math.round(tone * .97);
      pixels[i + 2] = Math.round(tone * 1.10);
      pixels[i + 3] = Math.round(Math.min(1, (1 - r2) * 150) * 255);
    }
  }
  ctx.putImageData(image, 0, 0);
}
