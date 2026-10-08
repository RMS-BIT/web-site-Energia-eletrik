import { useMemo } from "react";
import { AbsoluteFill, Audio, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CenaPlano, Grao, Sfx } from "./base";
import {
  Barra,
  Chamada,
  Contorno,
  Feixe,
  LinhaScan,
  Moldura,
  PontoRastreio,
  Reticulo,
  Svg,
  TextoHUD,
  TituloEspacado,
  clamp,
  ent,
  suave,
} from "./hud";
import { nuvem, ponto } from "./rastreio";
import { C, FONTE, MONO, SEGURA } from "./tema";
import { DURACAO, PLANOS } from "./timeline";

export const r43Schema = z.object({
  comTrilha: z.boolean(),
  volumeTrilha: z.number().min(0).max(1),
});
export type R43Props = z.infer<typeof r43Schema>;
export const r43Padrao: R43Props = { comTrilha: true, volumeTrilha: 0.32 };

const P = PLANOS;
const sai = (f: number, a: number, b: number) => interpolate(f, [a, b], [1, 0], clamp);
const empurra = (f: number, dur: number, de: number, para: number, ox = 540, oy = 960) => ({
  s: interpolate(f, [0, dur], [de, para], { ...clamp, easing: Easing.inOut(Easing.sin) }),
  ox,
  oy,
});
// "chicote" na entrada/saída do plano, para emendar no movimento
const chicote = (f: number, dur: number, dir = 1) => {
  const e = interpolate(f, [0, 5], [1, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const s = interpolate(f, [dur - 5, dur], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  return { tx: dir * (-260 * e + 260 * s), blur: 22 * Math.max(e, s) };
};

// ---------- 1. HOOK ----------
const Gancho = () => (
  <CenaPlano
    plano={P.gancho}
    camera={(f) => empurra(f, 90, 1.0, 1.07, 560, 1060)}
    hud={(f) => {
      const t = ponto(P.gancho.id, "tela", f);
      const busca = { x: 540 + Math.sin(f / 9) * 30, y: 980 + Math.cos(f / 11) * 24 };
      const vai = ent(f, 50, 62);
      const rx = busca.x + (t.x - busca.x) * vai;
      const ry = busca.y + (t.y - busca.y) * vai;
      const pontos = ["cantoA", "cantoB", "teclado"].map((n) => ponto(P.gancho.id, n, f));
      return (
        <Svg opacity={sai(f, 82, 90)}>
          <LinhaScan y={interpolate(f, [4, 30], [260, 1760], clamp)} aparece={interpolate(f, [4, 8, 26, 32], [0, 1, 1, 0], clamp)} />
          <Reticulo x={rx} y={ry} tam={170 * (0.85 + 0.15 * t.s)} aparece={ent(f, 8, 18)} trava={ent(f, 60, 70)} giro={f * 2.2} />
          {pontos.map((p, i) => (
            <PontoRastreio key={i} x={p.x} y={p.y} rotulo={`TRK 0${i + 1}`} aparece={ent(f, 62 + i * 4, 70 + i * 4)} />
          ))}
        </Svg>
      );
    }}
    fora={(f) => (
      <>
        <TituloEspacado texto="MANUTENÇÃO INDUSTRIAL" p={ent(f, 10, 30)} sai={ent(f, 78, 88)} tam={50} y={1380} />
        <AbsoluteFill style={{ alignItems: "center", paddingTop: 1452 }}>
          <div style={{ width: 120 * ent(f, 22, 40) * (1 - ent(f, 78, 88)), height: 2, background: C.destaque }} />
        </AbsoluteFill>
      </>
    )}
  />
);

// ---------- 2. A MÁQUINA ----------
const Geral = () => (
  <CenaPlano
    plano={P.geral}
    camera={(f) => ({ ...empurra(f, 45, 1.1, 1.0), ...chicote(f, 45) })}
    hud={(f) => (
      <Svg>
        <Moldura x={SEGURA.lateral} y={330} w={900} h={1100} p={ent(f, 2, 14) * sai(f, 38, 45)} c={44} />
        <TextoHUD x={SEGURA.lateral} y={310} texto="MAPEANDO ÁREA" aparece={ent(f, 4, 24) * sai(f, 38, 45)} tam={24} />
      </Svg>
    )}
  />
);

const Detalhe = () => {
  const pts0 = nuvem(P.detalhe.id, "malha", 0);
  // liga cada ponto aos 2 vizinhos mais próximos (perspectiva real do equipamento)
  const arestas = useMemo(() => {
    const v = pts0.map((p, i) => ({ p, i })).filter((o) => o.p) as { p: [number, number]; i: number }[];
    const set = new Set<string>();
    const out: [number, number][] = [];
    for (const a of v) {
      const viz = v
        .filter((b) => b.i !== a.i)
        .map((b) => ({ i: b.i, d: Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1]) }))
        .filter((b) => b.d < 230)
        .sort((x, y) => x.d - y.d)
        .slice(0, 2);
      for (const b of viz) {
        const k = a.i < b.i ? `${a.i}-${b.i}` : `${b.i}-${a.i}`;
        if (!set.has(k)) {
          set.add(k);
          out.push([a.i, b.i]);
        }
      }
    }
    return out;
  }, [pts0]);
  return (
    <CenaPlano
      plano={P.detalhe}
      camera={(f) => ({ ...empurra(f, 60, 1.0, 1.05, 540, 1100), ...chicote(f, 60, -1) })}
      hud={(f) => {
        const pts = nuvem(P.detalhe.id, "malha", f);
        const scanY = interpolate(f, [4, 46], [240, 1780], { ...clamp, easing: Easing.inOut(Easing.quad) });
        const visivel = (i: number) => {
          const p = pts[i];
          return p ? interpolate(scanY - p[1], [0, 40], [0, 1], clamp) : 0;
        };
        const op = sai(f, 52, 60);
        return (
          <Svg opacity={op}>
            {arestas.map(([a, b]) => {
              const pa = pts[a];
              const pb = pts[b];
              if (!pa || !pb) return null;
              const v = Math.min(visivel(a), visivel(b));
              return <line key={`${a}-${b}`} x1={pa[0]} y1={pa[1]} x2={pb[0]} y2={pb[1]} stroke={C.branco} strokeWidth={1} strokeOpacity={0.55 * v} />;
            })}
            {pts.map((p, i) =>
              p ? (
                <g key={i} opacity={visivel(i)}>
                  <circle cx={p[0]} cy={p[1]} r={3.2} fill={i % 5 === 0 ? C.destaque : C.branco} />
                  {i % 9 === 0 ? <rect x={p[0] - 7} y={p[1] - 7} width={14} height={14} fill="none" stroke={C.branco} strokeWidth={1} /> : null}
                </g>
              ) : null,
            )}
            <LinhaScan y={scanY} aparece={interpolate(f, [4, 8, 44, 50], [0, 1, 1, 0], clamp)} />
            <TextoHUD x={SEGURA.lateral} y={310} texto={`SCAN 3D  ${Math.round(interpolate(f, [4, 46], [0, 100], clamp))}%`} aparece={ent(f, 2, 12)} tam={24} />
            <TextoHUD x={SEGURA.lateral} y={342} texto={`${pts.filter(Boolean).length} PONTOS MAPEADOS`} aparece={ent(f, 30, 44)} tam={20} cor={C.cinzaClaro} />
          </Svg>
        );
      }}
    />
  );
};

const Interesse = () => (
  <CenaPlano
    plano={P.interesse}
    camera={(f) => ({ ...empurra(f, 45, 1.06, 1.0, 600, 1000), ...chicote(f, 45) })}
    hud={(f) => {
      const a = ponto(P.interesse.id, "alvo", f);
      return (
        <Svg opacity={sai(f, 38, 45)}>
          <Reticulo x={a.x} y={a.y} tam={200} aparece={ent(f, 4, 12)} trava={ent(f, 10, 22)} giro={f * 2} />
          <TextoHUD x={a.x + 130} y={a.y - 10} texto="PONTO DE INTERESSE" aparece={ent(f, 18, 34)} tam={24} />
          <line x1={a.x + 100} y1={a.y} x2={a.x + 124} y2={a.y} stroke={C.branco} strokeWidth={1.4} opacity={ent(f, 18, 22)} />
        </Svg>
      );
    }}
  />
);

// ---------- 3. PREPARAÇÃO ----------
const Tecnico = () => (
  <CenaPlano
    plano={P.tecnico}
    camera={(f) => empurra(f, 75, 1.0, 1.06, 540, 900)}
    hud={(f) => {
      const pontos = Math.floor(f / 8) % 4;
      return (
        <Svg opacity={sai(f, 68, 75)}>
          <TextoHUD x={SEGURA.lateral} y={1400} texto={`INICIALIZANDO${".".repeat(pontos)}`} aparece={ent(f, 6, 18)} tam={22} />
          <Barra x={SEGURA.lateral} y={1420} w={360} p={interpolate(f, [10, 70], [0, 1], clamp)} aparece={ent(f, 6, 16)} />
        </Svg>
      );
    }}
  />
);

const TOQUES = [8, 22, 36];
const Comandos = () => (
  <CenaPlano
    plano={P.comandos}
    hud={(f) => {
      const ok = ponto(P.comandos.id, "ok", f);
      const tela = ponto(P.comandos.id, "tela", f);
      const pronto = ent(f, 44, 54) * sai(f, 68, 74);
      const px = tela.x + 230 * tela.s;
      const py = tela.y - 150 * tela.s;
      return (
        <Svg>
          {TOQUES.map((t) => {
            const k = f - t;
            if (k < 0 || k > 18) return null;
            const p = k / 18;
            return (
              <g key={t}>
                <circle cx={ok.x} cy={ok.y} r={14 + 70 * Easing.out(Easing.cubic)(p)} fill="none" stroke={C.branco} strokeWidth={2} opacity={1 - p} />
                <circle cx={ok.x} cy={ok.y} r={10} fill={C.destaque} opacity={1 - p} />
              </g>
            );
          })}
          <g opacity={ent(f, 4, 12) * sai(f, 68, 74)}>
            <circle cx={ok.x} cy={ok.y} r={46 * ok.s} fill="none" stroke={C.branco} strokeOpacity={0.6} strokeWidth={1.2} strokeDasharray="2 6" transform={`rotate(${f * 3} ${ok.x} ${ok.y})`} />
          </g>
          <g opacity={pronto}>
            <line x1={tela.x + 120 * tela.s} y1={tela.y - 60 * tela.s} x2={px} y2={py + 36} stroke={C.branco} strokeWidth={1.2} />
            <rect x={px} y={py} width={300} height={72} rx={10} fill="rgba(7,9,12,0.72)" stroke={C.branco} strokeOpacity={0.5} />
            <circle cx={px + 34} cy={py + 36} r={12} fill={C.destaque} />
            <path d={`M ${px + 28} ${py + 36} l 5 5 l 9 -10`} stroke={C.branco} strokeWidth={2.4} fill="none" />
            <text x={px + 60} y={py + 44} fill={C.branco} fontFamily={MONO} fontSize={24} letterSpacing={3}>
              SYSTEM READY
            </text>
          </g>
        </Svg>
      );
    }}
  />
);

// ---------- 4. EQUIPAMENTO ----------
const Equipamento = () => (
  <CenaPlano
    plano={P.equipamento}
    camera={(f) => {
      const t = ponto(P.equipamento.id, "tela", Math.min(f, 104));
      const z = interpolate(f, [104, 119], [0, 1], { ...clamp, easing: Easing.in(Easing.exp) });
      return { s: 1 + z * 4.5, ox: t.x, oy: t.y, blur: z * 14 };
    }}
    hud={(f) => {
      const t = ponto(P.equipamento.id, "tela", f);
      const r = ponto(P.equipamento.id, "rotulo", f);
      const ok = ponto(P.equipamento.id, "ok", f);
      const op = sai(f, 92, 104);
      const w = 560 * t.s;
      const h = 330 * t.s;
      // camadas "explodidas" com paralaxe
      const camadas = [1.07, 1.15].map((k, i) => {
        const dx = (t.x - 540) * 0.12 * (i + 1);
        const dy = (t.y - 960) * 0.12 * (i + 1);
        return { k, dx, dy, p: ent(f, 8 + i * 6, 24 + i * 6) };
      });
      return (
        <Svg opacity={op}>
          {camadas.map((c, i) => (
            <rect
              key={i}
              x={t.x - (w * c.k) / 2 + c.dx}
              y={t.y - (h * c.k) / 2 + c.dy}
              width={w * c.k}
              height={h * c.k}
              rx={14}
              fill="none"
              stroke={C.branco}
              strokeOpacity={0.35 * c.p}
              strokeWidth={1.2}
              strokeDasharray={i === 1 ? "4 8" : undefined}
            />
          ))}
          <Moldura x={t.x - w / 2} y={t.y - h / 2} w={w} h={h} p={ent(f, 6, 20)} c={30} />
          <Chamada ax={r.x + 90 * r.s} ay={r.y} bx={Math.min(r.x + 60, 600)} by={r.y - 160} texto="AI56L" sub="IMAGEADOR ACÚSTICO" p={ent(f, 18, 40)} />
          <Chamada ax={t.x - w / 2 + 30} ay={t.y} bx={SEGURA.lateral + 330} by={t.y - h / 2 - 90} texto="TELA DE ANÁLISE" sub="IMAGEM ACÚSTICA" p={ent(f, 30, 52)} lado={-1} />
          <Chamada ax={ok.x} ay={ok.y} bx={ok.x + 170} by={ok.y + 150} texto="COMANDOS" sub="OPERAÇÃO EM CAMPO" p={ent(f, 42, 64)} />
        </Svg>
      );
    }}
  />
);

const Tela = () => (
  <CenaPlano
    plano={P.tela}
    camera={(f) => ({
      s: interpolate(f, [0, 10, 60], [1.6, 1.08, 1.0], { ...clamp, easing: suave }),
      ox: 540,
      oy: 900,
      blur: interpolate(f, [0, 8], [12, 0], clamp),
    })}
    hud={(f) => (
      <Svg opacity={ent(f, 10, 20) * sai(f, 52, 60)}>
        <TextoHUD x={SEGURA.lateral} y={310} texto="IMAGEM DA ANÁLISE" aparece={ent(f, 10, 28)} tam={24} />
      </Svg>
    )}
  />
);

// ---------- 5. SENSOR ----------
const Aproxima = () => (
  <CenaPlano
    plano={P.aproxima}
    camera={(f) => empurra(f, 60, 1.0, 1.08, 540, 900)}
    hud={(f) => {
      const a = ponto(P.aproxima.id, "alvo", f);
      return (
        <Svg opacity={sai(f, 54, 60)}>
          <Reticulo x={a.x + Math.sin(f / 6) * 50} y={a.y + Math.cos(f / 8) * 36} tam={190} aparece={ent(f, 4, 14)} trava={0} giro={f * 3} />
          <TextoHUD x={SEGURA.lateral} y={310} texto="BUSCANDO ALVO..." aparece={ent(f, 6, 26)} tam={24} />
        </Svg>
      );
    }}
  />
);

const Sensor = () => (
  <CenaPlano
    plano={P.sensor}
    hud={(f) => {
      const a = ponto(P.sensor.id, "alvo", f);
      const d = ponto(P.sensor.id, "aparelho", f);
      const fim = sai(f, 228, 240);
      const busca = interpolate(f, [0, 24], [1, 0], clamp);
      const rx = a.x + Math.sin(f / 5) * 60 * busca;
      const ry = a.y + Math.cos(f / 7) * 40 * busca;
      const trava = ent(f, 18, 26);
      const linha = ent(f, 30, 52);
      // caixa do objeto: carcaça + haste
      const bw = 380 * a.s;
      const bh = 470 * a.s;
      const bx = a.x - bw / 2;
      const by = a.y - 120 * a.s;
      const scanY = interpolate(f, [80, 140], [by, by + bh], { ...clamp, easing: Easing.inOut(Easing.quad) });
      const pts = nuvem(P.sensor.id, "pontos", f);
      // rótulos do alvo: abaixo do retículo quando ele sobe perto do topo
      const embaixo = ry < 460;
      const la = embaixo ? ("middle" as const) : rx > 540 ? ("end" as const) : ("start" as const);
      const lx = embaixo ? Math.min(Math.max(rx, 300), 780) : rx > 540 ? rx - 125 * a.s : rx + 125 * a.s;
      const ly = embaixo ? ry + 130 * a.s + 40 : ry - 40;
      const vivos = pts.filter(Boolean).length;
      return (
        <Svg opacity={fim}>
          <Feixe x1={d.x} y1={d.y - 70} x2={a.x} y2={a.y} p={ent(f, 45, 75) * 0.9} fase={f / 40} />
          <line
            x1={d.x}
            y1={d.y - 70}
            x2={d.x + (a.x - d.x) * linha}
            y2={d.y - 70 + (a.y - d.y + 70) * linha}
            stroke={C.branco}
            strokeWidth={1.6}
            strokeDasharray="6 7"
            opacity={linha > 0 ? 0.9 : 0}
          />
          <TextoHUD x={d.x + 70} y={d.y - 90} texto="EQUIPAMENTO" aparece={ent(f, 34, 50)} tam={22} />
          <Reticulo x={rx} y={ry} tam={210 * a.s} aparece={ent(f, 0, 8)} trava={trava} giro={f * 2} />
          {/* rótulo do lado com mais espaço */}
          <TextoHUD x={lx} y={ly} texto="TARGET DETECTED" aparece={ent(f, 24, 40)} tam={32} cor={C.destaque} ancora={la} />
          <TextoHUD x={lx} y={ly + 34} texto="SENSOR" aparece={ent(f, 40, 56)} tam={22} ancora={la} />
          <Contorno x={bx} y={by} w={bw} h={bh} p={ent(f, 90, 150)} />
          {pts.map((p, i) =>
            p ? (
              <circle key={i} cx={p[0]} cy={p[1]} r={4} fill={C.branco} opacity={interpolate(scanY - p[1], [0, 30], [0, 1], clamp)} />
            ) : null,
          )}
          <LinhaScan y={scanY} x0={bx - 30} x1={bx + bw + 30} aparece={interpolate(f, [80, 84, 136, 142], [0, 1, 1, 0], clamp)} />
          <TextoHUD x={bx + bw + 20} y={by + bh - 60} texto={`PONTOS ${vivos}`} aparece={ent(f, 120, 136)} tam={20} cor={C.cinzaClaro} />
          <TextoHUD x={bx + bw + 20} y={by + bh - 34} texto="CONTORNO OK" aparece={ent(f, 140, 156)} tam={20} cor={C.cinzaClaro} />
        </Svg>
      );
    }}
  />
);

// ---------- 6. LEITURA ----------
const Leitura = () => (
  <CenaPlano
    plano={P.leitura}
    camera={(f) => {
      const alvo = ponto(P.leitura.id, "dados", 110);
      return { s: interpolate(f, [110, 200], [1, 1.28], { ...clamp, easing: Easing.inOut(Easing.cubic) }), ox: alvo.x, oy: alvo.y };
    }}
    hud={(f) => {
      const b = ponto(P.leitura.id, "caixa", f);
      const w = 450 * b.s;
      const h = 395 * b.s;
      return (
        <Svg opacity={sai(f, 104, 116)}>
          <Moldura x={b.x - w / 2} y={b.y - h / 2} w={w} h={h} p={ent(f, 4, 18)} c={30} marcas />
        </Svg>
      );
    }}
    fora={(f) => {
      const prog = interpolate(f, [12, 70], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
      const completo = ent(f, 72, 82);
      const op = sai(f, 150, 162);
      return (
        <Svg opacity={op}>
          <rect x={SEGURA.lateral - 20} y={1330} width={560} height={140} rx={12} fill="rgba(7,9,12,0.62)" opacity={ent(f, 6, 14)} />
          <TextoHUD x={SEGURA.lateral} y={1378} texto={`ANALYZING${".".repeat(Math.floor(f / 7) % 4)}`} aparece={ent(f, 8, 18) * (1 - completo)} tam={28} />
          <TextoHUD x={SEGURA.lateral} y={1378} texto="ANALYSIS COMPLETE" aparece={completo} tam={28} cor={C.destaque} />
          <Barra x={SEGURA.lateral} y={1404} w={480} p={prog} aparece={ent(f, 8, 16)} />
          <TextoHUD x={SEGURA.lateral + 480} y={1452} texto={`${Math.round(prog * 100)}%`} aparece={ent(f, 8, 16)} tam={20} cor={C.cinzaClaro} ancora="end" />
        </Svg>
      );
    }}
  />
);

// ---------- 7. MONTAGEM ----------
const Montagem = () => (
  <>
    {[P.mTecnico, P.mMaquina, P.mSensor, P.mEquipamento].map((pl) => (
      <CenaPlano key={pl.id} plano={pl} camera={(f) => empurra(f, 30, 1.0, 1.06)} />
    ))}
  </>
);

const PALAVRAS = ["INSPEÇÃO", "PRECISÃO", "MANUTENÇÃO"];
const PalavrasMontagem: React.FC = () => {
  const frame = useCurrentFrame();
  const local = frame - P.mTecnico.de;
  if (local < 0 || local >= 120) return null;
  const i = Math.min(2, Math.floor(local / 40));
  const k = local - i * 40;
  const entra = ent(k, 0, 8);
  const sair = ent(k, 33, 40);
  return (
    <AbsoluteFill style={{ backgroundColor: "rgba(0,0,0,0.28)", alignItems: "center", justifyContent: "center", paddingBottom: 80 }}>
      <div style={{ overflow: "hidden", padding: "6px 0" }}>
        <div
          style={{
            fontFamily: FONTE,
            fontWeight: 700,
            fontSize: 112,
            letterSpacing: 10,
            paddingLeft: 10,
            color: C.branco,
            transform: `translateY(${(1 - entra) * 100 - sair * 100}%)`,
            textShadow: "0 6px 40px rgba(0,0,0,0.5)",
          }}
        >
          {PALAVRAS[i]}
        </div>
      </div>
      <div style={{ width: 60 * entra * (1 - sair), height: 3, background: C.destaque, marginTop: 18 }} />
    </AbsoluteFill>
  );
};

// ---------- 8. FINAL ----------
const Final = () => (
  <CenaPlano
    plano={P.final}
    camera={(f) => ({ ...empurra(f, 90, 1.04, 1.0), blur: interpolate(f, [8, 36], [0, 5], clamp) })}
    fora={(f) => {
      const titulo = ent(f, 4, 22) * (1 - ent(f, 34, 44));
      const logo = ent(f, 36, 56);
      const sub = ent(f, 14, 30);
      const preto = interpolate(f, [78, 90], [0, 1], clamp);
      return (
        <>
          <AbsoluteFill style={{ backgroundColor: "rgba(4,6,9,0.62)", opacity: ent(f, 6, 34) }} />
          <TituloEspacado texto="MANUTENÇÃO INDUSTRIAL" p={titulo} tam={50} y={928} />
          <AbsoluteFill style={{ alignItems: "center", paddingTop: 860, opacity: logo }}>
            <Img
              src={staticFile("marca/solver-wordmark-branco.png")}
              style={{ width: 600, transform: `scale(${1.04 - 0.04 * logo})`, filter: `blur(${(1 - logo) * 8}px)` }}
            />
          </AbsoluteFill>
          <AbsoluteFill style={{ alignItems: "center", paddingTop: 1080 }}>
            <div
              style={{
                fontFamily: FONTE,
                fontWeight: 400,
                fontSize: 32,
                letterSpacing: 3,
                color: C.cinzaClaro,
                opacity: sub,
                transform: `translateY(${(1 - sub) * 12}px)`,
              }}
            >
              Tecnologia. Precisão. Eficiência.
            </div>
          </AbsoluteFill>
          <AbsoluteFill style={{ backgroundColor: "black", opacity: preto }} />
        </>
      );
    }}
  />
);

// Assinatura discreta (mono) no topo durante as cenas com HUD.
const Assinatura: React.FC = () => {
  const f = useCurrentFrame();
  const op = interpolate(f, [12, 26, 622, 632, 866, 878, 1060, 1076], [0, 1, 1, 0, 0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ paddingTop: SEGURA.topo - 30, paddingLeft: SEGURA.lateral, opacity: op * 0.85 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: MONO, fontSize: 19, letterSpacing: 3, color: C.branco }}>
        <div style={{ width: 8, height: 8, background: C.destaque }} />
        SOLVER // INSPEÇÃO ACÚSTICA
      </div>
    </AbsoluteFill>
  );
};

export const Roteiro43: React.FC<R43Props> = ({ comTrilha, volumeTrilha }) => {
  const sx = (pl: { de: number }, f: number) => pl.de + f;
  return (
    <AbsoluteFill style={{ backgroundColor: C.preto }}>
      <Gancho />
      <Geral />
      <Detalhe />
      <Interesse />
      <Tecnico />
      <Comandos />
      <Equipamento />
      <Tela />
      <Aproxima />
      <Sensor />
      <Leitura />
      <Montagem />
      <PalavrasMontagem />
      <Final />
      <Assinatura />
      <Grao />

      {comTrilha ? (
        <Audio
          src={staticFile("audio/r43/trilha.wav")}
          volume={(f) => interpolate(f, [0, 10, DURACAO - 45, DURACAO], [0, volumeTrilha, volumeTrilha, 0], clamp)}
        />
      ) : null}
      {/* 1. hook */}
      <Sfx nome="impacto" em={0} volume={0.9} />
      <Sfx nome="scan" em={sx(P.gancho, 4)} volume={0.25} />
      <Sfx nome="beep" em={sx(P.gancho, 10)} volume={0.5} />
      <Sfx nome="beep_duplo" em={sx(P.gancho, 64)} volume={0.55} />
      <Sfx nome="swish" em={sx(P.gancho, 78)} volume={0.4} />
      {/* 2. máquina */}
      <Sfx nome="whoosh" em={P.detalhe.de - 8} volume={0.45} />
      <Sfx nome="scan" em={sx(P.detalhe, 4)} volume={0.5} />
      <Sfx nome="whoosh" em={P.interesse.de - 8} volume={0.45} />
      <Sfx nome="beep_duplo" em={sx(P.interesse, 20)} volume={0.5} />
      {/* 3. preparação */}
      <Sfx nome="whoosh" em={P.tecnico.de - 8} volume={0.35} />
      <Sfx nome="beep" em={sx(P.tecnico, 8)} volume={0.35} />
      {TOQUES.map((t) => (
        <Sfx key={t} nome="click" em={sx(P.comandos, t)} volume={0.6} dur={10} />
      ))}
      <Sfx nome="beep_duplo" em={sx(P.comandos, 44)} volume={0.6} />
      {/* 4. equipamento */}
      {[18, 30, 42].map((t) => (
        <Sfx key={t} nome="click" em={sx(P.equipamento, t)} volume={0.35} dur={10} />
      ))}
      <Sfx nome="swish" em={sx(P.equipamento, 106)} volume={0.6} />
      <Sfx nome="hit" em={P.tela.de} volume={0.45} />
      {/* 5. sensor */}
      <Sfx nome="whoosh" em={P.aproxima.de - 8} volume={0.4} />
      <Sfx nome="beep" em={sx(P.aproxima, 10)} volume={0.35} />
      <Sfx nome="beep_duplo" em={sx(P.sensor, 24)} volume={0.65} />
      <Sfx nome="pulso" em={sx(P.sensor, 45)} volume={0.55} />
      <Sfx nome="scan" em={sx(P.sensor, 80)} volume={0.6} />
      <Sfx nome="pulso" em={sx(P.sensor, 140)} volume={0.5} />
      {/* 6. leitura */}
      <Sfx nome="whoosh" em={P.leitura.de - 8} volume={0.35} />
      <Sfx nome="beep" em={sx(P.leitura, 10)} volume={0.4} />
      <Sfx nome="beep_duplo" em={sx(P.leitura, 72)} volume={0.6} />
      <Sfx nome="swish" em={sx(P.leitura, 106)} volume={0.3} />
      {/* 7. montagem */}
      {[P.mTecnico, P.mMaquina, P.mSensor, P.mEquipamento].map((pl) => (
        <Sfx key={pl.id} nome="hit" em={pl.de} volume={0.6} dur={24} />
      ))}
      {/* 8. final */}
      <Sfx nome="impacto_final" em={sx(P.final, 34)} volume={0.85} />
    </AbsoluteFill>
  );
};
