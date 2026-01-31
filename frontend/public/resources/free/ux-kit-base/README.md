# UX Kit Base v1.0 (FREE)

## Notas UX por Componente

### Botón Primario (`button-primary`)

**Por qué es buena práctica:**
- **Área táctil mínima de 44×44px**: Cumple con WCAG 2.1 AA para targets táctiles, garantizando que sea fácil de tocar en dispositivos móviles.
- **Estados claros**: Los cambios visuales en hover, active y focus comunican retroalimentación inmediata al usuario.
- **Outline en focus**: El indicador de focus visible ayuda a usuarios de teclado a navegar la interfaz.
- **Estado disabled distinguible**: La opacidad reducida y cursor not-allowed comunican claramente que la acción no está disponible.

---

### Card Básica (`card-basic`)

**Por qué es buena práctica:**
- **Estructura modular**: Header, body y footer son opcionales, permitiendo flexibilidad sin sacrificar consistencia.
- **Hover sutil**: La elevación mediante shadow en hover indica interactividad sin ser abrumadora.
- **Separadores visuales**: Los bordes entre secciones crean jerarquía visual clara.
- **Espaciado consistente**: El padding uniforme facilita la escaneabilidad del contenido.

---

### Input de Texto (`input-text`)

**Por qué es buena práctica:**
- **Label siempre visible**: Nunca usar placeholder como label. El label persiste después de que el usuario escribe.
- **Estados de validación claros**: Border rojo + mensaje de error específico ayudan al usuario a corregir errores.
- **Atributos ARIA**: `aria-invalid` y `aria-describedby` hacen el componente accesible para lectores de pantalla.
- **Focus ring con box-shadow**: Más sutil que outline, comunica focus sin interrumpir el diseño.
- **Altura mínima de 44px**: Facilita la interacción en pantallas táctiles.

---

### Formulario de Contacto (`contact-form`)

**Por qué es buena práctica:**
- **Indicadores de campos requeridos**: El asterisco (*) con `aria-label` es entendido universalmente.
- **Validación HTML5 nativa**: Usar `required` y tipos de input apropiados (`email`) proporciona validación sin JavaScript.
- **Textarea redimensionable**: `resize: vertical` permite al usuario ajustar el tamaño según su necesidad sin romper el layout.
- **Acciones claras**: Botón primario para acción principal, secundario para acción de menor prioridad.
- **Agrupación lógica**: Cada campo en un `form-group` facilita el escaneo visual y la comprensión de la estructura.

---

## Uso

Cada componente es independiente y puede integrarse copiando su HTML y CSS. Todos requieren `variables.css` para funcionar correctamente.

## Licencia

MIT License - Uso libre en proyectos personales y comerciales.
