class Nivel extends THREE.Object3D{
  constructor(numBolas,coloresBolas,spline,posDisparador,velocidad){
    super();

    // Animación bolas y camino a seguir
    this.tiempoAnterior = Date.now();
    this.spline = spline;
    this.velocidad = velocidad; // unidades/s
    var splineLongitud = this.spline.getLength();
    this.tiempoFinRecorrido = splineLongitud/this.velocidad;
    this.animacion = true;

    // Elementos del nivel
    this.superficie = this.createSuperficie();

    this.coloresBolas=coloresBolas;
    this.bolas = this.createBolas(numBolas,splineLongitud);

    this.disparador = this.createDisparador(posDisparador);

    this.decoraciones = this.createDecoraciones();

    this.add(this.superficie);
    this.add(this.bolas);
    this.add(this.disparador);
    //this.add(this.decoraciones);
  }

  createSuperficie(){
    // Creamos las geometrías con las que operaremos.
    var cuadrado = new THREE.BoxGeometry(50,1,50);
    //var circulo = new THREE.CircleGeometry(); Demasiado bonito como para ser cierto
    var shape= new THREE.Shape();
    shape.moveTo(-1,0.5);
    shape.quadraticCurveTo(-1,-0.5,0,-0.5);
    shape.quadraticCurveTo(1,-0.5,1,0.5);
    shape.lineTo(-1,0.5);

    var semicirculo = new THREE.ExtrudeGeometry(
      shape,
      {bevelEnabled: false, steps: 60, extrudePath: this.spline}
    );

    // Operamos con las geometrías
    var base=new ThreeBSP(cuadrado)
      .subtract(new ThreeBSP(semicirculo))
      .toGeometry();

    // Creamos los objetos
    var plano = new THREE.Mesh(
      base,
      new THREE.MeshPhongMaterial({map: new THREE.TextureLoader().load('../imgs/wood.jpg') } )
    );

    /*var camino = new THREE.Mesh(semicirculo, new THREE.MeshPhongMaterial({color: 0xf08080}));

    var superficie = new THREE.Object3D();
    superficie.position.set(0,-0.5,0);

    superficie.add(plano);
    superficie.add(camino);*/
    plano.position.set(0,-0.5,0);

    return plano;
  }

  createDisparador(posDisparador){
    var disparador = new THREE.Object3D();
    disparador.bola = this.createBola();
    disparador.apuntador = new THREE.Mesh(new THREE.BoxGeometry(2,1,1), new THREE.MeshPhongMaterial({color: 0xf08080}));
    disparador.apuntador.position.set(1,0,0);
    disparador.disparo = false;
    disparador.position.set(posDisparador.x,posDisparador.y,posDisparador.z);

    disparador.add(disparador.bola);
    disparador.add(disparador.apuntador);

    return disparador;
  }

  /*disparar(event){
    var mouse = new THREE.Vector3(
      (event.clientX / window.innerWidth)*2-1,
      0,
      1-2*(event.clientY / window.innerHeight)
    );

    var worldPosition = new THREE.Vector3();
    this.disparador.bola.getWorldPosition(worldPosition)
    this.disparador.vectorAvance = worldPosition.sub(mouse);
    console.log(this.disparador.vectorAvance);
    this.disparador.disparo=true;
  }
*/
  eventos(event){
    var tecla = event.which || event.keyCode;
    if(!this.disparador.disparo){ // Para que no se mueva la bola cuando aún se está disparando
      if (String.fromCharCode(tecla) == "a") {
        this.disparador.rotation.y+=0.01;
      }else if (String.fromCharCode(tecla) == "d") {
        this.disparador.rotation.y-=0.01;
      }else if (String.fromCharCode(tecla) == "" || String.fromCharCode(tecla) == " ") {
        this.disparador.disparo = true;
      }
    }
  }

  createBolas(numBolas,splineLongitud){
    var bolas = new THREE.Object3D();
    bolas.vector = new Array();

    for (var i = 0; i < numBolas; i++) {
      var bola=this.createBola(this.coloresBolas);
      bola.position.set(0,-10,0);
      bola.avanzado=-2*i/splineLongitud;
      bolas.vector.push(bola);
      bolas.add(bola);
    }

    return bolas;
  }

  createDecoraciones(){

  }


  createBola(){
    var color=Math.floor(Math.random()*this.coloresBolas.length); // Número aleatorio entre 0 y length - 1
    var bola = new THREE.Mesh(
      new THREE.SphereGeometry(),
      new THREE.MeshPhongMaterial({color: this.coloresBolas[color]})
    );
    return bola;
  }

  update(){
    if (this.animacion) {
      var that = this;

      var tiempoActual = Date.now();
      var time = (tiempoActual - this.tiempoAnterior)/1000; // En segundos
      var avance = (time % this.tiempoFinRecorrido)/this.tiempoFinRecorrido; // [0,1]

      /*
        Avance bolas por recorrido
      */
      this.bolas.vector.forEach((bola, i) => {
        bola.avanzado+=avance;

        if (bola.avanzado >= 1) {
          displayEndGame();
          that.animacion = false;

        }else if(bola.avanzado >= 0){
          var posicion=that.spline.getPointAt(bola.avanzado);
          bola.position.copy(posicion);
          posicion.add(that.spline.getTangentAt(bola.avanzado));
          bola.lookAt(posicion);
        }

      });

      /*
        Disparo
      */
      if (this.disparador.disparo) {
        this.disparador.bola.translateOnAxis(new THREE.Vector3(1,0,0),this.velocidad*time);
      }

      this.tiempoAnterior = tiempoActual;
    }
  }
}
