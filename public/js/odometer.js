  //ODOMETER

  const el = document.getElementById("contador");
  const odometer = new Odometer({
    el: el,
    value: 10,
    format: "d",
  });
  const elDisk = document.getElementById("contadorDisk");
  const odometerDisk = new Odometer({
    el: elDisk,
    value: 10,
    format: "d",
  });
  const elRam = document.getElementById("contadorRam");
  const odometerRam = new Odometer({
    el: elRam,
    value: 10,
    format: "d",
  });

  function trocar() {
    valores = ["61","99"];

    var valorAtual = "";
    valores.forEach((valor, index) => {
      setTimeout(() => {
        odometer.update(valor);
      }, index * 7000);
    });


    setTimeout(trocar, valores.length * 7000);
  }

  function trocarDisk() {
    valores = ["40","55"];

    var valorAtual = "";
    valores.forEach((valor, index) => {
      setTimeout(() => {
        odometerDisk.update(valor);
      }, index * 10000);
    });


    setTimeout(trocarDisk, valores.length * 10000);
  }

  function trocarRam() {
    valores = ["32","66"];

    var valorAtual = "";
    valores.forEach((valor, index) => {
      setTimeout(() => {
        odometerRam.update(valor);
      }, index * 5000);
    });


    setTimeout(trocarRam, valores.length * 5000);
  }