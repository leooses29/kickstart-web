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
