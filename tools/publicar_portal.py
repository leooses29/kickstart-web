"""Publica los datos de cada agencia en el portal (portal/data/), encriptados con su contraseña.

Uso:
  python3 -I tools/publicar_portal.py --out portal/data <dump_planificador_1> [<dump_planificador_2> ...]

Cada <dump> es una carpeta con el volcado de un planificador: <dump>/<colección>/<id>.json
(empresas, posts, notas, reportes, guiones). Los reportes subidos como archivo se buscan en
<dump>/archivos/<assetId>.<ext> (los baja la tarea programada antes de correr este script).

Solo se publican las empresas que tienen cargada la contraseña del portal (campo "portalCodigo").
La agencia entra con su usuario (campo "portalUsuario"; si está vacío, el nombre de la empresa) y su contraseña.
El archivo de cada agencia se llama con un hash del usuario, así que ningún nombre de agencia queda a la vista,
y va encriptado con AES-GCM y una clave derivada de la contraseña (PBKDF2-SHA256), igual que lo lee portal/js/portal.js.
No se publica ninguna lista de agencias.

Tipo de servicio (campo "portalTipo"): "anuncios" = la agencia solo ve sus reportes; cualquier otro valor = servicio completo.

Incluye solo datos aptos para el cliente: título, formato, fecha, pilar, objetivo, propuesta de edición, copy, link final,
estado por paso, guiones, objetivos, reportes (anuncios y orgánico) y el Drive para el cliente (portalDrive). Nunca responsables,
comentarios internos ni el Drive interno de trabajo. Un reporte subido como archivo solo se publica si está marcado "portal": true.
"""
import argparse, base64, datetime, glob, hashlib, json, os, re, unicodedata

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

ITER = 200000
MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
TRIM = ['T1 · enero – marzo', 'T2 · abril – junio', 'T3 · julio – septiembre', 'T4 · octubre – diciembre']
KEEP = ['id', 'titulo', 'tipo', 'fecha', 'pilar', 'objetivo', 'edicion', 'copy', 'contenidoOk', 'portada', 'planificacion', 'diseno', 'programacion']
MIME = {'html': 'text/html', 'htm': 'text/html', 'pdf': 'application/pdf', 'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'webp': 'image/webp'}


def normalizar_usuario(s):
    # Igual que normUsuario() en portal/js/portal.js: sin tildes, minúsculas, solo letras y números
    s = unicodedata.normalize('NFD', s or '').encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]', '', s.lower())


def id_usuario(usuario):
    return hashlib.sha256(('kickstart-portal|' + normalizar_usuario(usuario)).encode()).hexdigest()[:32]


def load(dump, col):
    rows = []
    for f in glob.glob(os.path.join(dump, col, '*.json')):
        d = json.load(open(f, encoding='utf-8'))
        data = d.get('data', d) if isinstance(d.get('data'), dict) else d
        data = dict(data)
        data['id'] = d.get('id') or os.path.basename(f)[:-5]
        rows.append(data)
    return rows


def periodo_textos(per):
    """Devuelve (etiqueta, texto) de un período mensual (2026-10) o trimestral (2026-T4)."""
    if re.fullmatch(r'\d{4}-T[1-4]', per):
        y, q = per.split('-T')
        return f'T{q} {y}', TRIM[int(q) - 1].split(' · ')[1] + ' ' + y
    if re.fullmatch(r'\d{4}-\d{2}', per):
        y, m = per.split('-')
        return f'{MESES[int(m) - 1]} {y}', ''
    return per, ''


def archivo_de(dump, asset_id):
    if not asset_id or not re.fullmatch(r'[\w-]+', asset_id):
        return None
    hits = sorted(glob.glob(os.path.join(dump, 'archivos', asset_id + '*')))
    return hits[0] if hits else None


def payload(dump, emp, now, code, slug, out, usados_r):
    eid = emp['id']
    posts = [{k: p.get(k, '') for k in KEEP} for p in load(dump, 'posts') if p.get('empresaId') == eid and p.get('fecha')]
    notas = {n['id']: n for n in load(dump, 'notas') if n['id'].startswith(eid + '__')}
    obj_mes = {k.split('__')[2]: v.get('texto', '') for k, v in notas.items() if '__mes__' in k and v.get('texto')}
    obj_trim = []
    for k, v in sorted(notas.items()):
        if '__trim__' in k and (v.get('general') or v.get('especificos')):
            y, q = k.split('__')[2].split('-T')
            obj_trim.append({'label': f"{TRIM[int(q) - 1]} {y}", 'general': v.get('general', ''), 'especificos': v.get('especificos', '')})
    reps = []
    for r in load(dump, 'reportes'):
        if r.get('empresaId') != eid:
            continue
        per = r.get('periodo', '')
        label, texto = periodo_textos(per)
        rep = {'titulo': r.get('titulo', ''), 'tipo': r.get('tipo') or 'organico', 'periodo': per,
               'periodoLabel': r.get('periodoLabel') or label, 'periodoTexto': texto}
        if r.get('link'):
            rep['link'] = r['link']
        elif r.get('assetId') and r.get('portal') is True:
            path = archivo_de(dump, r['assetId'])
            if not path:
                print(f"  AVISO {emp.get('nombre')}: no se encontró el archivo del reporte {per} ({r['assetId']}); no se publica")
                continue
            nombre = r.get('nombreArchivo') or os.path.basename(path)
            ext = (nombre.rsplit('.', 1)[-1] if '.' in nombre else path.rsplit('.', 1)[-1]).lower()
            rid = hashlib.sha256(f"{slug}|{r['id']}|{r['assetId']}".encode()).hexdigest()[:32]
            datos = open(path, 'rb').read()
            caja = {'tipo': MIME.get(ext, 'application/octet-stream'), 'nombre': nombre, 'datos': base64.b64encode(datos).decode()}
            os.makedirs(os.path.join(out, 'r'), exist_ok=True)
            with open(os.path.join(out, 'r', rid + '.json'), 'w', encoding='utf-8') as f:
                json.dump(encriptar(caja, code), f)
            usados_r.add(rid)
            rep['archivo'] = rid
        else:
            continue  # archivo sin marcar para el portal: queda solo para el equipo
        reps.append(rep)
    reps.sort(key=lambda r: r['periodo'], reverse=True)
    guiones = [{'id': g['id'], 'titulo': g.get('titulo', ''), 'guion': g.get('guion', ''), 'postId': g.get('postId', ''), 'mes': g.get('mes', '')}
               for g in load(dump, 'guiones') if g.get('empresaId') == eid and (g.get('guion') or g.get('titulo'))]
    guiones.sort(key=lambda g: (g['mes'], g['id']))
    guion_rec = {k.split('__')[2]: v.get('texto', '') for k, v in notas.items() if '__guionrec__' in k and v.get('texto')}
    return {
        'tipo': 'anuncios' if emp.get('portalTipo') == 'anuncios' else 'completo',
        'empresa': {k: emp.get(k, '') for k in ['nombre', 'cuotaReels', 'cuotaHistorias', 'cuotaCarruseles', 'cuotaPosteos']},
        'drive': (emp.get('portalDrive') or '').strip(),
        'posts': posts, 'guiones': guiones, 'guionRec': guion_rec, 'objMes': obj_mes, 'objTrim': obj_trim, 'reportes': reps,
        'actualizado': f"{now.day} de {MESES[now.month - 1]} de {now.year}",
    }


def encriptar(obj, code):
    salt, iv = os.urandom(16), os.urandom(12)
    key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITER).derive(code.strip().encode())
    ct = AESGCM(key).encrypt(iv, json.dumps(obj, ensure_ascii=False).encode(), None)
    b = lambda x: base64.b64encode(x).decode()
    return {'v': 1, 'salt': b(salt), 'iv': b(iv), 'ct': b(ct)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    ap.add_argument('dumps', nargs='+')
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-3)))
    usados, usados_r, n = {}, set(), 0
    for dump in a.dumps:
        for emp in load(dump, 'empresas'):
            code = str(emp.get('portalCodigo') or '').strip()
            if not code:
                continue
            usuario = str(emp.get('portalUsuario') or '').strip() or emp.get('nombre', '')
            if not normalizar_usuario(usuario):
                print(f"  AVISO {emp.get('nombre')}: el usuario no tiene letras ni números; no se publica")
                continue
            slug = id_usuario(usuario)
            if slug in usados:
                print(f"  AVISO {emp.get('nombre')}: el usuario \"{usuario}\" ya lo usa {usados[slug]}; no se publica. Cambiale el usuario en el planificador.")
                continue
            usados[slug] = emp.get('nombre', '')
            with open(os.path.join(a.out, slug + '.json'), 'w', encoding='utf-8') as f:
                json.dump(encriptar(payload(dump, emp, now, code, slug, a.out, usados_r), code), f)
            n += 1
            print(f"  {emp.get('nombre')}: publicada (usuario \"{normalizar_usuario(usuario)}\")")
    # Lo que ya no corresponde se borra: agencias sin contraseña, usuarios cambiados, reportes quitados y la vieja lista de agencias
    for f in glob.glob(os.path.join(a.out, '*.json')):
        if os.path.basename(f)[:-5] not in usados:
            os.remove(f)
    for f in glob.glob(os.path.join(a.out, 'r', '*.json')):
        if os.path.basename(f)[:-5] not in usados_r:
            os.remove(f)
    print(f'{n} agencias publicadas en el portal')


if __name__ == '__main__':
    main()
