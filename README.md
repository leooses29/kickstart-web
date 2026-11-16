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
- Plantillas cargadas: GF Travel (historia 1080×1920).
