# kickstartmarketing.com.ar

Sitio de Kickstart Marketing y portal de agencias. Se publica solo en Netlify con cada cambio en `main`.

## Portal de agencias — planificación

- Cada agencia entra en `/portal/login.html`, elige su nombre y escribe su **código de acceso**.
- Los códigos se cargan en el Planificador Kickstart (Empresas → Modificar → "Código de acceso al portal").
  Una empresa sin código no aparece en el portal.
- `portal/data/<agencia>.json` guarda la planificación de cada agencia **encriptada con su código**
  (AES-GCM + PBKDF2). Sin el código correcto no se puede leer. `portal/data/agencias.json` solo lista nombres.
- La tarea programada "Vistas de clientes Kickstart" regenera estos archivos todas las mañanas con
  `tools/publicar_portal.py` y los sube a este repositorio.

Para cambiar el código de una agencia: editalo en el planificador. La próxima actualización vuelve a encriptar
sus datos con el código nuevo y el anterior deja de funcionar.

## Portal de agencias — Generador de Guiones (IA)

- Página: `/portal/guiones-ads.html`. La agencia carga destino, paquete y precio y recibe un guion de 20–25 s
  (hook principal, guion por bloques, 3 hooks alternativos y copy). Cada guion o nueva versión usa 1 crédito.
- Funciones de Netlify: `netlify/functions/ia.mjs` (`/api/ia`) y `netlify/functions/ia-admin.mjs` (`/api/ia-admin`).
  La lógica está en `netlify/lib/ia-core.mjs`; las instrucciones de la IA en `netlify/lib/instrucciones.mjs`
  (editá ese texto para ajustar la estrategia).
- La función verifica a la agencia abriendo su archivo encriptado con el código que manda; no guarda contraseñas.
- Créditos y guiones generados se guardan en Netlify Blobs (store `generador-guiones`). Se reinician el 1° de cada mes.
- Panel interno: `/portal/admin-ia.html` (uso por agencia, costo aproximado, guiones con 👍/👎 y comentarios, sumar créditos).

Variables de entorno en Netlify (Site configuration → Environment variables):

| Variable | Para qué |
|---|---|
| `ANTHROPIC_API_KEY` | Clave de la API de Anthropic (secreta). Sin ella la herramienta muestra "se está configurando". |
| `ADMIN_KEY` | Clave del panel interno (mínimo 12 caracteres). |
| `ANTHROPIC_MODEL` | Opcional. Por defecto `claude-sonnet-5-5`. |
| `CREDITOS_MES` | Opcional. Créditos por agencia por mes; por defecto 40. Por agencia: campo `iaCreditos` en el planificador. |

## Portal de agencias — Generador de flyers

- Página: `/portal/flyers.html`. La agencia carga los datos del paquete y una foto de fondo y descarga el flyer en PNG
  con su estética. No usa IA ni créditos: todo se dibuja en el navegador.
- La estética de cada agencia está en `portal/flyers/<id>/plantilla.js`, donde `<id>` es el mismo hash del usuario que
  usa `portal/data/<id>.json` (así no queda a la vista el nombre de la agencia). En esa carpeta van también los logos,
  las tipografías y la foto de muestra.
- Solo las agencias que tienen carpeta ven el generador en el menú y en el panel; al resto les sigue apareciendo "Próximamente".
- Para sumar una agencia: calcular su id con `python3 -c "import sys; sys.path.insert(0,'tools'); import publicar_portal as p; print(p.id_usuario('USUARIO'))"`,
  copiar una carpeta existente con ese nombre y adaptar `plantilla.js` (campos, textos por defecto y la función `dibujar`).
- **Ordenar la info con IA** (arriba del formulario): la agencia pega toda la info del paquete o sube la foto de un flyer
  o el PDF del operador, y la IA deja solo lo que va en el flyer (destino, fecha, qué incluye, llamado a la acción, precio,
  moneda y aclaración), respetando los límites de caracteres. Lo que queda afuera se muestra como "usalo en el copy".
  Usa `/api/ia` con la acción `flyer`, descuenta 1 crédito (los mismos del Generador de Guiones) y queda registrado en
  Netlify Blobs (`flyers/<mes>/`), visible en el panel interno. Las instrucciones están en `netlify/lib/instrucciones-flyer.mjs`.
  Cada plantilla indica qué campo completa cada dato (`ia` en `plantilla.js`) y los límites de cada campo (`max`, `lineas`).
- Formatos: cada plantilla define los suyos en `formatos` (la agencia elige en la vista previa y puede descargar todos juntos;
  cada formato guarda su propio encuadre de la foto). `dibujar` recibe `h.formato`, `h.W` y `h.H`.
- **Guardar en Drive**: el botón "Guardar en Paquetes vigentes (Drive)" sube el flyer del formato que se está viendo a la
  carpeta "Paquetes vigentes" de la agencia. Solo aparece si la agencia tiene carpeta en `netlify/lib/carpetas-paquetes.mjs`
  (id de la agencia → id de la carpeta de Drive) y si están configuradas las variables de abajo. La función es
  `netlify/functions/flyer-drive.mjs` (`/api/flyer-drive`) y la subida la hace una aplicación web de Google Apps Script
  (`tools/drive-flyers.gs`) con la cuenta de Kickstart, que solo guarda en carpetas cuyo nombre diga "Paquetes vigentes".

  Configuración (una sola vez):
  1. Con la cuenta de Kickstart que puede editar las carpetas, entrar a script.google.com → Nuevo proyecto, pegar
     `tools/drive-flyers.gs` y guardar.
  2. Configuración del proyecto (engranaje) → Propiedades del script → agregar `SECRETO` con una clave larga inventada.
  3. Elegir la función `autorizar` → Ejecutar → aceptar los permisos de Drive.
  4. Implementar → Nueva implementación → Tipo: Aplicación web → Ejecutar como: Yo → Quién tiene acceso: Cualquier persona → Implementar.
     Copiar la URL que termina en `/exec`.
  5. En Netlify → Site configuration → Environment variables: `DRIVE_WEBAPP_URL` = esa URL y `DRIVE_SECRET` = la misma clave
     del paso 2. Volver a publicar el sitio (Deploys → Trigger deploy).

  Para sumar otra agencia: agregar su línea en `netlify/lib/carpetas-paquetes.mjs`.
- **Fondos sugeridos**: el generador muestra fotos del "Banco de fondos Kickstart" de Drive (una subcarpeta por destino y
  una "General"). Busca la subcarpeta que coincide con el destino cargado (o la que se elija de la lista) y suma las
  generales. Para agregar fotos alcanza con subirlas a la carpeta del destino: no hay que publicar nada. Fotos propias de
  una agencia: agregar su carpeta en `FONDOS_AGENCIA` (`netlify/lib/carpetas-paquetes.mjs`) y aparecen primero.
  Lo sirve el mismo script de Google (`tools/drive-flyers.gs`, acciones `fondos` y `fondo`).
- **Encuadre automático**: al poner una foto (subida o del banco), la IA marca dónde están las personas (acción `encuadre`
  de `/api/ia`, no usa créditos; tope de 400 por agencia por mes) y el generador elige para cada formato el zoom y la
  posición en que el texto de la plantilla no tape caras ni cuerpos. Las zonas de texto se miden solas a partir de lo que
  dibuja cada plantilla, así que sirve para cualquier plantilla nueva sin configurar nada.
- Plantillas cargadas: GF Travel y Aterrizar Villa María (las dos con historia 1080×1920 y cuadrado 1080×1080).
  La de Aterrizar usa las tipografías originales del PSD (Gilroy y Travellia), cargadas como .woff2 en su carpeta.
  La de Netanya Viajes (`b03441d78ee8cf115e38f15015eaa4d5`, solo anuncios) replica el PSD "flyer_estetica_2"; usa Kanit
  en lugar de Kiro (la del PSD, paga): para pasar a Kiro, subir sus .woff2 y cambiar `fuentes` y `FONT` en su plantilla.js.
  Las fuentes aceptan `style: 'italic'` en `fuentes`.

## Portal de agencias — Secuencia de historias

- Página: `/portal/historias.html`. Con el flyer de un paquete vigente arma 3 historias 1080×1920 para publicar seguidas:
  **hook** (frase que frena el scroll sobre una foto) → **info del paquete** (destino, fecha y qué incluye, *sin precio*)
  o **llamado a la acción** → **flyer** (con el precio). El orden se puede cambiar a hook → flyer → medio.
- La estética de cada agencia está en `portal/flyers/<id>/historias.js`, en la misma carpeta que la plantilla del flyer
  (usa sus logos y tipografías). Solo las agencias que tienen ese archivo ven la herramienta en el menú y en el panel.
  Para sumar una agencia: copiar `historias.js` de GF Travel a su carpeta y adaptar colores, logos y la función `dibujar`.
- **Desde el Generador de flyers**: el botón "Armar secuencia de historias con este flyer" pasa el flyer, los datos y la
  foto a esta página (se guardan un momento en el navegador, en IndexedDB). También se puede subir un flyer ya hecho y
  leerlo con IA (acción `flyer`, 1 crédito).
- **Hooks con IA**: acción `hooks` de `/api/ia`, 1 crédito por cada tanda de 5 hooks (+ 3 frases de llamado a la acción).
  Usan el MISMO criterio que el Generador de Guiones: las fórmulas de hook y los hooks prohibidos están una sola vez en
  `netlify/lib/instrucciones.mjs` (`FORMULAS_HOOK` y `HOOKS_PROHIBIDOS`) y los usan las dos herramientas. Lo propio de las
  historias está en `netlify/lib/instrucciones-historias.mjs`. Se registran en Netlify Blobs (`historias/<mes>/`) y se ven en el panel interno.
- **Guardar en Drive**: el botón "Guardar en Drive" sube las 3 a `Paquetes vigentes / Secuencia de historias / <Destino - Fecha>`
  (las carpetas se crean solas) como `Historia 1 de 3`, `2 de 3` y `3 de 3`. Si se vuelve a guardar el mismo paquete, se
  reemplazan (las anteriores van a la papelera de Drive). Usa la misma carpeta y conexión que el Generador de flyers
  (`netlify/lib/carpetas-paquetes.mjs` y `tools/drive-flyers.gs`), con la acción `guardar-historia` de `/api/flyer-drive`.
  Necesita el script de Google en su **versión 2**: si está el viejo, la web no guarda nada y avisa. Para actualizarlo:
  script.google.com → abrir el proyecto → reemplazar todo el código por `tools/drive-flyers.gs` → Guardar →
  Implementar → Administrar implementaciones → lápiz → Versión: "Nueva versión" → Implementar (la URL no cambia).
- Descargas: las 3 salen numeradas en orden de publicación (`..._01-hook.png`, `..._02-info.png`, `..._03-flyer.png`).
  El sticker de link se agrega al publicar (la API de Instagram no permite ponerlo); la vista previa marca dónde va.
