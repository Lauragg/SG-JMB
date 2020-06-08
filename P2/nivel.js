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

    /*
     Utilizamos Octree para realizar las colisiones.
     Comenzamos construyendo el árbol.
     Nuestros elementos a considerar, las bolas, las añadimos en la función
     cuando aparezcan en el espacio. Es decir, cuando bola.avanzado>=0.
    */
    this.octree = new THREE.Octree({
      undeferred: false,
      depthMax: Infinity,
      objectsThreshold: 1,
      overlapPct: 0.2
    });

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
    plano.geometry.computeBoundingBox();

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
      // Evento de disparo
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
      this.add(bola);
    }

    return bolas;
  }

  createDecoraciones(){

  }

  comprobarDisparo(){
    var position = new THREE.Vector3();
    this.disparador.bola.getWorldPosition(position)
    position=position.sub(new THREE.Vector3(0,1,0));
    this.octreeObjects = this.octree.search(position, 1, true);
    if(this.octreeObjects != null && typeof this.octreeObjects != "undefined"){
      //console.log(this.octreeObjects);
      this.octreeObjects.forEach((bola, i) => {
        //console.log(bola);
        //console.log("Position bola i="+ i +" :"+bola.object.position.x +" "+bola.object.position.y+" "+bola.object.position.z);
        var distX = position.x-bola.object.position.x;
        var distZ = position.z-bola.object.position.z;
        if (-1 < distX && distX < 1 && -1 < distZ && distZ < 1 ) {
          if(bola.object.colorHex == this.disparador.bola.colorHex){
            var index=this.bolas.vector.indexOf(bola.object);
            if (index>0 && this.bolas.vector[index-1].colorHex == this.disparador.bola.colorHex) {
              console.log("Primero");
              this.borrarBolas(index,this.disparador.bola.colorHex);
            }else if (index < this.bolas.vector.length -1 && this.bolas.vector[index+1].colorHex == this.disparador.bola.colorHex) {
              console.log("Segundo");
              this.borrarBolas(index,this.disparador.bola.colorHex);
            }
            //this.animacion=false;
            this.cargarDisparador();
          }

          /*console.log(bola);
          console.log(distX+" "+distZ);
          console.log("Position disparo:"+position.x +" "+position.y+" "+position.z);
          console.log("Position bola i="+ i +" :"+bola.object.position.x +" "+bola.object.position.y+" "+bola.object.position.z);*/
        }
      });
    }

    if (!this.superficie.geometry.boundingBox.containsPoint(position)) {
      this.cargarDisparador();
    }
  }

  cargarDisparador(){
    this.disparador.remove(this.disparador.bola);
    this.disparador.bola = this.createBola();
    this.disparador.add(this.disparador.bola);
    this.disparador.disparo=false;
  }

  borrarBolas(index,colorHex){
    var mismoColor = true;
    var posiciones = [index];
    var i = index - 1;
    while (mismoColor && i >= 0) {
      if(this.bolas.vector[i].colorHex==colorHex){
        posiciones.unshift(i);
        i--;
      }else {
        mismoColor=false;
      }
    }

    i = index + 1;
    mismoColor = true;
    while (mismoColor && i < this.bolas.vector.length) {
      if(this.bolas.vector[i].colorHex==colorHex){
        posiciones.push(i);
        i++;
      }else {
        mismoColor=false;
      }
    }

    posiciones.forEach((item, j) => {
      this.remove(this.bolas.vector[item]);
    });

    console.log("Posiciones "+posiciones);//posiciones[0]+" "+posiciones[posiciones.length-1]);
    console.log("Eliminaciones "+this.bolas.vector.splice(posiciones[0],posiciones[posiciones.length-1]-posiciones[0]+1));

    console.log("Vector tras eliminaciones "+this.bolas.vector.length);
  }


  createBola(){
    var color=Math.floor(Math.random()*this.coloresBolas.length); // Número aleatorio entre 0 y length - 1
    var bola = new THREE.Mesh(
      new THREE.SphereGeometry(),
      new THREE.MeshPhongMaterial({color: this.coloresBolas[color]})
    );
    // Para comprobar si la bola ha sido ya añadida a nuestro árbol indexado o no.
    bola.enOctree=false;
    // Aunque no es necesario, lo añadimos por comodidad para
    // evitar hacer comparaciones RGB con variables muy internas.
    bola.colorHex=this.coloresBolas[color];
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
          if (!bola.enOctree) {
            that.octree.add(bola, {useFaces:true});
            bola.enOctree = true;
          }
          var posicion=that.spline.getPointAt(bola.avanzado);
          bola.position.copy(posicion);
          posicion.add(that.spline.getTangentAt(bola.avanzado));
          bola.lookAt(posicion);
        }

      });

      /*
        Se actualiza nuestro árbol.
      */
      this.octree.rebuild();
      this.octree.update();

      /*
        Disparo
      */
      if (this.disparador.disparo) {
        this.disparador.bola.translateOnAxis(new THREE.Vector3(1,0,0),this.velocidad*time);
        this.comprobarDisparo();
      }

      this.tiempoAnterior = tiempoActual;
    }
  }
}
