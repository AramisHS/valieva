export const EXAMPLES_NOTE = `
**EJEMPLOS DE NOTAS (intent: "note"):**
Usuario: "nota: comprar pan"
Respuesta: {"intent":"note","description":"comprar pan"}

Usuario: "apunta: la junta es mañana a las 10"
Respuesta: {"intent":"note","description":"la junta es mañana a las 10"}

Usuario: "recuerda que tengo que pagar el agua"
Respuesta: {"intent":"note","description":"tengo que pagar el agua"}

Usuario: "anota: llamar al doctor"
Respuesta: {"intent":"note","description":"llamar al doctor"}

Usuario: "nota mental: revisar correos"
Respuesta: {"intent":"note","description":"revisar correos"}

Usuario: "apuntame que debo comprar leche"
Respuesta: {"intent":"note","description":"comprar leche"}

Usuario: "recuerda que el lunes es el cumpleaños de mamá"
Respuesta: {"intent":"note","description":"el lunes es el cumpleaños de mamá"}

**EJEMPLOS DE CONSULTA DE NOTAS (intent: "notes"):**
Usuario: "buscar frio en notas"
Respuesta: {"intent":"search_notes","query":"frio"}

Usuario: "encuentra pan en mis notas"
Respuesta: {"intent":"search_notes","query":"pan"}

Usuario: "notas con leche"
Respuesta: {"intent":"search_notes","query":"leche"}

Usuario: "mis notas"
Respuesta: {"intent":"notes"}

Usuario: "muéstrame mis notas"
Respuesta: {"intent":"notes"}

Usuario: "qué notas tengo"
Respuesta: {"intent":"notes"}

Usuario: "dime mis apuntes"
Respuesta: {"intent":"notes"}

Usuario: "lista de notas"
Respuesta: {"intent":"notes"}

**EJEMPLOS DE ELIMINACIÓN DE NOTAS:**
Usuario: "borrar nota 1"
Respuesta: {"intent":"delete_note","noteIndex":1}

Usuario: "eliminar nota 2"
Respuesta: {"intent":"delete_note","noteIndex":2}

Usuario: "borra la nota 3"
Respuesta: {"intent":"delete_note","noteIndex":3}

**EJEMPLOS DE EDICIÓN DE NOTAS (CON Y SIN ":"):**
Usuario: "editar nota 1 nuevo texto"
Respuesta: {"intent":"edit_note","noteIndex":1,"newContent":"nuevo texto"}

Usuario: "editar nota 2: ya la compre"
Respuesta: {"intent":"edit_note","noteIndex":2,"newContent":"ya la compre"}

Usuario: "cambiar nota 3 por otro texto"
Respuesta: {"intent":"edit_note","noteIndex":3,"newContent":"otro texto"}

**NUEVO INTENT PARA LA LISTA DE NOTAS:**
- "notes": el usuario quiere ver todas sus notas guardadas.
- "delete_note": eliminar una nota por su número.
- "edit_note": editar una nota por su número.
- "search_notes": buscar notas que contengan una palabra clave.
`;