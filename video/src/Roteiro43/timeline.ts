// Linha do tempo do "Roteiro Master 43s" (30 fps, 1290 quadros).
// Cada plano é um arquivo em public/planos/ já cortado na duração final
// (ver scripts/preparar_planos_r43.py).

export const FPS = 30;
export const DURACAO = 1290;

export type Plano = { id: string; de: number; dur: number };

const p = (id: string, de: number, dur: number): Plano => ({ id, de, dur });

export const PLANOS = {
  gancho: p("p1_gancho", 0, 90),
  geral: p("p2a_geral", 90, 45),
  detalhe: p("p2b_detalhe", 135, 60),
  interesse: p("p2c_interesse", 195, 45),
  tecnico: p("p3a_tecnico", 240, 75),
  comandos: p("p3b_comandos", 315, 75),
  equipamento: p("p4a_equipamento", 390, 120),
  tela: p("p4b_tela", 510, 60),
  aproxima: p("p5a_aproxima", 570, 60),
  sensor: p("p5b_sensor", 630, 240),
  leitura: p("p6_leitura", 870, 210),
  mTecnico: p("p7a_tecnico", 1080, 30),
  mMaquina: p("p7b_maquina", 1110, 30),
  mSensor: p("p7c_sensor", 1140, 30),
  mEquipamento: p("p7d_equipamento", 1170, 30),
  final: p("p8_final", 1200, 90),
} as const;
