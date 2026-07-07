# STIKDEAD :: BÍBLIA VISUAL

**Fonte da verdade do universo artístico.** Nada visual nasce fora daqui.

- `bible.json` — as regras em formato de máquina. **A fábrica de assets (`tools/generate-assets.mjs`) importa este arquivo**: mudar uma regra aqui muda todos os assets futuros.
- `*.md` — os capítulos em formato humano: contexto, porquês e exemplos.

## Como usar (humano ou IA)
1. Vai criar item/arena/tela/efeito? **Leia o capítulo correspondente antes.**
2. O prompt final SEMPRE deriva das regras do `bible.json` — nunca é inventado do zero.
3. Descobriu uma regra nova na prática (bug visual, aprendizado)? **Ela entra na Bíblia no mesmo commit do fix.**

## Lições já pagas (por que cada regra existe)
- *"clean ground"* → o modelo pintou chão BRANCO em 4 arenas → nasceu a `regra_do_chao`.
- Ícones sem vinheta de raridade → loja sem hierarquia → nasceram as `vinheta_por_raridade`.
- Sprites com canvas torto → 5 rodadas de calibração perdidas → nasceu o `contrato_de_canvas`.
