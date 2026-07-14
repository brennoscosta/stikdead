# STIKDEAD :: renderizador 3D do boneco (Blender headless, Cycles CPU)
# Constrói o stickman com geometria real (esfera + cápsulas + juntas esféricas),
# material matte preto acetinado e luz de estúdio da referência, e renderiza
# cada frame das poses exportadas da simulação (export-poses.mjs).
# Uso: blender -b -P render3d.py -- /tmp/poses.json /tmp/frames
import bpy, json, sys, math
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
POSES_PATH, OUT_DIR = argv[0], argv[1]
data = json.load(open(POSES_PATH))
RIG = data['rig']
S = 0.01  # unidades do jogo -> metros

# ---------- cena ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 96
scene.cycles.use_denoising = False
scene.render.film_transparent = True
scene.render.resolution_x = 384
scene.render.resolution_y = 384

# material: plástico preto fosco acetinado (referência)
mat = bpy.data.materials.new('stik')
mat.use_nodes = True
bsdf = mat.node_tree.nodes['Principled BSDF']
bsdf.inputs['Base Color'].default_value = (0.012, 0.012, 0.014, 1)
bsdf.inputs['Roughness'].default_value = 0.32
if 'Coat Weight' in bsdf.inputs:  # Blender 4.x
    bsdf.inputs['Coat Weight'].default_value = 0.4
    bsdf.inputs['Coat Roughness'].default_value = 0.25

# luzes: key quente alto-esquerda-frente, rim fria atrás-direita, fill suave
def luz(nome, tipo, loc, energia, cor=(1, 1, 1), tam=2.0):
    l = bpy.data.lights.new(nome, tipo)
    l.energy = energia
    l.color = cor
    if tipo == 'AREA':
        l.size = tam
    o = bpy.data.objects.new(nome, l)
    o.location = loc
    bpy.context.collection.objects.link(o)
    o.rotation_mode = 'QUATERNION'
    d = Vector((0, 0, 0.8)) - Vector(loc)
    o.rotation_quaternion = d.to_track_quat('-Z', 'Y')
    return o

luz('key', 'AREA', (-1.6, -2.2, 2.6), 420, (1, 0.98, 0.95), 2.5)
luz('rim', 'AREA', (1.4, 2.0, 1.6), 260, (0.75, 0.85, 1.0), 1.5)
luz('fill', 'AREA', (1.2, -2.4, 0.6), 90, (0.9, 0.93, 1.0), 3.0)

# câmera lateral ortográfica (o jogo é side-view; boneco olha +X)
cam = bpy.data.cameras.new('cam')
cam.type = 'ORTHO'
cam.ortho_scale = 2.05
co = bpy.data.objects.new('cam', cam)
co.location = (0, -6, 0.78)
co.rotation_euler = (math.pi / 2, 0, 0)
bpy.context.collection.objects.link(co)
scene.camera = co

corpo = []  # objetos do boneco (recriados a cada frame)

def esfera(p, r):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=40, ring_count=24, location=p)
    o = bpy.context.object
    bpy.ops.object.shade_smooth()
    o.data.materials.append(mat)
    corpo.append(o)
    return o

def capsula(a, b, r):
    a, b = Vector(a), Vector(b)
    d = b - a
    L = d.length
    if L < 1e-6:
        return esfera(a, r)
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=L, vertices=32, location=(a + b) / 2)
    o = bpy.context.object
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = d.to_track_quat('Z', 'Y')
    bpy.ops.object.shade_smooth()
    o.data.materials.append(mat)
    corpo.append(o)
    esfera(a, r)  # juntas esféricas = dobras contínuas
    esfera(b, r)
    return o

def P(j):
    # jogo: x = frente(+face), y = cima  ->  blender: X = frente, Z = cima (leve offset 3D em Y)
    return (j[0] * S, 0, j[1] * S)

def monta(sk):
    w = RIG
    r_limb = w['wLimb'] * S * 0.5
    r_limb_lo = w['wLimbLo'] * S * 0.5
    r_leg = w['wLeg'] * S * 0.5
    r_shin = w['wShin'] * S * 0.5
    r_torso = w['wTorso'] * S * 0.5
    # profundidade: perna/braço de trás afastados no eixo Y (leve paralaxe real)
    def PB(j, off):
        x, _, z = P(j)
        return (x, off, z)
    DF, DB = -0.045, 0.045  # frente vem para a câmera
    # pernas
    capsula(PB(sk['hip'], DB), PB(sk['kneB'], DB), r_leg)
    capsula(PB(sk['kneB'], DB), PB(sk['footB'], DB), r_shin)
    esfera(PB(sk['footB'], DB), r_shin * 1.15)
    capsula(PB(sk['hip'], DF), PB(sk['kneF'], DF), r_leg)
    capsula(PB(sk['kneF'], DF), PB(sk['footF'], DF), r_shin)
    esfera(PB(sk['footF'], DF), r_shin * 1.15)
    # tronco + pescoço
    capsula(P(sk['hip']), P(sk['neck']), r_torso)
    capsula(P(sk['neck']), P(sk['head']), r_limb * 0.7)
    # braços
    capsula(PB(sk['neck'], DB), PB(sk['elbB'], DB), r_limb)
    capsula(PB(sk['elbB'], DB), PB(sk['handB'], DB), r_limb_lo)
    esfera(PB(sk['handB'], DB), r_limb_lo * 1.5)  # punho
    capsula(PB(sk['neck'], DF), PB(sk['elbF'], DF), r_limb)
    capsula(PB(sk['elbF'], DF), PB(sk['handF'], DF), r_limb_lo)
    esfera(PB(sk['handF'], DF), r_limb_lo * 1.5)
    # cabeça
    esfera(P(sk['head']), w['headR'] * S)

for nome, frames in data['states'].items():
    for i, sk in enumerate(frames):
        for o in corpo:
            bpy.data.objects.remove(o, do_unlink=True)
        corpo.clear()
        monta(sk)
        scene.render.filepath = f'{OUT_DIR}/{nome}_{i:02d}.png'
        bpy.ops.render.render(write_still=True)
        print(f'frame {nome} {i + 1}/{len(frames)}')
print('RENDER_3D_COMPLETO')
