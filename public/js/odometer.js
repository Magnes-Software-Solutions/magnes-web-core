//ODOMETER

const el = document.getElementById("contador");
const odometer = new Odometer({
  el: el,
  value: 10,
  format: "d",
});

function trocar() {
  valores = ["10", "25", "58", "89", "99"];

  var valorAtual = "";
  valores.forEach((valor, index) => {
    setTimeout(() => {
      odometer.update(valor);
    }, index * 4000);
  });


  setTimeout(trocar, valores.length * 4000);
}
