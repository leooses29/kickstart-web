/**
 * Guarda en Google Drive los flyers del Generador de flyers del portal de agencias.
 * Se pega en script.google.com con la cuenta de Kickstart que es dueña (o editora) de las carpetas
 * "Paquetes vigentes" de cada agencia, y se publica como aplicación web. Ver README (Generador de flyers → Drive).
 *
 * Solo recibe pedidos de la función /api/flyer-drive de la web (que manda la clave secreta) y solo guarda
 * dentro de carpetas cuyo nombre diga "Paquetes vigentes".
 */
function doPost(e) {
  try {
    var p = JSON.parse(e.postData.contents);
    var secreto = PropertiesService.getScriptProperties().getProperty('SECRETO');
    if (!secreto || p.secreto !== secreto) return respuesta({ ok: false, error: 'secreto' });

    var carpeta = DriveApp.getFolderById(String(p.carpeta || ''));
    if (!/paquetes\s*vigentes/i.test(carpeta.getName())) return respuesta({ ok: false, error: 'carpeta' });

    var tipo = p.tipo === 'image/jpeg' ? 'image/jpeg' : 'image/png';
    var nombre = String(p.nombre || 'flyer').replace(/[\\/:*?"<>|]/g, '-').slice(0, 150);
    var blob = Utilities.newBlob(Utilities.base64Decode(p.datos), tipo, nombre);
    var archivo = carpeta.createFile(blob);
    return respuesta({ ok: true, id: archivo.getId(), url: archivo.getUrl(), nombre: archivo.getName() });
  } catch (err) {
    return respuesta({ ok: false, error: 'drive', detalle: String(err).slice(0, 300) });
  }
}

function respuesta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Correr una vez a mano desde el editor para dar los permisos de Drive (no hace nada más). */
function autorizar() {
  DriveApp.getRootFolder().getName();
}
