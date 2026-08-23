export const OUTLINE = '#2b2545';

function rasterize(width, height, paint) {
  const cells = new Map();
  const put = (x, y, color) => {
    if (x >= 0 && y >= 0 && x < width && y < height) cells.set(`${x},${y}`, color);
  };
  const api = {
    px: (x, y, color) => put(Math.round(x), Math.round(y), color),
    rect: (x, y, w, h, color) => {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, color);
    },
    ell: (cx, cy, rx, ry, color) => {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const dx = (x + 0.5 - cx) / rx;
          const dy = (y + 0.5 - cy) / ry;
          if (dx * dx + dy * dy <= 1) put(x, y, color);
        }
      }
    }
  };
  paint(api);
  return { width, height, cells };
}

function withOutline(raster, outlineColor = OUTLINE) {
  const outlined = new Map(raster.cells);
  for (let y = -1; y <= raster.height; y++) {
    for (let x = -1; x <= raster.width; x++) {
      if (raster.cells.has(`${x},${y}`)) continue;
      const touching =
        raster.cells.has(`${x + 1},${y}`) ||
        raster.cells.has(`${x - 1},${y}`) ||
        raster.cells.has(`${x},${y + 1}`) ||
        raster.cells.has(`${x},${y - 1}`);
      if (
        touching &&
        x >= 0 && y >= 0 && x < raster.width && y < raster.height
      ) outlined.set(`${x},${y}`, outlineColor);
    }
  }
  return { width: raster.width, height: raster.height, cells: outlined };
}

function toCanvas(raster) {
  const canvas = document.createElement('canvas');
  canvas.width = raster.width;
  canvas.height = raster.height;
  const context = canvas.getContext('2d');
  for (const [key, color] of raster.cells) {
    const [x, y] = key.split(',').map(Number);
    context.fillStyle = color;
    context.fillRect(x, y, 1, 1);
  }
  return canvas;
}

const BODY = '#f4ecd9';
const SHADE = '#ddd2b8';
const INK = '#241f3d';

function paintTroll(p) {
  return (a) => {
    const bob = [0, -1, 0, -1][p];
    const legBack = [-2, 0, 2, 0][p];
    const legFront = [2, 0, -2, 0][p];
    a.ell(9, 6 + bob, 6.5, 5.5, BODY);
    a.ell(6, 1 + bob, 1.2, 1.2, BODY);
    a.ell(9.2, 0.8 + bob, 1.15, 1.15, BODY);
    a.ell(15, 8 + bob, 4.5, 3.2, BODY);
    a.ell(15.5, 9.8 + bob, 3.4, 1.2, SHADE);
    a.px(12, 5 + bob, INK);
    a.px(12, 6 + bob, INK);
    a.ell(7.5, 15 + bob, 4.8, 4.6, BODY);
    a.ell(1.7, 16 + bob, 1.35, 1.35, BODY);
    a.px(0, 17 + bob, BODY);
    a.rect(8, 12 + bob, 2, 3, SHADE);
    a.rect(4 + legBack, 19, 2, 3, BODY);
    a.rect(9 + legFront, 19, 2, 3, BODY);
  };
}

function paintMy(p) {
  return (a) => {
    const HAIR = '#8a5a3a';
    const SKIN = '#f2d4b8';
    const RED = '#c8503a';
    const BOOTS = '#201d2e';
    const s = p;
    a.ell(6, 8, 3, 2.6, SKIN);
    a.ell(6, 4.5, 3.6, 2.8, HAIR);
    a.px(7, 0, HAIR);
    a.px(6, 1, HAIR);
    a.px(7, 1, HAIR);
    a.rect(3, 6, 7, 1, HAIR);
    a.rect(2, 7, 1, 2, HAIR);
    a.px(4, 8, INK);
    a.px(7, 8, INK);
    a.rect(4, 10, 5, 1, RED);
    a.rect(3, 11, 6, 1, RED);
    a.rect(3, 12, 7, 1, RED);
    a.rect(2, 13, 8, 1, RED);
    a.px(9, 11, RED);
    a.px(9, 12, SKIN);
    a.rect(3 + s, 14, 2, 2, BOOTS);
    a.rect(8 - s, 14, 2, 2, BOOTS);
  };
}

function paintTooticky(p) {
  return (a) => {
    const BERET = '#4a6fa5';
    const BERET_D = '#3a588a';
    const GOLD = '#e8c95f';
    const SKIN = '#f0cfa8';
    const STRIPE_R = '#c85a3a';
    const STRIPE_W = '#efe6d4';
    const PANTS = '#4a6fa5';
    const BOOT = '#2a2536';
    const STRAP = '#6b4a33';
    const bob = [0, -1, 0, -1][p];
    const legBack = [-1, 0, 1, 0][p];
    const legFront = [1, 0, -1, 0][p];
    a.px(8, bob, '#e88a3a');
    a.px(8, 1 + bob, '#e88a3a');
    a.ell(8, 2.8 + bob, 3.4, 1.5, BERET);
    a.rect(5, 4 + bob, 7, 1, BERET_D);
    a.rect(4, 5 + bob, 2, 3, GOLD);
    a.px(10, 5 + bob, GOLD);
    a.px(11, 6 + bob, GOLD);
    a.ell(8, 7.3 + bob, 2.6, 2.1, SKIN);
    a.px(7, 7 + bob, INK);
    a.px(9, 7 + bob, INK);
    a.rect(4, 10 + bob, 8, 1, STRIPE_R);
    a.rect(4, 11 + bob, 8, 1, STRIPE_W);
    a.rect(4, 12 + bob, 8, 1, STRIPE_R);
    a.rect(4, 13 + bob, 8, 1, STRIPE_W);
    a.rect(4, 14 + bob, 8, 1, STRIPE_R);
    a.rect(4, 15 + bob, 8, 1, STRIPE_W);
    a.px(5, 10 + bob, STRAP);
    a.px(6, 11 + bob, STRAP);
    a.px(7, 12 + bob, STRAP);
    a.px(8, 13 + bob, STRAP);
    a.px(12, 12 + bob, SKIN);
    a.px(12, 13 + bob, SKIN);
    a.rect(12, 14 + bob, 2, 2, '#3a3428');
    a.px(12, 15 + bob, '#ffca6e');
    a.px(13, 15 + bob, '#ffca6e');
    a.rect(6 + legBack, 16, 2, 3, PANTS);
    a.rect(9 + legFront, 16, 2, 3, PANTS);
    a.rect(6 + legBack, 19, 2, 2, BOOT);
    a.rect(9 + legFront, 19, 2, 2, BOOT);
  };
}

function paintAncestor(p) {
  return (a) => {
    const FUR = '#7a6350';
    const FUR_D = '#5a4839';
    const MUZZLE = '#c9a68a';
    const PALE = '#efe6cf';
    const bob = [0, -1, 0, -1][p];
    const legBack = [-1, 0, 1, 0][p];
    const legFront = [1, 0, -1, 0][p];
    a.ell(8, 13.5 + bob, 6.5, 10, FUR);
    a.px(8, bob, FUR);
    a.px(7, 1 + bob, FUR);
    a.px(8, 1 + bob, FUR);
    a.px(9, 1 + bob, FUR);
    a.px(8, 2 + bob, FUR);
    a.px(8, 3 + bob, FUR);
    a.ell(2, 8 + bob, 1.4, 1.3, FUR);
    a.ell(1.8, 14 + bob, 1.3, 1.3, FUR);
    a.ell(2.2, 19 + bob, 1.3, 1.3, FUR);
    a.ell(13.8, 13 + bob, 1.3, 1.3, FUR);
    a.ell(14.2, 18 + bob, 1.3, 1.3, FUR);
    a.ell(13.5, 8 + bob, 3.4, 2.8, MUZZLE);
    a.ell(11.3, 7.5 + bob, 1.2, 1.4, PALE);
    a.px(12, 7 + bob, INK);
    a.rect(11, 12 + bob, 2, 1, FUR_D);
    a.px(11, 13 + bob, FUR_D);
    a.px(14, 13 + bob, FUR);
    a.px(15, 12 + bob, '#ffb45a');
    a.px(15, 13 + bob, '#ffdf9e');
    a.px(15, 14 + bob, PALE);
    a.px(2, 19 + bob, FUR_D);
    a.px(2, 20 + bob, FUR_D);
    a.px(2, 21 + bob, FUR_D);
    a.px(2, 22 + bob, FUR_D);
    a.px(2, 23 + bob, FUR_D);
    a.px(2, 24 + bob, FUR_D);
    a.px(2, 25 + bob, FUR_D);
    a.px(1, 25 + bob, FUR_D);
    a.rect(4 + legBack, 24, 2, 2, FUR_D);
    a.rect(8 + legFront, 24, 2, 2, FUR_D);
  };
}

function paintGroke(p) {
  return (a) => {
    const DARK_BODY = '#15132b';
    const bob = [0, -1, 0, -1][p];
    a.ell(10, 19.5 + bob, 8.5, 3.8, DARK_BODY);
    a.ell(10, 14 + bob, 7.2, 5, DARK_BODY);
    a.ell(10, 8.5 + bob, 5.4, 4.6, DARK_BODY);
    a.ell(10, 3.6 + bob, 3.2, 2.9, DARK_BODY);
    a.rect(8, 6 + bob, 2, 2, '#ffe27a');
    a.rect(12, 6 + bob, 2, 2, '#ffe27a');
  };
}

export function buildSpriteRasters() {
  const troll = [0, 1, 2, 3].map((p) =>
    withOutline(rasterize(22, 23, paintTroll(p)))
  );
  const my = [0, 1].map((p) => withOutline(rasterize(12, 17, paintMy(p))));
  const tooticky = [0, 1, 2, 3].map((p) =>
    withOutline(rasterize(16, 21, paintTooticky(p)))
  );
  const ancestor = [0, 1, 2, 3].map((p) =>
    withOutline(rasterize(18, 27, paintAncestor(p)))
  );
  const groke = [0, 1, 2, 3].map((p) =>
    withOutline(rasterize(20, 24, paintGroke(p)), '#454e79')
  );
  return { troll, my, tooticky, ancestor, groke };
}

export function createSprites() {
  const rasters = buildSpriteRasters();
  const sprites = {};
  for (const [name, frames] of Object.entries(rasters)) {
    sprites[name] = frames.map((frame) => ({
      canvas: toCanvas(frame),
      width: frame.width,
      height: frame.height
    }));
  }
  return sprites;
}
