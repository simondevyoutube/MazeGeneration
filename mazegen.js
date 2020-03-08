export const mazegen = (function() {

  function RouletteSelect(src) {
    const roll = Math.random() * src.length;

    let sum = 0;
    for (let i = 0; i < src.length; i++) {
      sum += 1.0;
      if (roll < sum) {
        const res = src[i];
        src = src.splice(i, 1);
        return res;
      }
    }
  }

  function _Key(x, y) {
    return x + '.' + y;
  }

  return {
    MazeGenerator: class {
      constructor(nodes) {
        this._nodes = nodes;
        this._visited = {};
      }

      *GenerateIteratively(nodeKey) {
        this._visited[nodeKey] = true;

        const node = this._nodes[nodeKey];

        node.metadata.render.visited = true;
        node.metadata.render.active = true;

        const neighbours = [...node.potentialEdges];
        while (neighbours.length > 0) {
          const ki = RouletteSelect(neighbours);

          if (!(ki in this._visited)) {
            node.metadata.render.active = true;

            const adjNode = this._nodes[ki];

            yield;
            node.edges.push(ki);
            adjNode.edges.push(nodeKey);
            node.metadata.render.active = false;
            yield* this.GenerateIteratively(ki);
            node.metadata.render.active = true;
          }
        }

        yield;
        node.metadata.render.active = false;
      }

      GenerateMaze(start) {
        this._ProcessNode(start);
      }

      _ProcessNode(nodeKey) {
        this._visited[nodeKey] = true;

        const node = this._nodes[nodeKey];

        const neighbours = [...node.potentialEdges];
        while (neighbours.length > 0) {
          const ki = RouletteSelect(neighbours);

          if (!(ki in this._visited)) {
            const adjNode = this._nodes[ki];

            node.edges.push(ki);
            adjNode.edges.push(nodeKey);
            this._ProcessNode(ki);
          }
        }
      }
    }
  };
})();
