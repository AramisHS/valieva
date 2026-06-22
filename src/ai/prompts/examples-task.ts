export const EXAMPLES_TASK = `
**EJEMPLOS DE TAREAS (recordatorios):**
Usuario: "recuérdame apagar los frijoles en 30 segundos"
Respuesta: {"intent":"task","confidence":0.99,"description":"apagar los frijoles","dateTime":"${new Date(Date.now() + 30000).toISOString()}","status":"pending","priority":"normal"}

Usuario: "recordatorio comprar leche mañana a las 10am"
Respuesta: {"intent":"task","confidence":0.99,"description":"comprar leche","dateTime":"${new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}T10:00:00.000Z","status":"pending","priority":"normal"}

Usuario: "avísame en 2 minutos que tengo que ir al banco"
Respuesta: {"intent":"task","confidence":0.98,"description":"ir al banco","dateTime":"${new Date(Date.now() + 120000).toISOString()}","status":"pending","priority":"high"}

Usuario: "recuérdame llamar a mamá a las 3pm"
Respuesta: {"intent":"task","confidence":0.99,"description":"llamar a mamá","dateTime":"${new Date(new Date().setHours(15, 0, 0, 0)).toISOString()}","status":"pending","priority":"normal"}

Usuario: "ponme un recordatorio de lavar los trastes en 5 minutos"
Respuesta: {"intent":"task","confidence":0.98,"description":"lavar los trastes","dateTime":"${new Date(Date.now() + 300000).toISOString()}","status":"pending","priority":"normal"}

Usuario: "recordatorio al doctor mañana a las 8am"
Respuesta: {"intent":"task","confidence":0.99,"description":"ir al doctor","dateTime":"${new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}T08:00:00.000Z","status":"pending","priority":"high"}

Usuario: "recuérdame apagar las luces en 1 minuto"
Respuesta: {"intent":"task","confidence":0.99,"description":"apagar las luces","dateTime":"${new Date(Date.now() + 60000).toISOString()}","status":"pending","priority":"normal"}

Usuario: "avísame cuando sean las 6pm para salir"
Respuesta: {"intent":"task","confidence":0.98,"description":"salir a las 6pm","dateTime":"${new Date(new Date().setHours(18, 0, 0, 0)).toISOString()}","status":"pending","priority":"normal"}

Usuario: "recordatorio de echarle agua a las plantas hoy a las 7pm"
Respuesta: {"intent":"task","confidence":0.99,"description":"echarle agua a las plantas","dateTime":"${new Date(new Date().setHours(19, 0, 0, 0)).toISOString()}","status":"pending","priority":"normal"}

Usuario: "en 45 segundos me avisas de apagar el refri"
Respuesta: {"intent":"task","confidence":0.98,"description":"apagar el refri","dateTime":"${new Date(Date.now() + 45000).toISOString()}","status":"pending","priority":"high"}

Usuario: "📝 llamar cliente mañana"
Respuesta: {"intent":"task","confidence":0.97,"description":"llamar cliente","dateTime":"${new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}T09:00:00.000Z","status":"pending","priority":"high"}

Usuario: "prioridad alta: entregar proyecto en 2 horas"
Respuesta: {"intent":"task","confidence":0.98,"description":"entregar proyecto","dateTime":"${new Date(Date.now() + 7200000).toISOString()}","status":"pending","priority":"high"}

Usuario: "tarea: comprar leche"
Respuesta: {"intent":"task_create","title":"comprar leche"}

Usuario: "crear tarea pagar internet"
Respuesta: {"intent":"task_create","title":"pagar internet"}

Usuario: "tarea importante: entregar proyecto mañana"
Respuesta: {"intent":"task_create","title":"entregar proyecto","priority":"high","dueDate":"2026-06-22T10:00:00.000Z"}

**EJEMPLOS DE LISTAR TAREAS (intent: "task_list"):**
Usuario: "mis tareas"
Respuesta: {"intent":"task_list"}

Usuario: "tareas pendientes"
Respuesta: {"intent":"task_list","filter":"pending"}

Usuario: "tareas en progreso"
Respuesta: {"intent":"task_list","filter":"in_progress"}

Usuario: "tareas completadas"
Respuesta: {"intent":"task_list","filter":"done"}

**EJEMPLOS DE CAMBIAR ESTADO (intent: "task_status"):**
Usuario: "completar tarea 2"
Respuesta: {"intent":"task_status","taskIndex":2,"status":"done"}

Usuario: "poner en progreso tarea 1"
Respuesta: {"intent":"task_status","taskIndex":1,"status":"in_progress"}

Usuario: "marcar tarea 3 como completada"
Respuesta: {"intent":"task_status","taskIndex":3,"status":"done"}

**EJEMPLOS DE ELIMINAR TAREA (intent: "task_delete"):**
Usuario: "borrar tarea 2"
Respuesta: {"intent":"task_delete","taskIndex":2}

Usuario: "eliminar tarea 1"
Respuesta: {"intent":"task_delete","taskIndex":1}

**EJEMPLOS DE BUSCAR TAREA (intent: "task_search"):**
Usuario: "buscar tarea internet"
Respuesta: {"intent":"task_search","query":"internet"}

Usuario: "buscar en tareas proyecto"
Respuesta: {"intent":"task_search","query":"proyecto"}

`;