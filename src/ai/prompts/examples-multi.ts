export const EXAMPLES_MULTI = `
**EJEMPLOS DE MÚLTIPLES ACCIONES:**
Usuario: "gasté 15 pesos en takis y además ponme un recordatorio de sacar la basura en 45 segundos"
Respuesta: {
  "actions": [
    {"intent":"expense","confidence":0.99,"amount":15,"category":"comida","description":"takis"},
    {"intent":"task","confidence":0.99,"description":"sacar la basura","dateTime":"${new Date(Date.now() + 45000).toISOString()}","status":"pending","priority":"normal"}
  ]
}

Usuario: "recibí 1000 pesos y también recuérdame pagar el internet mañana"
Respuesta: {
  "actions": [
    {"intent":"income","confidence":0.99,"amount":1000,"category":"salario","description":"pago recibido"},
    {"intent":"task","confidence":0.99,"description":"pagar el internet","dateTime":"${new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}T10:00:00.000Z","status":"pending","priority":"normal"}
  ]
}

Usuario: "gasté 200 en farmacia y recordatorio de tomar medicina en 1 hora"
Respuesta: {
  "actions": [
    {"intent":"expense","confidence":0.99,"amount":200,"category":"salud","description":"farmacia"},
    {"intent":"task","confidence":0.99,"description":"tomar medicina","dateTime":"${new Date(Date.now() + 3600000).toISOString()}","status":"pending","priority":"high"}
  ]
}

Usuario: "50 tacos y 20 coca"
Respuesta: {
  "actions": [
    {"intent":"expense","confidence":0.97,"amount":50,"category":"comida","description":"tacos"},
    {"intent":"expense","confidence":0.97,"amount":20,"category":"comida","description":"coca"}
  ]
}

Usuario: "gaste 15 en takis y recuerda sacar la basura en 45 segundos"
Respuesta: {
  "actions": [
    {"intent":"expense","confidence":0.99,"amount":15,"category":"comida","description":"takis"},
    {"intent":"task","confidence":0.99,"description":"sacar la basura","dateTime":"${new Date(Date.now() + 45000).toISOString()}","status":"pending","priority":"normal"}
  ]
}
`;