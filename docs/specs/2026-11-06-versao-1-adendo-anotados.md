# Adendo à spec da versão 1, para o ajuste dos anotados

Aprovado pelo Eduardo junto com o plano do ajuste dos anotados, em 2026-11-06.

- **AD17.** No passo 3 da S2, antes de saírem os caracteres de controle, saem inteiras as sequências de escape ANSI de dois tipos, nas formas de 7 e de 8 bits. Isso vale nas ferramentas e no terminal, como os passos 1 a 5.
  - A CSI, das cores e do cursor: `ESC [` ou U+009B, seguido, pela gramática do ECMA-48, de zero ou mais parâmetros (U+0030 a U+003F), de zero ou mais intermediários (U+0020 a U+002F) e de um final (U+0040 a U+007E).
  - A OSC, dos títulos e dos links: `ESC ]` ou U+009D, seguido de zero ou mais caracteres que não são de controle (Cc) e de um terminador, que é o BEL (U+0007), o `ESC \` ou o ST (U+009C).
  - Uma sequência fora dessa forma conta como sem fim. É o caso da CSI com outro caractere antes do final (como `ESC [é`) e da OSC com um controle antes do terminador (como uma quebra de linha ou outro ESC). Dela, no resto do passo 3, saem só os caracteres de controle, como o ESC ou o caractere de 8 bits do começo, e o resto fica como texto.
  - Ficam de fora, e, como antes, só perdem os caracteres de controle: o DCS (`ESC P`, U+0090), o SOS (`ESC X`, U+0098), o PM (`ESC ^`, U+009E), o APC (`ESC _`, U+009F) e os escapes de dois caracteres (como `ESC c` e `ESC ( B`).
- **AD18.** No 7.4, o `ocupado` é falso quando o evento não ocupa a agenda pela D-c e pela D-d: o cancelado, o marcado como livre (`transparency: transparent`) e o convite que o usuário recusou. É a mesma regra dos conflitos e do próximo compromisso, e o `status` e a `minha_resposta` continuam saindo como antes.
