import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import {
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import * as THREE from "three";
import { FONTE } from "../AnuncioImageador/tema";
import { clamp, ent } from "../Materia/comum";
import mapa from "../DivisaoMS/mapa.json";

// Mapa 3D de verdade (Three.js): MT e MS extrudados a partir dos contornos
// oficiais (mapa.json), com luz, sombra e câmera real — o desenho não deforma.
// Coordenadas: 1 unidade = 100 px do SVG; x = leste, z = sul (para a câmera).
// Cidades convertidas de lon/lat pela mesma projeção do SVG (conferido com
// Cuiabá: previsto 381,9 × 582,5 = armazenado).
const CX = mapa.largura / 2;
const CY = mapa.altura / 2;
const U = 100;
const paraMundo = (x: number, y: number) =>
  new THREE.Vector3((x - CX) / U, 0, (y - CY) / U);

const CIDADES = {
  cuiaba: { nome: "CUIABÁ", p: paraMundo(mapa.cuiaba[0], mapa.cuiaba[1]) },
  campoGrande: { nome: "CAMPO GRANDE", p: paraMundo(478.2, 914.6) },
  dourados: { nome: "DOURADOS", p: paraMundo(466.1, 1034.1) },
};

// traçado aproximado da BR-163 (Dourados → Campo Grande → Coxim →
// Rondonópolis → Cuiabá), cidades pela mesma projeção lon/lat do SVG
const ROTA_Y = 0.34;
const CURVA_ROTA = new THREE.CatmullRomCurve3(
  [
    [466.1, 1034.1],
    [474.5, 975.0],
    [478.2, 914.6],
    [471.0, 845.0],
    [469.1, 780.7],
    [474.0, 705.0],
    [477.1, 641.6],
    [430.0, 606.0],
    [381.9, 582.5],
  ].map(([x, y]) => paraMundo(x, y).setY(ROTA_Y)),
  false,
  "centripetal",
);

const COR = {
  mt: "#1F5F94",
  mtLado: "#0C2E4D",
  ms: "#3FA34D",
  msLado: "#1B5A29",
  amarelo: "#F6D54A",
  branco: "#FFFFFF",
};

const aneis = (d: string) =>
  d
    .split("M")
    .filter(Boolean)
    .map((seg) =>
      seg
        .replace("Z", "")
        .split("L")
        .map((p) => p.split(",").map(Number) as [number, number]),
    );

const formas = (d: string) =>
  aneis(d).map((anel) => {
    const s = new THREE.Shape();
    anel.forEach(([x, y], i) => {
      const X = (x - CX) / U;
      const Y = -(y - CY) / U;
      if (i) s.lineTo(X, Y);
      else s.moveTo(X, Y);
    });
    return s;
  });

const ALTURA = { mt: 0.22, ms: 0.26 };

const Estado: React.FC<{
  d: string;
  cor: string;
  lado: string;
  altura: number;
  brilho?: number;
}> = ({ d, cor, lado, altura, brilho = 0 }) => {
  const geo = useMemo(
    () =>
      new THREE.ExtrudeGeometry(formas(d), {
        depth: altura,
        bevelEnabled: true,
        bevelThickness: 0.035,
        bevelSize: 0.03,
        bevelSegments: 4,
        curveSegments: 1,
      }),
    [d, altura],
  );
  return (
    <mesh
      geometry={geo}
      rotation={[-Math.PI / 2, 0, 0]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial
        attach="material-0"
        color={cor}
        roughness={0.5}
        metalness={0.08}
        emissive={cor}
        emissiveIntensity={brilho}
      />
      <meshStandardMaterial
        attach="material-1"
        color={lado}
        roughness={0.75}
        metalness={0.05}
      />
    </mesh>
  );
};

// contorno luminoso no topo do estado
const Contorno: React.FC<{
  d: string;
  altura: number;
  cor: string;
  opacidade: number;
  raio?: number;
}> = ({ d, altura, cor, opacidade, raio = 0.016 }) => {
  const geos = useMemo(
    () =>
      aneis(d).map((anel) => {
        const pts = anel.map(
          ([x, y]) =>
            new THREE.Vector3((x - CX) / U, altura + 0.04, (y - CY) / U),
        );
        const curva = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0);
        return new THREE.TubeGeometry(curva, pts.length * 2, raio, 6, true);
      }),
    [d, altura, raio],
  );
  return (
    <>
      {geos.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshBasicMaterial
            color={cor}
            transparent
            opacity={opacidade}
            toneMapped={false}
          />
        </mesh>
      ))}
    </>
  );
};

// marcador de cidade: feixe de luz + anel pulsando
const Pino: React.FC<{
  p: THREE.Vector3;
  h: number;
  vis: number;
  f: number;
}> = ({ p, h, vis, f }) => {
  const pulso = (f % 40) / 40;
  if (vis <= 0.01) return null;
  return (
    <group position={[p.x, h, p.z]} scale={[1, Math.max(0.001, vis), 1]}>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.9, 8]} />
        <meshBasicMaterial color={COR.amarelo} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.92, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color={COR.amarelo} toneMapped={false} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        scale={[0.08 + pulso * 0.42, 0.08 + pulso * 0.42, 1]}
      >
        <ringGeometry args={[0.8, 1, 48]} />
        <meshBasicMaterial
          color={COR.amarelo}
          transparent
          opacity={(1 - pulso) * 0.8}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

// rota luminosa que se desenha (k = 0..1) com ponto de luz na ponta
const SEG_ROTA = 240;
const RAIO_SEG = 8;
const Rota: React.FC<{ k: number; f: number }> = ({ k, f }) => {
  const [nucleo, halo] = useMemo(
    () => [
      new THREE.TubeGeometry(CURVA_ROTA, SEG_ROTA, 0.028, RAIO_SEG, false),
      new THREE.TubeGeometry(CURVA_ROTA, SEG_ROTA, 0.075, RAIO_SEG, false),
    ],
    [],
  );
  const n = Math.round(SEG_ROTA * k) * RAIO_SEG * 6;
  nucleo.setDrawRange(0, n);
  halo.setDrawRange(0, n);
  const ponta = CURVA_ROTA.getPointAt(Math.min(1, Math.max(0.0001, k)));
  const pulso = 1 + Math.sin(f / 3) * 0.15;
  return (
    <>
      <mesh geometry={halo}>
        <meshBasicMaterial
          color={COR.amarelo}
          transparent
          opacity={0.22}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      <mesh geometry={nucleo}>
        <meshBasicMaterial color="#FFF3C2" toneMapped={false} />
      </mesh>
      {k > 0.001 && k < 0.999 ? (
        <group position={ponta}>
          <mesh scale={pulso}>
            <sphereGeometry args={[0.07, 20, 20]} />
            <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
          </mesh>
          <mesh scale={pulso}>
            <sphereGeometry args={[0.17, 20, 20]} />
            <meshBasicMaterial
              color={COR.amarelo}
              transparent
              opacity={0.3}
              toneMapped={false}
              depthWrite={false}
            />
          </mesh>
          <pointLight color={COR.amarelo} intensity={1.6} distance={2.2} />
        </group>
      ) : null}
    </>
  );
};

export type ModoMapa3D = "uno" | "rota" | "divisao" | "sul";
type Camera = { pos: [number, number, number]; alvo: [number, number, number] };

// câmera por modo (início -> fim), com órbita leve
const camera = (
  modo: ModoMapa3D,
  p: number,
  f: number,
  k = 0,
): Camera => {
  const lerp = (a: number[], b: number[], t: number) =>
    a.map((v, i) => v + (b[i] - v) * t) as [number, number, number];
  const t = 0.5 - Math.cos(Math.PI * Math.min(1, Math.max(0, p))) / 2;
  const orb = Math.sin(f / 90) * 0.8;
  if (modo === "rota") {
    // acompanha a ponta da rota: começa perto de Dourados e abre até Cuiabá
    const ponta = CURVA_ROTA.getPointAt(Math.min(1, Math.max(0, k)));
    const meio = CIDADES.campoGrande.p;
    const alvo = lerp(
      [ponta.x, 0, ponta.z],
      [meio.x * 0.5 - 0.3, 0, meio.z * 0.5 + 0.4],
      0.15 + 0.55 * k,
    );
    const desl = lerp([2.2, 4.6, 5.2], [1.4, 15, 11], k);
    return {
      pos: [alvo[0] + desl[0] + orb * 0.4, desl[1] + (1 - k) * t * 0.3, alvo[2] + desl[2]],
      alvo,
    };
  }
  if (modo === "uno") {
    const c = {
      pos: lerp([0, 24, 15], [0.6, 18, 13], t),
      alvo: lerp([0, 0, 0.6], [-0.2, 0, 0.2], t),
    };
    c.pos[0] += orb;
    return c;
  }
  if (modo === "divisao") {
    const c = {
      pos: lerp([0.6, 20, 15], [1.4, 15, 15.5], t),
      alvo: lerp([-0.2, 0, 0.4], [0.3, 0, 1.6], t),
    };
    c.pos[0] += orb;
    return c;
  }
  const c = {
    pos: lerp([2.5, 10, 12], [1.2, 7.5, 10.5], t),
    alvo: lerp([0.4, 0, 3.0], [0.45, 0, 3.4], t),
  };
  c.pos[0] += orb * 0.7;
  return c;
};

const FOV = 30;

const Camara: React.FC<{ c: Camera }> = ({ c }) => {
  const { camera: cam } = useThree();
  // aplicado já na renderização (não em efeito), para o quadro capturado
  // usar exatamente a mesma câmera da projeção dos rótulos
  cam.position.set(...c.pos);
  cam.lookAt(...c.alvo);
  cam.updateMatrixWorld();
  return null;
};

// projeta um ponto 3D na tela (para os rótulos em HTML)
const projeta = (c: Camera, v: THREE.Vector3, w: number, h: number) => {
  const cam = new THREE.PerspectiveCamera(FOV, w / h, 0.1, 200);
  cam.position.set(...c.pos);
  cam.lookAt(...c.alvo);
  cam.updateMatrixWorld();
  const q = v.clone().project(cam);
  return { x: ((q.x + 1) / 2) * w, y: ((1 - q.y) / 2) * h };
};

const Rotulo: React.FC<{
  x: number;
  y: number;
  texto: string;
  vis: number;
  tam?: number;
  cor?: string;
}> = ({ x, y, texto, vis, tam = 34, cor = COR.branco }) =>
  vis > 0.01 ? (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -100%) translateY(${(1 - vis) * 14}px)`,
        opacity: vis,
        fontFamily: FONTE,
        fontWeight: 800,
        fontSize: tam,
        letterSpacing: 3,
        color: cor,
        whiteSpace: "nowrap",
        textShadow: "0 3px 12px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.6)",
      }}
    >
      {texto}
    </div>
  ) : null;

export const Mapa3D: React.FC<{
  modo: ModoMapa3D;
  dur: number;
  divide?: number;
  rota?: [number, number];
  fundo?: React.ReactNode;
}> = ({ modo, dur, divide = 24, rota = [14, 110], fundo }) => {
  const f = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const k =
    modo === "rota"
      ? interpolate(f, rota, [0, 1], {
          ...clamp,
          easing: (x) => 0.5 - Math.cos(Math.PI * x) / 2,
        })
      : 0;
  const c = camera(modo, f / dur, f, k);
  // divisão: o MS se ergue e desliza para o sul, a nova fronteira acende
  const sep =
    modo === "divisao"
      ? spring({
          frame: f - divide,
          fps,
          config: { damping: 18, stiffness: 50, mass: 1.4 },
        })
      : modo === "sul"
        ? 1
        : 0;
  const ergue =
    modo === "divisao" ? Math.sin(Math.min(1, sep) * Math.PI) * 0.35 : 0;
  const msZ = sep * 0.55;
  const unido = modo === "uno" || modo === "rota";
  const verde =
    unido ? 0 : modo === "sul" ? 1 : ent(f, divide + 10, divide + 40);
  const corMS = new THREE.Color(COR.mt)
    .lerp(new THREE.Color(COR.ms), verde)
    .getStyle();
  const ladoMS = new THREE.Color(COR.mtLado)
    .lerp(new THREE.Color(COR.msLado), verde)
    .getStyle();
  const linha =
    unido ? 0 : modo === "sul" ? 1 : ent(f, divide - 6, divide + 20);
  const brilhoMS =
    modo === "sul" ? 0.12 + Math.sin(f / 12) * 0.06 : 0.08 * verde;
  const mtEscurece = modo === "sul" ? 0.45 : 1;
  const corMT = new THREE.Color(COR.mt).multiplyScalar(mtEscurece).getStyle();
  // rótulos e pinos
  // rota: cada cidade acende quando a linha chega nela
  const chega = (u: number) => ent(k, u - 0.04, u + 0.06);
  const visCuiaba =
    modo === "rota"
      ? chega(0.97)
      : modo === "uno"
      ? ent(f, 16, 34)
      : modo === "divisao"
        ? ent(f, divide + 40, divide + 60)
        : 0;
  const visCG =
    modo === "rota"
      ? chega(0.24)
      : modo === "divisao"
      ? ent(f, divide + 52, divide + 72)
      : modo === "sul"
        ? ent(f, 10, 28)
        : 0;
  const visDou =
    modo === "sul" ? ent(f, 26, 44) : modo === "rota" ? ent(f, 2, 16) : 0;
  const hMS = ALTURA.ms + 0.04;
  const posCG = CIDADES.campoGrande.p
    .clone()
    .add(new THREE.Vector3(0, ergue + hMS + 1.05, msZ));
  const posDou = CIDADES.dourados.p
    .clone()
    .add(new THREE.Vector3(0, ergue + hMS + 1.05, msZ));
  const posCui = CIDADES.cuiaba.p
    .clone()
    .add(new THREE.Vector3(0, ALTURA.mt + 1.05, 0));
  const rotMT = projeta(c, new THREE.Vector3(-0.6, 0.5, -2.2), width, height);
  const rotMS = projeta(
    c,
    new THREE.Vector3(0.55, 0.5 + ergue, 4.35 + msZ),
    width,
    height,
  );
  const lCui = projeta(c, posCui, width, height);
  const lCG = projeta(c, posCG, width, height);
  const lDou = projeta(c, posDou, width, height);
  const nomeMT = modo === "uno" ? "MATO GROSSO" : "MATO GROSSO";
  const visNomeMT =
    modo === "uno"
      ? ent(f, 6, 24)
      : modo === "divisao"
        ? ent(f, divide + 30, divide + 50)
        : 0;
  const visNomeMS = modo === "divisao" ? ent(f, divide + 36, divide + 56) : 0;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {fundo}
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ fov: FOV, position: c.pos, near: 0.1, far: 200 }}
        shadows
      >
        <Camara c={c} />
        <hemisphereLight args={["#BFD8FF", "#3A2A10", 0.6]} />
        <directionalLight
          position={[-6, 12, 2]}
          intensity={2.4}
          color="#FFE7C4"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />
        <directionalLight
          position={[5, 4, 8]}
          intensity={0.6}
          color="#9CC8FF"
        />
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.01, 0]}
          receiveShadow
        >
          <planeGeometry args={[60, 60]} />
          <shadowMaterial opacity={0.45} />
        </mesh>
        <Estado d={mapa.mt} cor={corMT} lado={COR.mtLado} altura={ALTURA.mt} />
        <Contorno
          d={mapa.mt}
          altura={ALTURA.mt}
          cor={COR.branco}
          opacidade={0.55 * mtEscurece}
          raio={0.01}
        />
        <group position={[0, ergue, msZ]}>
          <Estado
            d={mapa.ms}
            cor={corMS}
            lado={ladoMS}
            altura={ALTURA.ms}
            brilho={brilhoMS}
          />
          <Contorno
            d={mapa.ms}
            altura={ALTURA.ms}
            cor={COR.amarelo}
            opacidade={linha}
            raio={0.02}
          />
        </group>
        <Pino p={CIDADES.cuiaba.p} h={ALTURA.mt + 0.04} vis={visCuiaba} f={f} />
        {modo === "rota" ? <Rota k={k} f={f} /> : null}
        <group position={[0, ergue, msZ]}>
          <Pino p={CIDADES.campoGrande.p} h={hMS} vis={visCG} f={f} />
          <Pino p={CIDADES.dourados.p} h={hMS} vis={visDou} f={f + 13} />
        </group>
      </ThreeCanvas>
      <Rotulo
        x={rotMT.x}
        y={rotMT.y}
        texto={nomeMT}
        vis={visNomeMT}
        tam={modo === "uno" ? 46 : 38}
      />
      <Rotulo
        x={rotMS.x}
        y={rotMS.y}
        texto="MATO GROSSO DO SUL"
        vis={visNomeMS}
        tam={40}
        cor={COR.amarelo}
      />
      <Rotulo
        x={lCui.x}
        y={lCui.y - 14}
        texto="CUIABÁ"
        vis={visCuiaba}
        tam={30}
      />
      <Rotulo
        x={lCG.x}
        y={lCG.y - 14}
        texto="CAMPO GRANDE"
        vis={visCG}
        tam={30}
      />
      <Rotulo
        x={lDou.x}
        y={lDou.y - 14}
        texto="DOURADOS"
        vis={visDou}
        tam={30}
      />
    </div>
  );
};

// composição de teste
export const Mapa3DTeste: React.FC = () => {
  const f = useCurrentFrame();
  const cortes: [ModoMapa3D, number, number][] = [
    ["uno", 0, 90],
    ["rota", 90, 140],
    ["divisao", 230, 250],
    ["sul", 480, 180],
  ];
  const [modo, ini, dur] = [...cortes].reverse().find((c) => f >= c[1])!;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse at 50% 35%, #1B5F8E 0%, #0D355A 45%, #061A2E 100%)",
      }}
    >
      <FrameShift by={ini}>
        <Mapa3D modo={modo} dur={dur} />
      </FrameShift>
      <div
        style={{
          position: "absolute",
          left: 20,
          top: 20,
          color: "#fff",
          fontFamily: FONTE,
          fontSize: 24,
          opacity: interpolate(f, [0, 1], [1, 1], clamp),
        }}
      >
        {modo}
      </div>
    </div>
  );
};

// utilitário do teste: desloca o quadro dos filhos
const FrameShift: React.FC<{ by: number; children: React.ReactNode }> = ({
  by,
  children,
}) => (
  <Sequence from={by} layout="none">
    {children}
  </Sequence>
);
