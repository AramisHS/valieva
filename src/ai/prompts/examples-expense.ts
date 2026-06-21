export const EXAMPLES_EXPENSE = `
**EJEMPLOS DE GASTOS:**
Usuario: "gasté 50 pesos en un café"
Respuesta: {"intent":"expense","confidence":0.99,"amount":50,"category":"comida","description":"café"}

Usuario: "compre takis de 15 varos"
Respuesta: {"intent":"expense","confidence":0.98,"amount":15,"category":"comida","description":"takis"}

Usuario: "pagué 300 de gasolina"
Respuesta: {"intent":"expense","confidence":0.97,"amount":300,"category":"transporte","description":"gasolina"}

Usuario: "gasté 1200 en el súper"
Respuesta: {"intent":"expense","confidence":0.99,"amount":1200,"category":"supermercado","description":"compras del súper"}

Usuario: "me costó 60 el uber pa'l trabajo"
Respuesta: {"intent":"expense","confidence":0.98,"amount":60,"category":"transporte","description":"uber al trabajo"}

Usuario: "pagué el cine 150 bolas"
Respuesta: {"intent":"expense","confidence":0.97,"amount":150,"category":"ocio","description":"cine"}

Usuario: "compre pan 45 pesos"
Respuesta: {"intent":"expense","confidence":0.99,"amount":45,"category":"comida","description":"pan"}

Usuario: "pagué la luz 800 morlacos"
Respuesta: {"intent":"expense","confidence":0.98,"amount":800,"category":"hogar","description":"pago de luz"}

Usuario: "gaste 500 en farmacia"
Respuesta: {"intent":"expense","confidence":0.99,"amount":500,"category":"salud","description":"farmacia"}

Usuario: "me gaste 2000 en ropa"
Respuesta: {"intent":"expense","confidence":0.98,"amount":2000,"category":"ropa","description":"ropa nueva"}

Usuario: "compre un libro de 350"
Respuesta: {"intent":"expense","confidence":0.99,"amount":350,"category":"educación","description":"libro"}

Usuario: "gasté 120 de saldo pa'l celular"
Respuesta: {"intent":"expense","confidence":0.98,"amount":120,"category":"suscripciones","description":"saldo celular"}

Usuario: "50 tacos"
Respuesta: {"intent":"expense","confidence":0.95,"amount":50,"category":"comida","description":"tacos"}

Usuario: "100 coca"
Respuesta: {"intent":"expense","confidence":0.95,"amount":100,"category":"comida","description":"coca"}

Usuario: "250 uber"
Respuesta: {"intent":"expense","confidence":0.96,"amount":250,"category":"transporte","description":"uber"}

Usuario: "500 gasolina"
Respuesta: {"intent":"expense","confidence":0.97,"amount":500,"category":"transporte","description":"gasolina"}

Usuario: "🍔 150"
Respuesta: {"intent":"expense","confidence":0.96,"amount":150,"category":"comida","description":"hamburguesa"}

Usuario: "⛽ 500"
Respuesta: {"intent":"expense","confidence":0.97,"amount":500,"category":"transporte","description":"gasolina"}

Usuario: "gaste 200 en el super y 50 en pan"
Respuesta: {
  "actions": [
    {"intent":"expense","confidence":0.99,"amount":200,"category":"supermercado","description":"super"},
    {"intent":"expense","confidence":0.99,"amount":50,"category":"comida","description":"pan"}
  ]
}
`;