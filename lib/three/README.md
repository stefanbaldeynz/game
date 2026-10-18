# three.js 0.186.1

A local copy of the [three.js](https://threejs.org/) 3D engine (MIT licence, see `LICENSE`), so the 3D games load it from this computer instead of the internet. Shared by every game in the collection.

Only the files the games use are here: the engine (`build/`) and the add-ons in `examples/jsm/` (post-processing, model loaders, and the Draco / KTX2 / Meshopt decoders for compressed models). The folder layout matches the official package, so to add another add-on, copy it (and anything it imports) from the same version of the package into the same place.

Version: 0.186.1, from https://registry.npmjs.org/three/-/three-0.186.1.tgz
