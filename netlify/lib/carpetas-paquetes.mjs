// Carpeta "Paquetes vigentes" de Google Drive de cada agencia, donde el Generador de flyers guarda los flyers.
// Clave: id de la agencia en el portal (hash del usuario, el mismo nombre que portal/data/<id>.json).
// Valor: id de la carpeta (lo que va después de /folders/ en el link de Drive).
// Este archivo solo lo usa la función del servidor: no se publica en la web.
export const CARPETAS_PAQUETES = {
  // GF Travel → MATERIAL MARKETING / Paquetes vigentes
  fde3d5ab427a36814efab95c61efc39f: '1R8FmlAxxdlZzYoalaFp2TWGo2Xk5y1U-',
  // Aterrizar Villa María → Aterrizar / 11. At Villa Maria / Paquetes Vigentes
  '4477ac64fa38984db569f9cf1cde96bc': '1dV_cKTQ0xqVJEoaotZAyJntK8KhJ67ER',
};
