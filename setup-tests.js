import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "node:util";

// O jsdom do Jest não expõe TextEncoder/TextDecoder, que existem em qualquer
// navegador de verdade. O react-router usa os dois ao carregar, e sem este
// remendo qualquer teste que importe o router quebra antes de rodar.
if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}
