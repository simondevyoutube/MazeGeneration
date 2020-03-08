import {mazegen} from './mazegen.js';

const _CONFIG_WIDTH = 1920;
const _CONFIG_HEIGHT = 1080;
const _TILES_X = 64;
const _TILES_Y = _TILES_X / 2;
const _TIME_PER_STEP = 1.0 / 30.0;

const _LAYER_NODES = 100;
const _LAYER_EDGES = 50;
const _LAYER_WALL = 10;
const _LAYER_BG = 0;


class SquareSprite {
  constructor(scene, node, nodes) {
    this._node = node;
    this._nodes = nodes;
    this._scene = scene;
    this._gfx = null;
    this._text = null;
    this._params = {
      tint: 0xFFFFFF,
      start: false,
      end: false,
      fScore: '',
      gScore: 0,
    };
    this._Redraw({});
  }

  destroy() {
    if (this._gfx != null) {
      this._gfx.destroy();
    }

    if (this._text != null) {
      this._text.destroy();
    }
  }

  Redraw(params) {
    let changed = false;
    for (const k in this._params) {
      if (k in params && this._params[k] != params[k]) {
        changed = true;
        this._params[k] = params[k];
      }
    }

    if (changed||1) {
      this._Redraw();
    }
  }

  _Redraw() {
    const x = this._node.metadata.position[0];
    const y = this._node.metadata.position[1];
    const w = _CONFIG_WIDTH / _TILES_X;
    const h = _CONFIG_HEIGHT / _TILES_Y;

    if (this._gfx != null) {
      this._gfx.destroy();
    }
    this._gfx = this._scene.add.graphics(0, 0);
    this._gfx.lineStyle(w / 60.0, 0xC0C0C0, 1.0);
    this._gfx.fillStyle(this._params.tint, 1.0);
    this._gfx.fillRect(x * w, y * h, w, h);

    this._gfx.displayOriginX = 0;
    this._gfx.displayOriginY = 0;
    this._gfx.setDepth(_LAYER_BG);
  }
}

class WallRenderer {
  constructor(scene, nodes) {
    this._nodes = nodes;
    this._scene = scene;
    this._gfx = null;
  }

  destroy() {
    if (this._gfx != null) {
      this._gfx.destroy();
    }
  }

  get visible() {
    return this._visible;
  }

  set visible(v) {
    this._visible = v;
  }

  Redraw() {
    if (this._gfx != null) {
      this._gfx.destroy();
    }
    this._gfx = this._scene.add.graphics(0, 0);

    const edges = {};

    for (const k in this._nodes) {
      const curNode = this._nodes[k];
      const x = curNode.metadata.position[0];
      const y = curNode.metadata.position[1];
      const w = _CONFIG_WIDTH / _TILES_X;
      const h = _CONFIG_HEIGHT / _TILES_Y;

      this._gfx.lineStyle(w / 60.0, 0xC0C0C0, 1.0);
      if (curNode.metadata.render.active) {
        this._gfx.fillStyle(0x8080FF, 1.0);
      } else if (curNode.metadata.render.visited) {
        this._gfx.fillStyle(0xFFFFFF, 1.0);
      } else {
        this._gfx.fillStyle(0x808080, 1.0);
      }
      this._gfx.fillRect(x * w, y * h, w, h);

      const neighbours = [[0, 1], [1, 0], [0, -1], [-1, 0]];

      this._gfx.lineStyle(w * 0.05, 0x000000, 1.0);
      this._gfx.beginPath();
      for (let ni = 0; ni < neighbours.length; ni++) {
        const n = neighbours[ni];
        const ki = _Key(x + n[0], y + n[1]);

        if (curNode.edges.indexOf(_Key(x, y + 1)) < 0) {
          this._gfx.moveTo(w * (x + 0.0), h * (y + 1.0));
          this._gfx.lineTo(w * (x + 1.0), h * (y + 1.0));
        }

        if (curNode.edges.indexOf(_Key(x + 1, y + 0)) < 0) {
          this._gfx.moveTo(w * (x + 1.0), h * (y + 0.0));
          this._gfx.lineTo(w * (x + 1.0), h * (y + 1.0));
        }

        if (curNode.edges.indexOf(_Key(x, y - 1)) < 0) {
          this._gfx.moveTo(w * (x + 0.0), h * (y + 0.0));
          this._gfx.lineTo(w * (x + 1.0), h * (y + 0.0));
        }

        if (curNode.edges.indexOf(_Key(x - 1, y)) < 0) {
          this._gfx.moveTo(w * (x + 0.0), h * (y + 0.0));
          this._gfx.lineTo(w * (x + 0.0), h * (y + 1.0));
        }
      }
      this._gfx.closePath();
      this._gfx.strokePath();
    }

    this._gfx.displayOriginX = 0;
    this._gfx.displayOriginY = 0;
    this._gfx.setDepth(_LAYER_WALL);
    this._gfx.setVisible(this._visible);
  }
}

class PotentialEdgeRenderer {
  constructor(scene, nodes) {
    this._nodes = nodes;
    this._scene = scene;
    this._gfx = null;
  }

  destroy() {
    if (this._gfx != null) {
      this._gfx.destroy();
    }
  }

  get visible() {
    return this._visible;
  }

  set visible(v) {
    this._visible = v;
  }

  Redraw() {
    if (this._gfx != null) {
      this._gfx.destroy();
    }
    this._gfx = this._scene.add.graphics(0, 0);

    const edges = {};

    for (const k in this._nodes) {
      const curNode = this._nodes[k];
      const x = curNode.metadata.position[0];
      const y = curNode.metadata.position[1];
      const w = _CONFIG_WIDTH / _TILES_X;
      const h = _CONFIG_HEIGHT / _TILES_Y;

      for (let nk of curNode.potentialEdges) {
        if ((k + '.' + nk) in edges ||
            (nk + '.' + k) in edges) {
          continue;
        }
        const neighbourNode = this._nodes[nk];
        const x1 = neighbourNode.metadata.position[0];
        const y1 = neighbourNode.metadata.position[1];

        if (curNode.metadata.render.active) {
          if (neighbourNode.metadata.render.visited) {
            this._gfx.lineStyle(w * 0.025, 0xFF8080, 1.0);
          } else {
            this._gfx.lineStyle(w * 0.025, 0x80FF80, 1.0);
          }
        } else if (neighbourNode.metadata.render.active) {
          if (curNode.metadata.render.visited) {
            this._gfx.lineStyle(w * 0.025, 0xFF8080, 1.0);
          } else {
            this._gfx.lineStyle(w * 0.025, 0x80FF80, 1.0);
          }
        } else {
          if (curNode.edges.indexOf(nk) >= 0) {
            this._gfx.lineStyle(w * 0.025, 0x0000FF, 1.0);
          } else {
            this._gfx.lineStyle(w * 0.001, 0x000000, 1.0);
          }
        }

        this._gfx.beginPath();
        this._gfx.moveTo(w * (x + 0.5), h * (y + 0.5));
        this._gfx.lineTo(w * (x1 + 0.5), h * (y1 + 0.5));
        this._gfx.closePath();
        this._gfx.strokePath();

        edges[k + '.' + nk] = true;
        edges[nk + '.' + k] = true;
      }
    }
    this._gfx.displayOriginX = 0;
    this._gfx.displayOriginY = 0;
    this._gfx.setDepth(_LAYER_EDGES);
    this._gfx.setVisible(this._visible);
  }
}

class EdgeRenderer {
  constructor(scene, nodes) {
    this._nodes = nodes;
    this._scene = scene;
    this._gfx = null;
    this._visible = false;
  }

  destroy() {
    if (this._gfx != null) {
      this._gfx.destroy();
    }
  }

  get visible() {
    return this._visible;
  }

  set visible(v) {
    this._visible = v;
  }

  Redraw() {
    if (this._gfx != null) {
      this._gfx.destroy();
    }
    this._gfx = this._scene.add.graphics(0, 0);

    const edges = {};

    for (const k in this._nodes) {
      const curNode = this._nodes[k];
      const x = curNode.metadata.position[0];
      const y = curNode.metadata.position[1];
      const w = _CONFIG_WIDTH / _TILES_X;
      const h = _CONFIG_HEIGHT / _TILES_Y;

      for (let nk of curNode.edges) {
        if ((k + '.' + nk) in edges ||
            (nk + '.' + k) in edges) {
          continue;
        }
        const neighbourNode = this._nodes[nk];
        const x1 = neighbourNode.metadata.position[0];
        const y1 = neighbourNode.metadata.position[1];

        this._gfx.lineStyle(w * 0.025, 0x000000, 1.0);

        this._gfx.beginPath();
        this._gfx.moveTo(w * (x + 0.5), h * (y + 0.5));
        this._gfx.lineTo(w * (x1 + 0.5), h * (y1 + 0.5));
        this._gfx.closePath();
        this._gfx.strokePath();

        edges[k + '.' + nk] = true;
        edges[nk + '.' + k] = true;
      }
    }
    this._gfx.displayOriginX = 0;
    this._gfx.displayOriginY = 0;
    this._gfx.setDepth(_LAYER_EDGES);
    this._gfx.setVisible(this._visible);
  }
}

class NodeRenderer {
  constructor(scene, nodes) {
    this._nodes = nodes;
    this._scene = scene;
    this._gfx = null;
    this._visible = false;
  }

  destroy() {
    if (this._gfx != null) {
      this._gfx.destroy();
    }
  }

  get visible() {
    return this._visible;
  }

  set visible(v) {
    this._visible = v;
  }

  Redraw() {
    if (this._gfx != null) {
      this._gfx.destroy();
    }
    this._gfx = this._scene.add.graphics(0, 0);

    for (const k in this._nodes) {
      const node = this._nodes[k];
      const x = node.metadata.position[0];
      const y = node.metadata.position[1];
      const w = _CONFIG_WIDTH / _TILES_X;
      const h = _CONFIG_HEIGHT / _TILES_Y;

      if (node.metadata.render.visited) {
        this._gfx.fillStyle(0xFF8080, 1.0);
      } else {
        this._gfx.fillStyle(0x80FF80, 1.0);
      }
      this._gfx.fillCircle(w * (x + 0.5), h * (y + 0.5), w * 0.1);
    }
    this._gfx.displayOriginX = 0;
    this._gfx.displayOriginY = 0;
    this._gfx.setDepth(_LAYER_NODES);
    this._gfx.setVisible(this._visible);
  }
}


function _Key(x, y) {
  return x + '.' + y;
}

function _Distance(p1, p2) {
  return ((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2) ** 0.5;
}


class AStarRenderer {
  constructor(nodes, scene) {
    this._scene = scene;
    this._nodes = nodes;
    this._edgeRenderer = new EdgeRenderer(scene, nodes);
    this._potentialEdgeRenderer = new PotentialEdgeRenderer(scene, nodes);
    this._nodeRenderer = new NodeRenderer(scene, nodes);
    this._wallRenderer = new WallRenderer(scene, nodes);
    this._wallRenderer._visible = true;
    this._sprites = {};
  }

  destroy() {
    for (const k in this._sprites) {
      this._sprites[k].destroy();
    }

    this._nodeRenderer.destroy();
    this._edgeRenderer.destroy();
    this._potentialEdgeRenderer.destroy();
    this._wallRenderer.destroy();
  }

  Update(touched) {
    if (touched == null) {
      touched = Object.keys(this._nodes);
    }

    for (const k of touched) {
      const node = this._nodes[k];

      const k_bg = k + '.bg';

      if (!(k_bg in this._sprites)) {
        this._sprites[k_bg] = new SquareSprite(this._scene, node, this._nodes);
      }

      const params = {};

      if (node.metadata.render.visited) {
        params.tint = 0xFFFFFF;
      } else {
        params.tint = 0x808080;
      }

      if (node.metadata.render.active) {
        params.tint = 0x8080FF;
      }

      this._sprites[k_bg].Redraw(params);
    }

    this._nodeRenderer.Redraw();
    this._edgeRenderer.Redraw();
    this._potentialEdgeRenderer.Redraw();
    this._wallRenderer.Redraw();
  }
}


class Graph {
  constructor() {
    this._nodes = {};
  }

  get Nodes() {
    return this._nodes;
  }

  AddNode(k, e, m) {
    this._nodes[k] = {
      edges: [...e],
      potentialEdges: [...e],
      metadata: m
    };
  }
}


class MazeGenDemo {
  constructor() {
    this._game = this._CreateGame();
  }

  _CreateGame() {
    const self = this;
    const config = {
        type: Phaser.AUTO,
        scene: {
            preload: function() { self._OnPreload(this); },
            create: function() { self._OnCreate(this); },
            update: function() { self._OnUpdate(this); },
        },
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: _CONFIG_WIDTH,
          height: _CONFIG_HEIGHT
        }
    };

    return new Phaser.Game(config);
  }

  _Reset() {
    this._astarRenderer.destroy();
    this._Init();
  }

  _Init() {
    this._stepTime = 0.0;
    this._previousFrame = null;
    this._graph = new Graph();

    for (let x = 0; x < _TILES_X; x++) {
      for (let y = 0; y < _TILES_Y; y++) {
        const k = _Key(x, y);
        this._graph.AddNode(
            k, [],
            {
              position: [x, y],
              weight: 0,
              render: {
                visited: false,
              }
            });
      }
    }

    // for (let x = 0; x < _TILES_X; x++) {
    //   for (let y = 0; y < _TILES_Y; y++) {
    //     const roll = Math.random();
    //     if (roll < 0.2) {
    //       const k = _Key(x, y);
    //       this._graph.Nodes[k].metadata.weight = -1;
    //     }
    //   }
    // }
    //
    for (let x = 0; x < _TILES_X; x++) {
      for (let y = 0; y < _TILES_Y; y++) {
        const k = _Key(x, y);

        for (let xi = -1; xi <= 1; xi++) {
          for (let yi = -1; yi <= 1; yi++) {
            if (xi == 0 && yi == 0 || (Math.abs(xi) + Math.abs(yi) != 1)) {
              continue;
            }

            const ki = _Key(x + xi, y + yi);

            if (ki in this._graph.Nodes) {
              this._graph.Nodes[k].potentialEdges.push(ki);
            }
          }
        }
      }
    }

    const start = _Key(0, 0);
    const end = _Key(4, 0);

    this._mazeGenerator = new mazegen.MazeGenerator(this._graph.Nodes);
    this._mazeIterator = this._mazeGenerator.GenerateIteratively(start);

    this._astarRenderer = new AStarRenderer(this._graph.Nodes, this._scene);
  }

  _OnPreload(scene) {
    this._scene = scene;
    // /this._scene.load.image('sky', 'assets/sky.png');
  }

  _OnCreate(scene) {
    this._keys = {
      f: this._scene.input.keyboard.addKey('F'),
      r: this._scene.input.keyboard.addKey('R'),
      n: this._scene.input.keyboard.addKey('N'),
      e: this._scene.input.keyboard.addKey('E'),
      p: this._scene.input.keyboard.addKey('P'),
      w: this._scene.input.keyboard.addKey('W'),
    };

    this._keys.w.on('down', function() {
      this._astarRenderer._wallRenderer.visible = !this._astarRenderer._wallRenderer.visible;
    }, this);

    this._keys.n.on('down', function() {
      this._astarRenderer._nodeRenderer.visible = !this._astarRenderer._nodeRenderer.visible;
    }, this);

    this._keys.e.on('down', function() {
      this._astarRenderer._edgeRenderer.visible = !this._astarRenderer._edgeRenderer.visible;
    }, this);

    this._keys.p.on('down', function() {
      this._astarRenderer._potentialEdgeRenderer.visible = !this._astarRenderer._potentialEdgeRenderer.visible;
    }, this);

    this._keys.r.on('down', function() {
      this._Reset();
    }, this);

    this._keys.f.on('down', function() {
      this._mazeIterator.next();
    }, this);

    this._Init();
  }

  _OnUpdate(scene) {
    const currentFrame = scene.time.now;
    if (this._previousFrame == null) {
      this._previousFrame = currentFrame;
      this._astarRenderer.Update(null);
    }

    const timeElapsedInS = Math.min(
        (currentFrame - this._previousFrame) / 1000.0, 1.0 / 30.0);

    let touched = [];
    this._stepTime += timeElapsedInS;
    while (this._stepTime >= _TIME_PER_STEP) {
      this._stepTime -= _TIME_PER_STEP;
      const r = this._mazeIterator.next();
      if (r.done) {
        setTimeout(() => {
          this._Reset();
        }, 2000);
      }
    }

    this._astarRenderer.Update(null);

    this._previousFrame = currentFrame;
  }
}

const _GAME = new MazeGenDemo();
