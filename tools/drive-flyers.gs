/**
 * Google Drive para el Generador de flyers del portal de agencias:
 *  - guardar: guarda un flyer en la carpeta "Paquetes vigentes" de la agencia.
 *  - fondos: lista las fotos del Banco de fondos para un destino (con miniaturas).
 *  - fondo: devuelve una foto del banco en tamaño grande (máx. 2000 px).
 * Se pega en script.google.com con la cuenta de Kickstart dueña (o editora) de las carpetas, y se publica como
 * aplicación web. Ver README (Generador de flyers → Drive).
 *
 * Solo recibe pedidos de la función /api/flyer-drive de la web (que manda la clave secreta). Solo guarda en carpetas
 * cuyo nombre diga "Paquetes vigentes" y solo entrega fotos que estén dentro de las carpetas de fondos que le pasa la web.
 */
function doPost(e) {
  try {
    var p = JSON.parse(e.postData.contents);
    var secreto = PropertiesService.getScriptProperties().getProperty('SECRETO');
    if (!secreto || p.secreto !== secreto) return respuesta({ ok: false, error: 'secreto' });
    if (p.accion === 'fondos') return respuesta(listarFondos(p));
    if (p.accion === 'fondo') return respuesta(leerFondo(p));
    return respuesta(guardar(p));
  } catch (err) {
    return respuesta({ ok: false, error: 'drive', detalle: String(err).slice(0, 300) });
  }
}

function guardar(p) {
  var carpeta = DriveApp.getFolderById(String(p.carpeta || ''));
  if (!/paquetes\s*vigentes/i.test(carpeta.getName())) return { ok: false, error: 'carpeta' };
  var tipo = p.tipo === 'image/jpeg' ? 'image/jpeg' : 'image/png';
  var nombre = String(p.nombre || 'flyer').replace(/[\\/:*?"<>|]/g, '-').slice(0, 150);
  var blob = Utilities.newBlob(Utilities.base64Decode(p.datos), tipo, nombre);
  var archivo = carpeta.createFile(blob);
  return { ok: true, id: archivo.getId(), url: archivo.getUrl(), nombre: archivo.getName() };
}

// --- Banco de fondos ---
function normalizar(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function fotosDe(carpeta, origen, max) {
  var fotos = [], it = carpeta.getFiles();
  while (it.hasNext() && fotos.length < max) {
    var f = it.next();
    if (!/^image\//.test(f.getMimeType())) continue;
    var mini = imagen(f.getId(), 400);
    if (!mini) continue;
    fotos.push({ id: f.getId(), nombre: f.getName().replace(/\.[^.]+$/, ''), origen: origen, miniatura: mini });
  }
  return fotos;
}

// Imagen achicada por Drive (lado mayor = tam) en base64 JPEG
function imagen(id, tam) {
  var token = ScriptApp.getOAuthToken();
  var meta = JSON.parse(UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + id + '?fields=thumbnailLink',
    { headers: { Authorization: 'Bearer ' + token } }).getContentText());
  if (!meta.thumbnailLink) return null;
  var url = meta.thumbnailLink.replace(/=s\d+$/, '') + '=s' + tam;
  var r = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) return null;
  return Utilities.base64Encode(r.getBlob().getBytes());
}

function listarFondos(p) {
  var banco = DriveApp.getFolderById(String(p.banco || ''));
  var buscado = normalizar(p.destino);
  var destinos = [], elegida = null, general = null, it = banco.getFolders();
  while (it.hasNext()) {
    var c = it.next(), n = normalizar(c.getName());
    if (/^general/.test(n)) { general = c; continue; }
    destinos.push(c.getName());
    if (buscado && !elegida && (buscado.indexOf(n) >= 0 || n.indexOf(buscado) >= 0)) elegida = c;
  }
  if (p.carpetaNombre) {   // la agencia eligió un destino de la lista
    var it2 = banco.getFoldersByName(String(p.carpetaNombre));
    if (it2.hasNext()) elegida = it2.next();
  }
  var fotos = [];
  if (p.agencia) {
    try { fotos = fotos.concat(fotosDe(DriveApp.getFolderById(String(p.agencia)), 'agencia', 12)); } catch (e) {}
  }
  if (elegida) fotos = fotos.concat(fotosDe(elegida, 'destino', 18));
  if (general && fotos.length < 24) fotos = fotos.concat(fotosDe(general, 'general', 24 - fotos.length));
  destinos.sort();
  return { ok: true, destinos: destinos, elegido: elegida ? elegida.getName() : null, fotos: fotos };
}

// Solo entrega fotos que estén dentro del banco o de la carpeta de la agencia (hasta 3 niveles)
function dentroDe(archivo, permitidas) {
  var nivel = [archivo], vistos = 0;
  for (var i = 0; i < 3; i++) {
    var siguiente = [];
    for (var j = 0; j < nivel.length; j++) {
      var it = nivel[j].getParents();
      while (it.hasNext()) {
        var c = it.next();
        if (permitidas.indexOf(c.getId()) >= 0) return true;
        siguiente.push(c);
        if (++vistos > 20) return false;
      }
    }
    nivel = siguiente;
  }
  return false;
}

function leerFondo(p) {
  var f = DriveApp.getFileById(String(p.id || ''));
  var permitidas = [String(p.banco || '')].concat(p.agencia ? [String(p.agencia)] : []);
  if (!dentroDe(f, permitidas)) return { ok: false, error: 'fuera' };
  var datos = imagen(f.getId(), 2000);
  if (!datos) return { ok: false, error: 'imagen' };
  return { ok: true, tipo: 'image/jpeg', datos: datos };
}

function respuesta(obj) {
  console.log(JSON.stringify(obj).slice(0, 500));
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Correr una vez a mano desde el editor para dar los permisos de Drive y de conexión externa (no hace nada más). */
function autorizar() {
  DriveApp.getRootFolder().getName();
  UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/about?fields=user', { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } });
}
