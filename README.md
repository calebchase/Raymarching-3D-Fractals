# Raymarching 3D Fractals

<img src="https://raw.githubusercontent.com/calebchase/Raymarching-3D-Fractals/7abc355319416a3c73b8a43dd5c421a32018251d/mandelbulb.png" width="600" />

View in browser: https://observablehq.com/d/156b5bf91f810a94@1983

View this notebook in your browser by running a web server in this folder. For
example:

~~~sh
npx http-server
~~~

Or, use the [Observable Runtime](https://github.com/observablehq/runtime) to
import this module directly into your application. To npm install:

~~~sh
npm install @observablehq/runtime@5
npm install https://api.observablehq.com/d/156b5bf91f810a94@1983.tgz?v=3
~~~

Then, import your notebook and the runtime as:

~~~js
import {Runtime, Inspector} from "@observablehq/runtime";
import define from "156b5bf91f810a94";
~~~

To log the value of the cell named “foo”:

~~~js
const runtime = new Runtime();
const main = runtime.module(define);
main.value("foo").then(value => console.log(value));
~~~
