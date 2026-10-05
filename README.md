# Resequence

Resequence is music as code. You write a piece as a TypeScript program: the notes and patterns say what to play and when, and a graph of generators and effects says how it sounds. Resequence plays the result in the browser with the Web Audio API, and the Studio app opens and plays compositions.

## Packages

- [resequence](packages/resequence/README.md): the framework, which combines patterns and the audio graph.
- [patterns](packages/patterns/README.md): notes, sequences, layers and modifiers.
- [web-au](packages/web-au/README.md): audio units for Web Audio.

## Interface

The public interface is the `resequence` package. See [its README](packages/resequence/README.md) for installation and usage.

## License

[MIT](LICENSE)
