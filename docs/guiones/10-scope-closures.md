Una variable no vive en todo el programa. Vive en un sitio. Eso se llama scope. Es el lugar donde ese nombre existe.

Si declaras algo afuera de todas las funciones, es global. Cualquiera lo puede leer. Si lo declaras adentro de una función, solo existe ahí. Afuera, JavaScript dice que no lo conoce.

Por eso const y let dentro de un if o un for también están encerrados en ese bloque. Las llaves no son solo adorno. Son paredes.

Ahora lo útil. Una función puede nacer adentro de otra y acordarse de las variables de afuera, aunque la de afuera ya terminó. Eso se llama closure.

Mira un contador. crearContador devuelve una función. Cada vez que la llamas, suma uno. El número no está suelto afuera. Está guardado en esa memoria de la función.

Eso sirve para no ensuciar todo el programa con variables sueltas. Cada contador tiene la suya.

Tu turno. Escribe crearContador. Sin argumentos. Devuelve una función. Cada vez que corres esa función, suma uno y devuelve el total. Dos contadores distintos no se pisan.
