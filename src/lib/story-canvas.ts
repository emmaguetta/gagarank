const W = 1080;
const H = 1920;
const PINK = "#FF1493";
const PURPLE = "#9D4EDD";
const DARK = "#0F0F0F";

// Font family names as registered by next/font
const PLAYFAIR = "'Playfair Display', serif";
const MERRIWEATHER = "'Merriweather', serif";
const STILL_TIME = "'StillTimeV2', cursive";

interface StoryOptions {
  scope: "user" | "global";
  filterLabel: string;
  coverImageSrc: string | undefined;
  songs: Array<{ rank: number; title: string; collaborator: string | null }>;
}

/** Load the Still Time font for the GagaRank logo */
async function ensureStillTimeFont(): Promise<void> {
  const fontName = "StillTimeV2";
  // Check if already loaded
  for (const face of document.fonts) {
    if (face.family === fontName || face.family === `'${fontName}'`) return;
  }
  // Load from the local font file
  const font = new FontFace(fontName, "url(/fonts/StillTimeV2.ttf)");
  await font.load();
  document.fonts.add(font);
}

function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (ctx.measureText(truncated + "...").width > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + "...";
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = DARK;
  ctx.fillRect(0, 0, W, H);

  // Pink orb top-right
  const pinkGrad = ctx.createRadialGradient(850, 200, 0, 850, 200, 500);
  pinkGrad.addColorStop(0, "rgba(255, 20, 147, 0.18)");
  pinkGrad.addColorStop(1, "rgba(255, 20, 147, 0)");
  ctx.fillStyle = pinkGrad;
  ctx.fillRect(0, 0, W, H);

  // Purple orb bottom-left
  const purpleGrad = ctx.createRadialGradient(200, 1600, 0, 200, 1600, 600);
  purpleGrad.addColorStop(0, "rgba(157, 78, 221, 0.15)");
  purpleGrad.addColorStop(1, "rgba(157, 78, 221, 0)");
  ctx.fillStyle = purpleGrad;
  ctx.fillRect(0, 0, W, H);
}

function drawGradientLine(ctx: CanvasRenderingContext2D, y: number) {
  const grad = ctx.createLinearGradient(100, y, W - 100, y);
  grad.addColorStop(0, "rgba(255, 20, 147, 0)");
  grad.addColorStop(0.3, "rgba(255, 20, 147, 0.5)");
  grad.addColorStop(0.7, "rgba(157, 78, 221, 0.5)");
  grad.addColorStop(1, "rgba(157, 78, 221, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(100, y, W - 200, 2);
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Draw image with "object-fit: cover" behavior (crop to fill, centered) */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = w / h;

  let sx: number, sy: number, sw: number, sh: number;

  if (imgRatio > targetRatio) {
    // Image is wider: crop sides
    sh = img.naturalHeight;
    sw = sh * targetRatio;
    sx = (img.naturalWidth - sw) / 2;
    sy = 0;
  } else {
    // Image is taller: crop top/bottom
    sw = img.naturalWidth;
    sh = sw / targetRatio;
    sx = 0;
    sy = (img.naturalHeight - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawCoverFallback(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  label: string
) {
  ctx.save();
  drawRoundedRect(ctx, x, y, size, size, 32);
  ctx.clip();

  const grad = ctx.createLinearGradient(x, y, x + size, y + size);
  grad.addColorStop(0, "rgba(255, 20, 147, 0.6)");
  grad.addColorStop(1, "rgba(157, 78, 221, 0.6)");
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, size, size);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold 48px ${PLAYFAIR}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + size / 2, y + size / 2);

  ctx.restore();
}

function getRankColor(rank: number): string {
  if (rank === 1) return "#FFD700";
  if (rank === 2) return "#C0C0C0";
  if (rank === 3) return "#CD7F32";
  return PINK;
}

export async function generateStoryImage(options: StoryOptions): Promise<Blob> {
  const { scope, filterLabel, coverImageSrc, songs } = options;
  const top10 = songs.slice(0, 10);

  // Ensure all fonts are loaded
  await document.fonts.ready;
  await ensureStillTimeFont();

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // --- Background ---
  drawBackground(ctx);

  // --- Cover image ---
  const coverSize = 400;
  const coverX = (W - coverSize) / 2;
  const coverY = 120;

  let coverLoaded = false;
  if (coverImageSrc) {
    try {
      const img = await loadImage(coverImageSrc);
      ctx.save();

      // Glow
      ctx.shadowColor = PINK;
      ctx.shadowBlur = 40;

      drawRoundedRect(ctx, coverX, coverY, coverSize, coverSize, 32);
      ctx.clip();

      // Draw with cover mode (no stretching)
      drawImageCover(ctx, img, coverX, coverY, coverSize, coverSize);

      ctx.restore();
      coverLoaded = true;
    } catch {
      // fallback below
    }
  }

  if (!coverLoaded) {
    drawCoverFallback(ctx, coverX, coverY, coverSize, filterLabel);
  }

  // --- Title ---
  const titleY = coverY + coverSize + 70;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold 56px ${PLAYFAIR}`;
  const scopeLabel = scope === "user" ? "MY TOP 10" : "COMMUNITY TOP 10";
  ctx.fillText(scopeLabel, W / 2, titleY);

  ctx.fillStyle = PINK;
  ctx.font = `bold 40px ${MERRIWEATHER}`;
  ctx.fillText(filterLabel, W / 2, titleY + 60);

  // --- Top divider ---
  const dividerY = titleY + 100;
  drawGradientLine(ctx, dividerY);

  // --- Song list ---
  const listStartY = dividerY + 50;
  const songCount = top10.length;
  const rowHeight = Math.min(96, Math.floor((H - listStartY - 220) / songCount));

  ctx.textBaseline = "middle";

  for (let i = 0; i < songCount; i++) {
    const song = top10[i];
    const rowY = listStartY + i * rowHeight + rowHeight / 2;

    // Subtle row background for top 3
    if (i < 3) {
      ctx.fillStyle = "rgba(26, 26, 46, 0.5)";
      drawRoundedRect(ctx, 80, rowY - rowHeight / 2 + 4, W - 160, rowHeight - 8, 16);
      ctx.fill();
    }

    // Rank number
    ctx.textAlign = "right";
    ctx.fillStyle = getRankColor(song.rank);
    ctx.font = `bold 42px ${MERRIWEATHER}`;
    ctx.fillText(`${song.rank}.`, 170, rowY);

    // Song title
    ctx.textAlign = "left";
    ctx.fillStyle = "#F5F5F5";
    ctx.font = `bold 38px ${MERRIWEATHER}`;

    const maxTitleWidth = song.collaborator ? 580 : 750;
    const title = truncateText(ctx, song.title, maxTitleWidth);
    ctx.fillText(title, 200, rowY);

    // Collaborator
    if (song.collaborator) {
      const titleWidth = ctx.measureText(title).width;
      ctx.fillStyle = PINK;
      ctx.font = `300 28px ${MERRIWEATHER}`;
      const collabText = truncateText(ctx, `ft. ${song.collaborator}`, 300);
      ctx.fillText(collabText, 210 + titleWidth + 12, rowY);
    }
  }

  // --- Bottom divider ---
  const bottomDivY = listStartY + songCount * rowHeight + 20;
  drawGradientLine(ctx, bottomDivY);

  // --- Footer branding with Still Time font ---
  const footerY = bottomDivY + 80;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // GagaRank in Still Time font with gradient
  ctx.font = `64px ${STILL_TIME}`;
  const brandGrad = ctx.createLinearGradient(W / 2 - 150, footerY, W / 2 + 150, footerY);
  brandGrad.addColorStop(0, PINK);
  brandGrad.addColorStop(1, PURPLE);
  ctx.fillStyle = brandGrad;
  ctx.fillText("GagaRank", W / 2, footerY);

  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = `300 28px ${MERRIWEATHER}`;
  ctx.fillText("gagarank.com", W / 2, footerY + 50);

  // --- Export ---
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to generate image"));
      },
      "image/png"
    );
  });
}
