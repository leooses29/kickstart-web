"""Publica la planificación de cada agencia en el portal (portal/data/), encriptada con su código.

Uso:
  python3 -I tools/publicar_portal.py --out portal/data <dump_planificador_1> [<dump_planificador_2> ...]

Cada <dump> es una carpeta con el volcado de un planificador: <dump>/<colección>/<id>.json
(empresas, posts, notas, reportes, guiones). Solo se publican las empresas que tienen cargado
el campo "portalCodigo" en el planificador. El archivo de cada agencia queda encriptado con
AES-GCM y una clave derivada de su código (PBKDF2-SHA256), igual que lo lee portal/js/portal.js.

Incluye solo datos aptos para el cliente: título, formato, fecha, pilar, objetivo, propuesta de edición, copy, link final,
estado por paso, guiones, objetivos, reportes (anuncios y orgánico) y el Drive para el cliente (portalDrive). Nunca responsables, comentarios internos ni el Drive interno de trabajo.
"""
import argparse, base64, datetime, glob, json, os, re, unicodedata

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

ITER = 200000
MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
TRIM = ['T1 · enero – marzo', 'T2 · abril – junio', 'T3 · julio – septiembre', 'T4 · octubre – diciembre']
KEEP = ['id', 'titulo', 'tipo', 'fecha', 'pilar', 'objetivo', 'edicion', 'copy', 'contenidoOk', 'portada', 'planificacion', 'diseno', 'programacion']


def slugify(s):
    s = unicodedata.normalize('NFD', s or '').encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-') or 'agencia'


def load(dump, col):
    rows = []
    for f in glob.glob(os.path.join(dump, col, '*.json')):
        d = json.load(open(f, encoding='utf-8'))
        data = d.get('data', d) if isinstance(d.get('data'), dict) else d
        data = dict(data)
        data['id'] = d.get('id') or os.path.basename(f)[:-5]
        rows.append(data)
    return rows


def payload(dump, emp, now):
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
        if r.get('empresaId') != eid or not r.get('link'):
            continue  # los archivos subidos al planificador no son públicos: el portal solo muestra reportes con link
        per = r.get('periodo', '')
        texto = ''
        if re.fullmatch(r'\d{4}-T[1-4]', per):
            y, q = per.split('-T')
            texto = TRIM[int(q) - 1].split(' · ')[1] + ' ' + y
        reps.append({'titulo': r.get('titulo', ''), 'tipo': r.get('tipo') or 'organico', 'periodo': per,
                     'periodoLabel': r.get('periodoLabel', per), 'periodoTexto': texto, 'link': r.get('link', '')})
    reps.sort(key=lambda r: r['periodo'], reverse=True)
    guiones = [{'id': g['id'], 'titulo': g.get('titulo', ''), 'guion': g.get('guion', ''), 'postId': g.get('postId', ''), 'mes': g.get('mes', '')}
               for g in load(dump, 'guiones') if g.get('empresaId') == eid and (g.get('guion') or g.get('titulo'))]
    guiones.sort(key=lambda g: (g['mes'], g['id']))
    guion_rec = {k.split('__')[2]: v.get('texto', '') for k, v in notas.items() if '__guionrec__' in k and v.get('texto')}
    return {
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
    lista, usados = [], set()
    for dump in a.dumps:
        for emp in load(dump, 'empresas'):
            code = str(emp.get('portalCodigo') or '').strip()
            if not code:
                continue
            slug = slugify(emp.get('portalSlug') or emp.get('nombre'))
            base, n = slug, 2
            while slug in usados:
                slug, n = f'{base}-{n}', n + 1
            usados.add(slug)
            with open(os.path.join(a.out, slug + '.json'), 'w', encoding='utf-8') as f:
                json.dump(encriptar(payload(dump, emp, now), code), f)
            lista.append({'slug': slug, 'nombre': emp.get('nombre', slug)})
            print(f"  {emp.get('nombre')}: publicada como {slug}")
    for f in glob.glob(os.path.join(a.out, '*.json')):
        name = os.path.basename(f)[:-5]
        if name != 'agencias' and name not in usados:
            os.remove(f)  # agencia sin código: deja de estar en el portal
    with open(os.path.join(a.out, 'agencias.json'), 'w', encoding='utf-8') as f:
        json.dump(sorted(lista, key=lambda x: x['nombre']), f, ensure_ascii=False, indent=1)
    print(f'{len(lista)} agencias publicadas en el portal')


if __name__ == '__main__':
    main()
