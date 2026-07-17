# STIKDEAD :: corrige os icones de patente — remove o fundo (branco OU escuro)
# com transparencia REAL, centraliza o simbolo e padroniza margem/escala.
# Uso: python3 fix_patentes.py <dir_entrada> <dir_saida>
import os, sys
import numpy as np
from PIL import Image, ImageFilter

ENT, SAI = sys.argv[1], sys.argv[2]
os.makedirs(SAI, exist_ok=True)

def processa(caminho, destino):
    im = Image.open(caminho).convert('RGBA')
    arr = np.asarray(im).astype(np.int16)
    h, w = arr.shape[:2]
    rgb = arr[:, :, :3]

    # cor de fundo = mediana dos pixels da borda
    borda = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    bg = np.median(borda, axis=0)
    claro = bg.mean() > 180  # fundo branco (p15/p44) ou escuro

    dist = np.abs(rgb - bg).sum(axis=2)
    tol = 110 if claro else 60
    parecido = dist < tol

    # flood fill a partir das bordas: so vira fundo o que esta CONECTADO a borda
    mask = np.zeros((h, w), dtype=bool)
    mask[0, :] = parecido[0, :]; mask[-1, :] = parecido[-1, :]
    mask[:, 0] |= parecido[:, 0]; mask[:, -1] |= parecido[:, -1]
    for _ in range(w):
        cresce = mask.copy()
        cresce[1:, :] |= mask[:-1, :]
        cresce[:-1, :] |= mask[1:, :]
        cresce[:, 1:] |= mask[:, :-1]
        cresce[:, :-1] |= mask[:, 1:]
        cresce &= parecido
        if (cresce == mask).all():
            break
        mask = cresce

    alpha = np.where(mask, 0, 255).astype(np.uint8)
    # suaviza a serrilha da borda (feather leve, sem halo)
    a_im = Image.fromarray(alpha, 'L').filter(ImageFilter.GaussianBlur(1.1))
    alpha = np.asarray(a_im)
    # remove halo claro residual: pixels semitransparentes perto da cor do fundo somem
    quase = (dist < tol * 1.6) & (alpha < 200) & (alpha > 0)
    alpha = np.where(quase & mask, 0, alpha).astype(np.uint8)

    out = np.dstack([np.asarray(im)[:, :, :3], alpha])
    img = Image.fromarray(out.astype(np.uint8), 'RGBA')

    # recorta o conteudo e padroniza: quadrado + 7% de margem em todos os lados
    bbox = Image.fromarray(alpha, 'L').point(lambda v: 255 if v > 12 else 0).getbbox()
    if bbox:
        img = img.crop(bbox)
    lado = max(img.size)
    margem = int(lado * 0.07)
    quadro = Image.new('RGBA', (lado + 2 * margem, lado + 2 * margem), (0, 0, 0, 0))
    quadro.paste(img, (margem + (lado - img.size[0]) // 2, margem + (lado - img.size[1]) // 2), img)
    quadro = quadro.resize((256, 256), Image.LANCZOS)
    quadro.save(destino, 'WEBP', quality=88, method=6)

    a = np.asarray(quadro)[:, :, 3]
    pct_transp = 100.0 * (a < 10).sum() / a.size
    return claro, pct_transp

relatorio = []
for f in sorted(os.listdir(ENT)):
    if not f.endswith('.webp'):
        continue
    claro, pct = processa(os.path.join(ENT, f), os.path.join(SAI, f))
    ok = 8 <= pct <= 75
    relatorio.append((f, 'BRANCO' if claro else 'escuro', round(pct, 1), 'OK' if ok else 'REVISAR'))

for r in relatorio:
    print(*r)
ruins = [r for r in relatorio if r[3] != 'OK']
print(f"== {len(relatorio)} processados, {len(ruins)} para revisar ==")
