# Pastora · demo de web pública + app de mesa (iNGENIA)

Dos cosas en un solo sitio estático (sin instalar nada, sin servidor):

| Qué | Dónde | Quién lo hace |
|---|---|---|
| **Web pública** (Instagram / WhatsApp): portada con **Reservar** y **Carta** primeros, carta, reservas, contacto | `index.html` + `css/web.css` + `js/web.js` | **De cero para cada local** (acá: Pastora) |
| **App de mesa** (la que abre el QR): carta, armar pedido, llamar al mozo, pedir la cuenta, ver cómo avanza el pedido | `mesa/index.html` + `js/mesa.js` + `css/mesa.css` | **Base fija**; solo cambia su piel |
| **Piel** (colores, tipografías, componentes) | `css/piel.css`, `img/`, `fonts/`, `js/config.js` | Se rehace en el chat de cada cliente. La web y la app de mesa la **comparten**, por eso se ven iguales |
| Conexión con el panel | `js/panel.js` (no se toca) | Fija |

## Movimiento (sensación de «motion site»)
- Todo local, sin internet ni CDN: **GSAP + ScrollTrigger** (animación) y **Lenis** (scroll suave) en `js/vendor/`. La lógica está en `js/motion.js`.
- **Portada = escena que se recorre**: entrás desde la fachada, se dibuja un arco dorado y se abre hacia el salón; después aparecen los trazos dorados (taza, vino, pan, ramita) y el texto. Está fijada ~3 pantallas de scroll (`end` en `armarEscena`).
- Entradas por scroll en títulos, platos y reservas; el tilde de «reserva lista» se dibuja; cursor con aro y botones «magnéticos» (solo mouse); la barra superior se esconde al bajar y vuelve al subir.
- **App de mesa**: la cabecera, la barra de abajo y el botón «Ver mi pedido» quedan fijos; solo cambia la vista, con transición. Indicador dorado que se desliza entre pestañas, burbuja del pedido que «salta», vibración corta al sumar (celulares).
- Decisiones de siempre respetadas: nada de franjas que se deslizan ni zoom letra por letra; el zoom es gradual.
- **Si la persona pidió «reducir animaciones»** (o si algo falla a los 5 s), la web se ve estática y completa. Para probarlo: agregar `?quieto=1` a la dirección.
- **Controles propios**: la lista «Dónde» y el calendario de «Día» (`js/controles.js` + final de `css/piel.css`) reemplazan los del navegador, que no se pueden diseñar. Los originales quedan ocultos y siguen mandando el valor.
- Para otro cliente: lo que cambia es la **escena** (imágenes y trazos en `index.html`, `.escena`) y la piel; `motion.js` se reutiliza.

## Cómo se ve ahora (modo demostración)
`js/config.js` tiene `PANEL_URL` vacío → funciona **sin conexión** con una carta de ejemplo (datos inventados) y un «mozo» simulado: el pedido de la app de mesa pasa solo de «Esperando confirmación» a «Recibido», «En preparación», «Listo» y «Entregado».
- Web: abrí `index.html` (o la dirección donde esté publicada).
- App de mesa: `mesa/?mesa=abcdefghij0123456789ABCD` (cualquier código de 24 letras/números sirve en la demo). Un código corto muestra la pantalla de «código no activo».
- El QR real apunta a `https://TU-SITIO/?mesa=CÓDIGO`: `index.html` lo manda solo a la app de mesa.

## Conectarlo al panel real (después de la demo offline)
1. En el panel Restó del cliente: módulos **Mesas** y **Reservas** activos, carta cargada, «Reservas por la web» y «QR de mesa» activados, mesas con su QR creado.
2. Lanzador → tarjeta «Conexión con la web» → copiar la URL `/exec` y pegarla en `js/config.js` (`PANEL_URL`). Probar `PANEL_URL?ping=1` en una ventana de incógnito.
3. En Ajustes del panel poner la «Dirección de la web» (`webUrl`) = dirección donde se publique este sitio: así el QR de cada mesa sale con el enlace correcto.
4. Poner en `config.js` el WhatsApp, Instagram, dirección y horarios reales. Los textos de portada y el lema son de ejemplo.
5. Probar: reservar desde la web (aparece en **Reservas** del panel), pedir desde una mesa por QR (aparece «por confirmar» en **Mesas**, con burbujita para el mozo).

## Publicar para las pruebas
GitHub Pages (cuenta de chatbot): repo público → Settings → Pages → rama `main`, carpeta raíz. Cada vez que se sube un cambio, se actualiza solo y no gasta créditos de Netlify. Cuando el cliente se confirma, se pasa a su propio Netlify.

## Qué es de ejemplo en esta demo
Carta y precios (inventados), «Te esperamos con la mesa lista.», el párrafo de la portada, «Santa Fe, Argentina». Las imágenes y el logo son los que mandó el local.
